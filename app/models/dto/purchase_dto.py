from datetime import datetime

from pydantic import BaseModel


class PurchaseBase(BaseModel):
    """ DTO для добавление закупки товара"""
    id_product: int
    purchase_price: float
    id_warehouse: int
    count: int
    id_user: int


class PurchaseDTO(PurchaseBase):
    id: int
    selling_price: float
    current_count: int
    created_on: datetime
