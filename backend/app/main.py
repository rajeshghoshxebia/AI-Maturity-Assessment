import re

from fastapi import FastAPI, Request
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1.router import router as api_router
from app.core.config import settings

app = FastAPI(
    title="AI Maturity Assessment API",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url=None,
)


def _origin_allowed(origin: str) -> bool:
    """Check exact matches and wildcard patterns (e.g. https://*.vercel.app)."""
    for allowed in settings.cors_origins:
        if allowed == origin:
            return True
        if "*" in allowed:
            pattern = re.escape(allowed).replace(r"\*", "[^.]+")
            if re.fullmatch(pattern, origin):
                return True
    return False


class DynamicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")
        if request.method == "OPTIONS" and origin:
            if _origin_allowed(origin):
                return Response(
                    status_code=200,
                    headers={
                        "Access-Control-Allow-Origin": origin,
                        "Access-Control-Allow-Credentials": "true",
                        "Access-Control-Allow-Methods": "*",
                        "Access-Control-Allow-Headers": "*",
                        "Access-Control-Max-Age": "600",
                    },
                )
            return Response(status_code=403)

        response = await call_next(request)
        if origin and _origin_allowed(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        return response


app.add_middleware(DynamicCORSMiddleware)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
