from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.packages.p4_gestion_compras_reservas.schemas.order_schema import PaymentMethodEnum, PaymentStatusEnum


class SaleStatusEnum(str, Enum):
    completed = "completed"
    cancelled = "cancelled"


class SaleTypeEnum(str, Enum):
    in_person = "venta presencial"
    online = "venta virtual"


class SaleItemCreate(BaseModel):
    variant_id: UUID
    quantity: int = Field(gt=0)


class SaleCreate(BaseModel):
    branch_id: UUID | None = None
    reservation_id: UUID | None = None
    payment_method: PaymentMethodEnum = PaymentMethodEnum.cash
    cash_reference: str | None = None
    client_sale_id: UUID | None = None
    is_offline: bool = False
    items: list[SaleItemCreate] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_items_or_reservation(self):
        if self.is_offline and self.payment_method != PaymentMethodEnum.cash:
            raise ValueError("Por política de seguridad contable (Política 5), las ventas en modo offline deben ser exclusivamente en efectivo (cash).")
        if self.reservation_id:
            raise ValueError("CU18 no permite ventas asociadas a reservas")
        if self.payment_method != PaymentMethodEnum.cash:
            raise ValueError("Las ventas directas solo aceptan efectivo")
        if not self.items:
            raise ValueError("La venta no tiene items")
        return self


class SaleItemRead(BaseModel):
    id: UUID
    sale_id: UUID
    variant_id: UUID
    quantity: int
    unit_price: Decimal
    original_unit_price: Decimal | None = None
    discount_amount: Decimal = Decimal("0.00")
    line_total: Decimal
    product_id: UUID
    product_name: str
    variant_sku: str
    size_id: UUID | None = None
    color_id: UUID | None = None
    size_name: str | None = None
    color_name: str | None = None
    image_url: str | None = None
    image_public_id: str | None = None

    model_config = {"from_attributes": True}


class SaleRead(BaseModel):
    id: UUID
    branch_id: UUID
    branch_name: str
    type: SaleTypeEnum
    user_id: UUID
    reservation_id: UUID | None = None
    client_sale_id: UUID | None = None
    is_offline: bool = False
    synced_at: datetime | None = None
    status: SaleStatusEnum
    payment_method: PaymentMethodEnum
    payment_status: PaymentStatusEnum
    cash_reference: str | None = None
    subtotal: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    currency: str
    created_at: datetime
    updated_at: datetime | None = None
    items: list[SaleItemRead] = Field(default_factory=list)

    model_config = {"from_attributes": True}


# =========================================================================
# LÓGICA DEL CU14: Esquemas de Verificación de Estado Outbox
# =========================================================================
class OfflineStatusCheckRequest(BaseModel):
    client_sale_ids: list[UUID] = Field(default_factory=list)


class OfflineStatusCheckResponse(BaseModel):
    synced_ids: list[UUID] = Field(default_factory=list)
    missing_ids: list[UUID] = Field(default_factory=list)
