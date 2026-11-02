FROM node:22-alpine AS frontend-build

WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FRIGORIFICO_DATABASE_PATH=/app/backend/data/db/frigorifico_app.db

WORKDIR /app/backend
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir --disable-pip-version-check -r /tmp/requirements.txt \
    && rm /tmp/requirements.txt \
    && mkdir -p /app/backend/data/db \
    && chown -R 10001:10001 /app

COPY --chown=10001:10001 backend/ /app/backend/
COPY --from=frontend-build --chown=10001:10001 /build/frontend/dist /app/frontend/dist

USER 10001:10001
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
