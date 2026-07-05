"""
Unit-cost engine — derives an article's per-pair production cost from its
work-stage time study (services/articles.py) and the factory's cost
settings (services/settings.py).

All per-pair figures below are volume-independent: they express cost per
pair as (person-seconds of work per pair) x (wage per second), so they
don't depend on an assumed daily production quantity. Staffing/breakeven
calculators that DO need a daily quantity are a later phase.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.articles import WorkStage
from models.settings import ExpenseLineItem
from services.articles import get_article
from services.settings import get_current_cost_settings

SECONDS_PER_HOUR = 3600
HOURS_PER_DAY = 8


def _stage_seconds_per_pair(stage: WorkStage) -> float:
    """Stopwatch time for one pair, with fatigue allowance applied."""
    if not stage.seconds_per_10_pieces:
        return 0.0
    seconds_per_piece = float(stage.seconds_per_10_pieces) / 10
    allowed_seconds_per_piece = seconds_per_piece * (1 + float(stage.fatigue_allowance_pct) / 100)
    pieces_per_pair = 1 if stage.applies_per == "pair" else 2
    return allowed_seconds_per_piece * pieces_per_pair


def _wage_per_second(monthly_wage: float, working_days_per_month: int) -> float:
    return monthly_wage / (working_days_per_month * HOURS_PER_DAY * SECONDS_PER_HOUR)


def compute_unit_cost(article_id: int, factory_id: int, sourcing: str, db: Session) -> dict:
    if sourcing not in ("in_house", "wfh"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_SOURCING")

    article = get_article(article_id, factory_id, db)
    settings = get_current_cost_settings(factory_id, db)
    stages = [s for s in article.work_stages if s.is_active]

    tailor_seconds = sum(_stage_seconds_per_pair(s) for s in stages if s.role == "tailor")
    helper_seconds = sum(_stage_seconds_per_pair(s) for s in stages if s.role == "helper")
    total_seconds = tailor_seconds + helper_seconds

    tailor_wage = float(settings.tailor_wage_wfh if sourcing == "wfh" else settings.tailor_wage_in_house)
    helper_wage = float(settings.helper_wage_wfh if sourcing == "wfh" else settings.helper_wage_in_house)
    working_days = settings.working_days_per_month

    tailor_cost = tailor_seconds * _wage_per_second(tailor_wage, working_days)
    helper_cost = helper_seconds * _wage_per_second(helper_wage, working_days)
    labor_cost = tailor_cost + helper_cost

    esi_pf_cost = labor_cost * float(settings.esi_pf_pct) / 100

    # FTE-equivalent consumed per pair — used to spread annual bonus/overhead/snacks,
    # scale-invariant (independent of any assumed daily production volume).
    fte_equivalent_per_pair = total_seconds / (HOURS_PER_DAY * SECONDS_PER_HOUR)

    # Snacks: a per-day-per-staff cost, so it scales with FTE directly with no
    # working-days multiplier — the source sheet computes this two different,
    # mutually inconsistent ways (one uses 24 days, the other 25); this is the
    # day-count-independent version, matching its cleaner formulation.
    snacks_cost = fte_equivalent_per_pair * float(settings.snacks_amount_per_day)

    variable_cost = labor_cost + esi_pf_cost + snacks_cost  # scales with volume — excludes fixed overhead/margin

    festival_bonus_cost = labor_cost * float(settings.festival_bonus_pct) / 100 / 12
    # festival_sweet_amount is ₹/FTE/year; fte_equivalent_per_pair is in workdays-per-pair,
    # so converting to a per-pair cost needs /working_days_per_month/12 (an FTE-year of
    # cost spread over a year's worth of workdays), not just /12 — same working-days
    # normalization overhead_cost below uses.
    festival_sweet_cost = fte_equivalent_per_pair * float(settings.festival_sweet_amount) / working_days / 12

    overhead_total = _get_total_overhead(factory_id, db)
    overhead_cost = (
        fte_equivalent_per_pair / settings.total_staff_capacity * overhead_total / working_days
        if settings.total_staff_capacity
        else 0.0
    )

    subtotal = variable_cost + festival_bonus_cost + festival_sweet_cost + overhead_cost
    margin_amount = subtotal * float(settings.margin_pct) / 100
    unit_cost = subtotal + margin_amount

    rate_company = float(article.rate_company) if article.rate_company is not None else None
    profit_per_pair = (rate_company - unit_cost) if rate_company is not None else None

    return {
        "sourcing": sourcing,
        "tailor_seconds_per_pair": round(tailor_seconds, 2),
        "helper_seconds_per_pair": round(helper_seconds, 2),
        "tailor_labor_cost": round(tailor_cost, 4),
        "helper_labor_cost": round(helper_cost, 4),
        "labor_cost": round(labor_cost, 4),
        "esi_pf_cost": round(esi_pf_cost, 4),
        "snacks_cost": round(snacks_cost, 4),
        "variable_cost": round(variable_cost, 4),
        "festival_bonus_cost": round(festival_bonus_cost, 4),
        "festival_sweet_cost": round(festival_sweet_cost, 4),
        "overhead_cost": round(overhead_cost, 4),
        "margin_amount": round(margin_amount, 4),
        "unit_cost": round(unit_cost, 4),
        "rate_company": rate_company,
        "profit_per_pair": round(profit_per_pair, 4) if profit_per_pair is not None else None,
    }


def _staffing_for_daily_pairs(article, daily_pairs: float) -> dict:
    """
    Tailor/helper headcount needed to produce `daily_pairs` pairs/day of this
    article, given its work-stage time study. Mirrors EXPENSES!K10:K12 (or
    G11:G13 for the breakeven case) — FTE per role scaled to a daily volume.
    """
    stages = [s for s in article.work_stages if s.is_active]
    tailor_seconds = sum(_stage_seconds_per_pair(s) for s in stages if s.role == "tailor")
    helper_seconds = sum(_stage_seconds_per_pair(s) for s in stages if s.role == "helper")
    denom = HOURS_PER_DAY * SECONDS_PER_HOUR
    tailor_fte = tailor_seconds * daily_pairs / denom
    helper_fte = helper_seconds * daily_pairs / denom
    return {
        "tailor_staff_needed": round(tailor_fte, 2),
        "helper_staff_needed": round(helper_fte, 2),
        "total_staff_needed": round(tailor_fte + helper_fte, 2),
    }


def compute_breakeven(article_id: int, factory_id: int, sourcing: str, db: Session) -> dict:
    """
    Pairs/day of this article needed to cover total factory overhead, using
    contribution margin (rate_company - variable cost). Mirrors the
    EXPENSES sheet's breakeven section: overhead is a fixed monthly cost,
    so it's spread over however many pairs/day clear the margin. Also
    returns the tailor/helper headcount needed to hit that volume.
    """
    article = get_article(article_id, factory_id, db)
    cost = compute_unit_cost(article_id, factory_id, sourcing, db)
    if cost["rate_company"] is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="RATE_COMPANY_NOT_SET")

    settings = get_current_cost_settings(factory_id, db)
    overhead_total = _get_total_overhead(factory_id, db)
    contribution_margin = cost["rate_company"] - cost["variable_cost"]

    if contribution_margin <= 0:
        return {
            "sourcing": sourcing,
            "contribution_margin": round(contribution_margin, 4),
            "overhead_total": overhead_total,
            "breakeven_pairs_per_day": None,
            "tailor_staff_needed": None,
            "helper_staff_needed": None,
            "total_staff_needed": None,
            "message": "Rate (company) doesn't cover variable cost — can't break even at any volume.",
        }

    breakeven_pairs_per_day = overhead_total / contribution_margin / settings.working_days_per_month
    staffing = _staffing_for_daily_pairs(article, breakeven_pairs_per_day)

    return {
        "sourcing": sourcing,
        "contribution_margin": round(contribution_margin, 4),
        "overhead_total": overhead_total,
        "breakeven_pairs_per_day": round(breakeven_pairs_per_day, 1),
        "message": None,
        **staffing,
    }


def compute_profit_goal(
    article_id: int, factory_id: int, sourcing: str, target_profit_monthly: float, db: Session
) -> dict:
    """
    Pairs/day (and staffing) needed to cover overhead AND clear a target
    monthly profit. Mirrors EXPENSES!I3:K12's "PROFIT GOALS" section —
    same as breakeven, but with the target profit added to the numerator.
    """
    article = get_article(article_id, factory_id, db)
    cost = compute_unit_cost(article_id, factory_id, sourcing, db)
    if cost["rate_company"] is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="RATE_COMPANY_NOT_SET")

    settings = get_current_cost_settings(factory_id, db)
    overhead_total = _get_total_overhead(factory_id, db)
    contribution_margin = cost["rate_company"] - cost["variable_cost"]

    if contribution_margin <= 0:
        return {
            "sourcing": sourcing,
            "target_profit_monthly": target_profit_monthly,
            "contribution_margin": round(contribution_margin, 4),
            "overhead_total": overhead_total,
            "pairs_per_day": None,
            "tailor_staff_needed": None,
            "helper_staff_needed": None,
            "total_staff_needed": None,
            "message": "Rate (company) doesn't cover variable cost — no volume clears this goal.",
        }

    pairs_per_day = (overhead_total + target_profit_monthly) / contribution_margin / settings.working_days_per_month
    staffing = _staffing_for_daily_pairs(article, pairs_per_day)

    return {
        "sourcing": sourcing,
        "target_profit_monthly": target_profit_monthly,
        "contribution_margin": round(contribution_margin, 4),
        "overhead_total": overhead_total,
        "pairs_per_day": round(pairs_per_day, 1),
        "message": None,
        **staffing,
    }


def compute_throughput(article_id: int, factory_id: int, db: Session) -> list[dict]:
    """
    Pieces producible per stage by one worker in a shift, at the studied
    rate (stopwatch time + fatigue allowance). Mirrors the STUDY sheet —
    used to set daily quotas/targets per worker per stage.
    """
    article = get_article(article_id, factory_id, db)
    stages = [s for s in article.work_stages if s.is_active]

    result = []
    for stage in stages:
        seconds_per_piece = 0.0
        if stage.seconds_per_10_pieces:
            seconds_per_piece = (float(stage.seconds_per_10_pieces) / 10) * (
                1 + float(stage.fatigue_allowance_pct) / 100
            )
        pieces_per_hour = (SECONDS_PER_HOUR / seconds_per_piece) if seconds_per_piece else 0.0

        result.append({
            "stage_id": stage.id,
            "name": stage.name,
            "role": stage.role,
            "pieces_per_1h": round(pieces_per_hour, 1),
            "pieces_per_2h": round(pieces_per_hour * 2, 1),
            "pieces_per_5h": round(pieces_per_hour * 5, 1),
            "pieces_per_8h": round(pieces_per_hour * 8, 1),
        })
    return result


def estimate_batch_time(
    article_id: int, stage_id: int, factory_id: int, staff_count: int, quantity_pairs: int, db: Session
) -> dict:
    """
    Time needed for `staff_count` workers to complete `quantity_pairs` pairs
    of a given stage, working in parallel. Mirrors the IRL sheet's
    scheduling calculator.
    """
    article = get_article(article_id, factory_id, db)
    stage = next((s for s in article.work_stages if s.id == stage_id and s.is_active), None)
    if not stage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="STAGE_NOT_FOUND")
    if staff_count <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="STAFF_COUNT_MUST_BE_POSITIVE")

    seconds_per_pair = _stage_seconds_per_pair(stage)
    total_seconds = (seconds_per_pair * quantity_pairs) / staff_count

    return {
        "stage_id": stage.id,
        "stage_name": stage.name,
        "staff_count": staff_count,
        "quantity_pairs": quantity_pairs,
        "seconds": round(total_seconds, 1),
        "minutes": round(total_seconds / 60, 2),
        "hours": round(total_seconds / 3600, 3),
    }


def _get_total_overhead(factory_id: int, db: Session) -> float:
    total = (
        db.query(ExpenseLineItem)
        .filter(ExpenseLineItem.factory_id == factory_id, ExpenseLineItem.is_active == True)
        .all()
    )
    return sum(float(e.amount) for e in total)
