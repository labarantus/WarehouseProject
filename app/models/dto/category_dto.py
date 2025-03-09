from pydantic import BaseModel


class CategoryBase(BaseModel):
    name: str


class CategoryDTO(CategoryBase):
    id: int
