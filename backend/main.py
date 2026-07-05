from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import (
    auth,
    articles,
    raw_materials,
    providers,
    inward,
    inventory,
    production,
    qc,
    outward,
    employees,
    payroll,
    dashboard,
    reports,
    settings,
    factories,
)

app = FastAPI(title="Padaraksha API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://padaraksha-dev.kuteerakitchen.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(articles.router, prefix="/articles", tags=["articles"])
app.include_router(raw_materials.router, prefix="/raw-materials", tags=["raw-materials"])
app.include_router(providers.router, prefix="/providers", tags=["providers"])
app.include_router(inward.router, prefix="", tags=["inward"])
app.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
app.include_router(production.router, prefix="", tags=["production"])
app.include_router(qc.router, prefix="/qc-inspections", tags=["qc"])
app.include_router(outward.router, prefix="/outward-deliveries", tags=["outward"])
app.include_router(employees.router, prefix="/employees", tags=["employees"])
app.include_router(payroll.router, prefix="/payroll", tags=["payroll"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])
app.include_router(settings.router, prefix="/settings", tags=["settings"])
app.include_router(factories.router, prefix="/factories", tags=["factories"])


@app.get("/health")
def health():
    return {"status": "ok"}
