from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import CurrentUser
from services.payroll import PayrollCalculateRequest, PayrollRunRequest
from services import payroll as svc
from utils.dependencies import get_current_user

router = APIRouter()


@router.post("/calculate")
def calculate_payroll(
    body: PayrollCalculateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    preview = svc.preview_payroll(current_user.factory_id, body, db)
    return {"success": True, "data": preview, "message": ""}


@router.post("/run")
def run_payroll(
    body: PayrollRunRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    run = svc.run_payroll(current_user.factory_id, body, db)
    return {
        "success": True,
        "data": {
            "id": run.id,
            "period_start": run.period_start.isoformat(),
            "period_end": run.period_end.isoformat(),
            "finalized": run.finalized,
        },
        "message": "Payroll run saved",
    }


@router.get("/runs")
def list_payroll_runs(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = svc.list_payroll_runs(current_user.factory_id, db)
    return {"success": True, "data": data, "message": ""}


@router.get("/runs/{run_id}")
def get_payroll_run(
    run_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = svc.get_payroll_run_detail(run_id, current_user.factory_id, db)
    return {"success": True, "data": data, "message": ""}
