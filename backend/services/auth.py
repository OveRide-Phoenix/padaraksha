from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.auth import Factory, User
from schemas.auth import LoginRequest, TokenResponse
from utils.security import create_access_token, verify_password


def get_factories(db: Session) -> list[Factory]:
    return db.query(Factory).filter(Factory.is_active == True).all()


def login(request: LoginRequest, db: Session) -> TokenResponse:
    """
    Authenticate a user against a specific factory.
    factory_id scopes the lookup so the same username can exist in different factories.
    """
    factory = db.query(Factory).filter(
        Factory.id == request.factory_id, Factory.is_active == True
    ).first()
    if not factory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="FACTORY_NOT_FOUND",
        )

    user = db.query(User).filter(
        User.factory_id == request.factory_id,
        User.username == request.username,
        User.is_active == True,
    ).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="INVALID_CREDENTIALS",
        )

    token = create_access_token({
        "sub": str(user.id),
        "factory_id": str(factory.id),
        "role": user.role.name,
    })

    return TokenResponse(
        access_token=token,
        factory_id=factory.id,
        factory_name=factory.name,
        user_id=user.id,
        full_name=user.full_name,
        role=user.role.name,
    )
