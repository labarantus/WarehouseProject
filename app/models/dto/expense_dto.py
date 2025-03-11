from datetime import datetime

from pydantic import BaseModel


class ExpenseBase(BaseModel):
    """ DTO для добавление косвенных затрат"""
    name: str
    cost: float
    id_user: int
    description: str


class ExpenseDTO(ExpenseBase):
    id: int
    created_on: datetime
