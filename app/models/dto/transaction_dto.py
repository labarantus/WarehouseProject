from datetime import datetime

from pydantic import BaseModel


class TransactionBase(BaseModel):
    id_type: int
    id_purchase: int
    amount: int
    id_user: int


class TransactionDTO(TransactionBase):
    id: int
    created_on: datetime


class TypeTransactionDTO(BaseModel):
    id: int
    name: int
