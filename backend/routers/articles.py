from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Literal

from database import get_db
from schemas.articles import (
    ArticleCreate,
    ArticleUpdate,
    ArticleVariantCreate,
    BomItemCreate,
    WorkStageCreate,
)
from schemas.auth import CurrentUser
from services import articles as articles_service
from services import costing as costing_service
from utils.dependencies import get_current_user

router = APIRouter()


def _article_out(article):
    return {
        "id": article.id,
        "article_number": article.article_number,
        "name": article.name,
        "description": article.description,
        "mrp": float(article.mrp) if article.mrp is not None else None,
        "rate_company": float(article.rate_company) if article.rate_company is not None else None,
        "is_active": article.is_active,
        "variants": [
            {
                "id": v.id,
                "colour": v.colour,
                "size": v.size,
                "gender": v.gender,
                "foot": v.foot,
                "is_active": v.is_active,
            }
            for v in article.variants
        ],
        "bom_items": [
            {
                "id": b.id,
                "raw_material_id": b.raw_material_id,
                "raw_material_name": b.raw_material.name,
                "unit": b.raw_material.unit,
                "quantity": float(b.quantity),
                "valid_from": b.valid_from.isoformat(),
                "valid_to": b.valid_to.isoformat() if b.valid_to else None,
            }
            for b in article.bom_items
            if b.valid_to is None  # only current BOM rows
        ],
        "work_stages": [
            {
                "id": s.id,
                "name": s.name,
                "role": s.role,
                "applies_per": s.applies_per,
                "seconds_per_10_pieces": float(s.seconds_per_10_pieces) if s.seconds_per_10_pieces is not None else None,
                "fatigue_allowance_pct": float(s.fatigue_allowance_pct),
                "pay_rate_in_house": float(s.pay_rate_in_house),
                "pay_rate_wfh": float(s.pay_rate_wfh),
                "sequence_order": s.sequence_order,
                "is_parallel": s.is_parallel,
                "is_active": s.is_active,
                "valid_from": s.valid_from.isoformat(),
                "valid_to": s.valid_to.isoformat() if s.valid_to else None,
            }
            for s in article.work_stages
            if s.is_active
        ],
    }


@router.get("")
def list_articles(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    articles = articles_service.list_articles(current_user.factory_id, db)
    return {
        "success": True,
        "data": [
            {
                "id": a.id,
                "article_number": a.article_number,
                "name": a.name,
                "is_active": a.is_active,
                "variant_count": len(a.variants),
            }
            for a in articles
        ],
        "message": "",
    }


@router.post("")
def create_article(
    body: ArticleCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    article = articles_service.create_article(current_user.factory_id, body, db)
    return {"success": True, "data": _article_out(article), "message": "Article created"}


@router.get("/{article_id}")
def get_article(
    article_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    article = articles_service.get_article(article_id, current_user.factory_id, db)
    return {"success": True, "data": _article_out(article), "message": ""}


@router.put("/{article_id}")
def update_article(
    article_id: int,
    body: ArticleUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    article = articles_service.update_article(article_id, current_user.factory_id, body, db)
    return {"success": True, "data": _article_out(article), "message": "Article updated"}


@router.delete("/{article_id}")
def delete_article(
    article_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    articles_service.delete_article(article_id, current_user.factory_id, db)
    return {"success": True, "data": None, "message": "Article deleted"}


@router.post("/{article_id}/bom")
def upsert_bom(
    article_id: int,
    body: BomItemCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add or update a BOM item. Closes old row and creates new one to preserve history."""
    item = articles_service.upsert_bom_item(article_id, current_user.factory_id, body, db)
    return {"success": True, "data": {"id": item.id}, "message": "BOM updated"}


@router.post("/{article_id}/stages")
def add_stage(
    article_id: int,
    body: WorkStageCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stage = articles_service.add_work_stage(article_id, current_user.factory_id, body, db)
    return {"success": True, "data": {"id": stage.id}, "message": "Stage added"}


@router.delete("/{article_id}/stages/{stage_id}")
def delete_stage(
    article_id: int,
    stage_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    articles_service.delete_work_stage(article_id, stage_id, current_user.factory_id, db)
    return {"success": True, "data": None, "message": "Stage deleted"}


@router.post("/{article_id}/variants")
def add_variant(
    article_id: int,
    body: ArticleVariantCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    variant = articles_service.add_variant(article_id, current_user.factory_id, body, db)
    return {"success": True, "data": {"id": variant.id}, "message": "Variant added"}


@router.get("/{article_id}/costing")
def get_costing(
    article_id: int,
    sourcing: Literal["in_house", "wfh"] = Query(default="in_house"),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = costing_service.compute_unit_cost(article_id, current_user.factory_id, sourcing, db)
    return {"success": True, "data": data, "message": ""}


@router.get("/{article_id}/breakeven")
def get_breakeven(
    article_id: int,
    sourcing: Literal["in_house", "wfh"] = Query(default="in_house"),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = costing_service.compute_breakeven(article_id, current_user.factory_id, sourcing, db)
    return {"success": True, "data": data, "message": ""}


@router.get("/{article_id}/profit-goal")
def get_profit_goal(
    article_id: int,
    target_profit_monthly: float = Query(default=0.0),
    sourcing: Literal["in_house", "wfh"] = Query(default="in_house"),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = costing_service.compute_profit_goal(
        article_id, current_user.factory_id, sourcing, target_profit_monthly, db
    )
    return {"success": True, "data": data, "message": ""}


@router.get("/{article_id}/throughput")
def get_throughput(
    article_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = costing_service.compute_throughput(article_id, current_user.factory_id, db)
    return {"success": True, "data": data, "message": ""}


@router.get("/{article_id}/stages/{stage_id}/estimate-time")
def get_estimate_time(
    article_id: int,
    stage_id: int,
    staff_count: int = Query(default=1, ge=1),
    quantity_pairs: int = Query(default=0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = costing_service.estimate_batch_time(
        article_id, stage_id, current_user.factory_id, staff_count, quantity_pairs, db
    )
    return {"success": True, "data": data, "message": ""}
