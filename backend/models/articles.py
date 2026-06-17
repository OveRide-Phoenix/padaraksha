from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import relationship

from database import Base


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    article_number = Column(String(60), nullable=False)
    name = Column(String(120))
    description = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    variants = relationship("ArticleVariant", back_populates="article")
    bom_items = relationship("BomItem", back_populates="article")
    work_stages = relationship("WorkStage", back_populates="article")


class ArticleVariant(Base):
    __tablename__ = "article_variants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    colour = Column(String(60))
    size = Column(String(20))
    gender = Column(Enum("men", "women", "kids", "unisex"), default="unisex", nullable=False)
    foot = Column(Enum("left", "right", "pair"), default="pair", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    article = relationship("Article", back_populates="variants")


class RawMaterial(Base):
    __tablename__ = "raw_materials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    name = Column(String(120), nullable=False)
    unit = Column(String(20), default="piece", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    bom_items = relationship("BomItem", back_populates="raw_material")


class BomItem(Base):
    __tablename__ = "bom_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    raw_material_id = Column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    quantity = Column(Numeric(10, 4), nullable=False)
    valid_from = Column(DateTime, server_default=func.now(), nullable=False)
    valid_to = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    article = relationship("Article", back_populates="bom_items")
    raw_material = relationship("RawMaterial", back_populates="bom_items")


class WorkStage(Base):
    __tablename__ = "work_stages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    name = Column(String(120), nullable=False)
    sequence_order = Column(Integer, default=1, nullable=False)
    is_parallel = Column(Boolean, default=False, nullable=False)
    pay_rate = Column(Numeric(10, 2), default=0, nullable=False)
    valid_from = Column(DateTime, server_default=func.now(), nullable=False)
    valid_to = Column(DateTime)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    article = relationship("Article", back_populates="work_stages")
