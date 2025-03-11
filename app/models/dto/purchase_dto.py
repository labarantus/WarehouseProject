from datetime import datetime

from pydantic import BaseModel


class PurchaseBase(BaseModel):
    """ DTO для добавление закупки товара"""
    product_id: int
    purchase_price: float
    id_warehouse: int
    count: int
    current_count: int


class PurchaseDTO(PurchaseBase):
    id: int
    selling_price: float
    created_on: datetime
