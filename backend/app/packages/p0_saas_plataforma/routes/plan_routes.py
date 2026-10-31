from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.packages.p0_saas_plataforma.models.plan import Plan
from app.packages.p0_saas_plataforma.schemas.plan_schema import PlanCreate, PlanRead
from app.utils.response import response

router = APIRouter(prefix="/saas/plans", tags=["SaaS Plans"])


@router.get("", summary="Listar planes comerciales disponibles")
def list_plans(db: Session = Depends(get_db)):
    plans = db.query(Plan).filter(Plan.is_active.is_(True)).order_by(Plan.price_monthly.asc()).all()
    # Si la base de datos no tiene planes aun, sembramos los tres oficiales de catedra
    if not plans:
        basic = Plan(
            name="BASICO",
            code="basic",
            description="Plan esencial para boutiques individuales. Incluye hasta 3 sucursales activas y gestion estandar de inventario y ventas POS.",
            max_branches=3,
            has_ai_access=False,
            price_monthly=29.00,
        )
        pro = Plan(
            name="PROFESIONAL",
            code="pro",
            description="Plan avanzado para marcas en expansion. Incluye hasta 10 sucursales activas, analitica predictiva y asistente de voz con Gemini IA.",
            max_branches=10,
            has_ai_access=True,
            price_monthly=99.00,
        )
        enterprise = Plan(
            name="EMPRESARIAL",
            code="enterprise",
            description="Plan corporativo para grandes cadenas. Incluye hasta 25 sucursales activas, analitica predictiva avanzada, Gemini IA y copias de seguridad continuas.",
            max_branches=25,
            has_ai_access=True,
            price_monthly=199.00,
        )
        db.add_all([basic, pro, enterprise])
        db.commit()
        plans = [basic, pro, enterprise]

    data = [PlanRead.model_validate(p).model_dump() for p in plans]
    return response(
        status_code=status.HTTP_200_OK,
        message="Planes obtenidos exitosamente",
        data=data,
    )


@router.post("", summary="Crear un nuevo plan comercial (Superadmin)")
def create_plan(plan_in: PlanCreate, db: Session = Depends(get_db)):
    existing = db.query(Plan).filter(Plan.code == plan_in.code.strip().lower()).first()
    if existing:
        return response(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=f"El plan con codigo '{plan_in.code}' ya existe",
            data=None,
        )

    plan = Plan(
        name=plan_in.name.strip(),
        code=plan_in.code.strip().lower(),
        description=plan_in.description,
        max_branches=plan_in.max_branches,
        has_ai_access=plan_in.has_ai_access,
        price_monthly=plan_in.price_monthly,
        is_active=plan_in.is_active,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return response(
        status_code=status.HTTP_201_CREATED,
        message="Plan creado exitosamente",
        data=PlanRead.model_validate(plan).model_dump(),
    )
