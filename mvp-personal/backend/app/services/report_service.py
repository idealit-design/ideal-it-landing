from datetime import date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import BiometricMark, Leave, Person


def weekdays_for_week(anchor: date) -> list[date]:
    monday = anchor - timedelta(days=anchor.weekday())
    return [monday + timedelta(days=offset) for offset in range(5)]


def report_for_dates(session: Session, dates: list[date]) -> list[dict[str, object]]:
    if not dates:
        return []

    people = session.scalars(
        select(Person).where(Person.activo.is_(True)).order_by(Person.apellido, Person.nombre)
    ).all()
    start = datetime.combine(dates[0], time.min)
    end = datetime.combine(dates[-1] + timedelta(days=1), time.min)
    marks_by_dni_and_day: dict[tuple[str, date], list[BiometricMark]] = {}
    for mark in session.scalars(
        select(BiometricMark)
        .where(
            BiometricMark.marca_tiempo >= start,
            BiometricMark.marca_tiempo < end,
            BiometricMark.estado_verificacion == "VERIFIED",
        )
        .order_by(BiometricMark.marca_tiempo)
    ):
        marks_by_dni_and_day.setdefault((mark.dni, mark.marca_tiempo.date()), []).append(mark)

    approved_leaves = session.scalars(
        select(Leave).where(
            Leave.estado == "APPROVED",
            Leave.fecha_inicio <= dates[-1],
            Leave.fecha_fin >= dates[0],
        )
    ).all()
    leave_by_dni: dict[str, list[Leave]] = {}
    for leave in approved_leaves:
        leave_by_dni.setdefault(leave.dni, []).append(leave)

    rows: list[dict[str, object]] = []
    for report_date in dates:
        for person in people:
            marks = marks_by_dni_and_day.get((person.dni, report_date), [])
            leave = next(
                (
                    item
                    for item in leave_by_dni.get(person.dni, [])
                    if item.fecha_inicio <= report_date <= item.fecha_fin
                ),
                None,
            )
            if any(mark.tipo_evento == "ENTRADA" for mark in marks):
                status = "PRESENTE"
            elif leave:
                status = "JUSTIFICADA"
            else:
                status = "AUSENTE"
            rows.append(
                {
                    "dni": person.dni,
                    "fecha": report_date.isoformat(),
                    "estado": status,
                    "tipo_licencia": leave.tipo if leave else None,
                    "entrada": next(
                        (mark.marca_tiempo.isoformat() for mark in marks if mark.tipo_evento == "ENTRADA"),
                        None,
                    ),
                    "salida": next(
                        (
                            mark.marca_tiempo.isoformat()
                            for mark in reversed(marks)
                            if mark.tipo_evento == "SALIDA"
                        ),
                        None,
                    ),
                    "marcas": len(marks),
                }
            )
    return rows
