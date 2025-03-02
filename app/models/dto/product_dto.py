from datetime import datetime

from pydantic import BaseModel


class ProductDTO(BaseModel):
    """ DTO для добавления нового населённого пункта """
    id: int
    name: str
    price: float
    id_warehouse: int
    category: int
    created_on: datetime
    count: int
