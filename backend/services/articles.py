from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.articles import Article, ArticleVariant, BomItem, RawMaterial, WorkStage
from schemas.articles import (
    ArticleCreate,
    ArticleUpdate,
    BomItemCreate,
    WorkStageCreate,
    ArticleVariantCreate,
)


def list_articles(factory_id: int, db: Session) -> list[Article]:
    """Return all articles scoped to this factory."""
    return db.query(Article).filter(Article.factory_id == factory_id).all()


def get_article(article_id: int, factory_id: int, db: Session) -> Article:
    article = db.query(Article).filter(
        Article.id == article_id, Article.factory_id == factory_id
    ).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ARTICLE_NOT_FOUND")
    return article


def create_article(factory_id: int, data: ArticleCreate, db: Session) -> Article:
    existing = db.query(Article).filter(
        Article.factory_id == factory_id,
        Article.article_number == data.article_number,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="ARTICLE_NUMBER_EXISTS",
        )

    article = Article(
        factory_id=factory_id,
        article_number=data.article_number,
        name=data.name,
        description=data.description,
    )
    db.add(article)
    db.flush()

    for v in data.variants:
        db.add(ArticleVariant(article_id=article.id, **v.model_dump()))

    db.commit()
    db.refresh(article)
    return article


def update_article(article_id: int, factory_id: int, data: ArticleUpdate, db: Session) -> Article:
    article = get_article(article_id, factory_id, db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(article, field, value)
    db.commit()
    db.refresh(article)
    return article


def upsert_bom_item(article_id: int, factory_id: int, data: BomItemCreate, db: Session) -> BomItem:
    """
    Add or replace a BOM item for an article.
    When a raw material's quantity changes mid-production, the old BOM row is
    closed (valid_to set) and a new row is opened — preserving history.
    """
    get_article(article_id, factory_id, db)

    raw_mat = db.query(RawMaterial).filter(
        RawMaterial.id == data.raw_material_id,
        RawMaterial.factory_id == factory_id,
    ).first()
    if not raw_mat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RAW_MATERIAL_NOT_FOUND")

    # Close any open BOM row for this material on this article
    existing = db.query(BomItem).filter(
        BomItem.article_id == article_id,
        BomItem.raw_material_id == data.raw_material_id,
        BomItem.valid_to.is_(None),
    ).first()
    if existing:
        existing.valid_to = datetime.now(timezone.utc)

    new_item = BomItem(
        article_id=article_id,
        raw_material_id=data.raw_material_id,
        quantity=data.quantity,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


def add_work_stage(article_id: int, factory_id: int, data: WorkStageCreate, db: Session) -> WorkStage:
    get_article(article_id, factory_id, db)

    stage = WorkStage(article_id=article_id, **data.model_dump())
    db.add(stage)
    db.commit()
    db.refresh(stage)
    return stage


def delete_work_stage(article_id: int, stage_id: int, factory_id: int, db: Session) -> None:
    get_article(article_id, factory_id, db)

    stage = db.query(WorkStage).filter(
        WorkStage.id == stage_id,
        WorkStage.article_id == article_id,
    ).first()
    if not stage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="STAGE_NOT_FOUND")

    stage.is_active = False
    db.commit()


def add_variant(article_id: int, factory_id: int, data: ArticleVariantCreate, db: Session) -> ArticleVariant:
    get_article(article_id, factory_id, db)

    variant = ArticleVariant(article_id=article_id, **data.model_dump())
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant
