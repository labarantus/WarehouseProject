from pydantic import BaseModel


class UserDTO(BaseModel):
    id: int
    login: str
    password: str
    role: int
