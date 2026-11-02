from fastapi import APIRouter

from app.packages.p5_gestion_ventas_pos.routes.sales_routes import router as sales_router
# logica del CU17: Router para Cambios de Prenda por Talla/Modelo con Cobro de Diferencia
from app.packages.p5_gestion_ventas_pos.routes.exchange_routes import router as exchange_router

p5_router = APIRouter()
p5_router.include_router(sales_router)
p5_router.include_router(exchange_router)

__all__ = ["p5_router"]
