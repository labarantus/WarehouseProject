from datetime import datetime

from pydantic import BaseModel


class ProductBase(BaseModel):
    """ DTO для добавления нового товара """
    name: str
    id_category: int


class ProductDTO(ProductBase):
    id: int
    purchase_id: int
    total: int

