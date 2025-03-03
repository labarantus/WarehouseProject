from datetime import datetime

from pydantic import BaseModel


class WarehouseBase(BaseModel):
    address: str
    name: str


class WarehouseDTO(WarehouseBase):
    id: int
    created_on: datetime
