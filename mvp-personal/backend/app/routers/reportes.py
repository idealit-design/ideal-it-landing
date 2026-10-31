from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.services.report_service import report_for_dates, weekdays_for_week

router = APIRouter(prefix="/api/reportes", tags=["Reportes"])


@router.get("/diario")
def daily_report(
    fecha: date | None = None, session: Session = Depends(get_session)
) -> dict[str, object]:
    report_date = fecha or date.today()
    working_day = report_date.weekday() < 5
    rows = report_for_dates(session, [report_date]) if working_day else []
    return {
        "fecha": report_date.isoformat(),
        "dia_habil": working_day,
        "registros": rows,
        "resumen": _summarize(rows),
    }


@router.get("/semanal")
def weekly_report(
    fecha: date | None = None, session: Session = Depends(get_session)
) -> dict[str, object]:
    report_dates = weekdays_for_week(fecha or date.today())
    rows = report_for_dates(session, report_dates)
    return {
        "desde": report_dates[0].isoformat(),
        "hasta": report_dates[-1].isoformat(),
        "dias_incluidos": [day.isoformat() for day in report_dates],
        "registros": rows,
        "resumen": _summarize(rows),
    }


def _summarize(rows: list[dict[str, object]]) -> dict[str, int]:
    return {
        status.lower(): sum(1 for row in rows if row["estado"] == status)
        for status in ("PRESENTE", "AUSENTE", "JUSTIFICADA")
    }
