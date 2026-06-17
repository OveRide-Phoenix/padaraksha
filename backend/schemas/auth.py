from pydantic import BaseModel


class FactoryOut(BaseModel):
    id: int
    name: str
    city: str | None = None
    state: str | None = None
    is_active: bool

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    factory_id: int
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    factory_id: int
    factory_name: str
    user_id: int
    full_name: str | None
    role: str


class CurrentUser(BaseModel):
    user_id: int
    factory_id: int
    role: str
