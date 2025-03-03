from pydantic import BaseModel


class CategoryBase(BaseModel):
    id_warehouse: int
    name: str


class CategoryDTO(CategoryBase):
    id: int

