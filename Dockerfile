# Stage 1: compile React/Vite assets
FROM node:22-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html postcss.config.js tailwind.config.js vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

# Stage 2: serve frontend and Flask API from one HTTPS origin on Render
FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 \
    PORT=10000 \
    APP_ENV=production
WORKDIR /app
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt
COPY backend /app/backend
COPY --from=frontend /app/dist /app/dist
RUN useradd --create-home --uid 10001 krishinetra \
    && mkdir -p /app/backend/instance \
    && chown -R krishinetra:krishinetra /app/backend
USER krishinetra
WORKDIR /app/backend
EXPOSE 10000
CMD ["python", "app.py"]
