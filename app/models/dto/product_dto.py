from datetime import datetime

from pydantic import BaseModel


class ProductBase(BaseModel):
    """ DTO для добавления нового населённого пункта """
    name: str
    price: float
    id_warehouse: int
    id_category: int
    count: int


class ProductDTO(ProductBase):
    """ DTO для добавления нового населённого пункта """
    id: int
    created_on: datetime
