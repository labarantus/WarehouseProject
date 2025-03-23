import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routes import router, web_router
from pathlib import Path

# Инициализация FastAPI приложения
app = FastAPI()

# Подключаем API маршруты
app.include_router(router)

# Подключаем маршруты веб-страниц
app.include_router(web_router)

# Подключаем статические файлы
static_dir = Path(__file__).parent / "app" / "static"
app.mount("/static", StaticFiles(directory=static_dir), name="static")

if __name__ == "__main__":
    uvicorn.run(app, host='127.0.0.1', port=8000)