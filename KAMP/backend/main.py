import os
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse

# 경로 설정
BASE_DIR    = os.path.dirname(__file__)             # ~/KAMP/backend 까지의 경로
HTML_DIR    = os.path.join(BASE_DIR, "templates")   # ~/KAMP/backend/templates 경로
STATIC_DIR  = os.path.join(BASE_DIR, "static")      # ~/KAMP/backend/static 경로

# FastAPI 기본 세팅
app = FastAPI(title="KAMP 사출성형 공급망 최적화 AI")

# 정적 파일 경로 mount
app.mount("/static/css",   StaticFiles(directory=os.path.join(STATIC_DIR, "css")),    name="css")
app.mount("/static/js",    StaticFiles(directory=os.path.join(STATIC_DIR, "js")),     name="js")
app.mount("/static/image", StaticFiles(directory=os.path.join(STATIC_DIR, "image")),  name="image")

# 템플릿 파일 경로 세팅
user_temp = Jinja2Templates(directory=os.path.join(HTML_DIR))

######################################## 라우팅 시작 ########################################

# 인트로 페이지
@app.get("/")
def intro_page(request: Request):
    return user_temp.TemplateResponse("intro.html", {"request": request})

# 대시보드 페이지
@app.get("/dashboard")
def dashboard_page(request: Request):
    return user_temp.TemplateResponse("dashboard.html", {"request": request})

# 예측 결과 더미 데이터 반환 > 실제 모델 연결 시 이 API를 대시보드 JS에서 호출하면 된다.
@app.get("/api/predict")
def get_predictions():
    dummy_data = {
        "model_1": [75, 82, 91, 85, 79, 88, 94],
        "model_2": [63, 70, 77, 73, 76, 74, 81],
        "model_3": [89, 84, 92, 95, 90, 88, 91],
        "labels": ["1월", "2월", "3월", "4월", "5월", "6월", "7월"]
    }
    return JSONResponse(content=dummy_data)

######################################## 라우팅 종료 ########################################
