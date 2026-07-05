from datetime import datetime
from typing import Literal

from pydantic import BaseModel


# ── Raw Material ──────────────────────────────────────────────────────────────

class RawMaterialCreate(BaseModel):
    name: str
    unit: str = "piece"


class RawMaterialOut(BaseModel):
    id: int
    name: str
    unit: str
    is_active: bool

    model_config = {"from_attributes": True}


# ── BOM ───────────────────────────────────────────────────────────────────────

class BomItemCreate(BaseModel):
    raw_material_id: int
    quantity: float


class BomItemOut(BaseModel):
    id: int
    raw_material_id: int
    raw_material_name: str
    unit: str
    quantity: float
    valid_from: datetime
    valid_to: datetime | None = None

    model_config = {"from_attributes": True}


# ── Work Stage ────────────────────────────────────────────────────────────────

class WorkStageCreate(BaseModel):
    name: str
    role: Literal["tailor", "helper"] = "helper"
    applies_per: Literal["piece", "pair"] = "piece"
    seconds_per_10_pieces: float | None = None
    fatigue_allowance_pct: float = 5.0
    pay_rate_in_house: float = 0.0
    pay_rate_wfh: float = 0.0
    sequence_order: int = 1
    is_parallel: bool = False


class WorkStageOut(BaseModel):
    id: int
    name: str
    role: str
    applies_per: str
    seconds_per_10_pieces: float | None = None
    fatigue_allowance_pct: float
    pay_rate_in_house: float
    pay_rate_wfh: float
    sequence_order: int
    is_parallel: bool
    valid_from: datetime
    valid_to: datetime | None = None
    is_active: bool

    model_config = {"from_attributes": True}


# ── Article Variant ───────────────────────────────────────────────────────────

class ArticleVariantCreate(BaseModel):
    colour: str | None = None
    size: str | None = None
    gender: Literal["men", "women", "kids", "unisex"] = "unisex"
    foot: Literal["left", "right", "pair"] = "pair"


class ArticleVariantOut(BaseModel):
    id: int
    colour: str | None
    size: str | None
    gender: str
    foot: str
    is_active: bool

    model_config = {"from_attributes": True}


# ── Article ───────────────────────────────────────────────────────────────────

class ArticleCreate(BaseModel):
    article_number: str
    name: str | None = None
    description: str | None = None
    mrp: float | None = None
    rate_company: float | None = None
    variants: list[ArticleVariantCreate] = []


class ArticleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    mrp: float | None = None
    rate_company: float | None = None
    is_active: bool | None = None


class ArticleOut(BaseModel):
    id: int
    article_number: str
    name: str | None
    description: str | None
    mrp: float | None = None
    rate_company: float | None = None
    is_active: bool
    variants: list[ArticleVariantOut] = []
    bom_items: list[BomItemOut] = []
    work_stages: list[WorkStageOut] = []

    model_config = {"from_attributes": True}


class ArticleListItem(BaseModel):
    id: int
    article_number: str
    name: str | None
    is_active: bool
    variant_count: int = 0

    model_config = {"from_attributes": True}
