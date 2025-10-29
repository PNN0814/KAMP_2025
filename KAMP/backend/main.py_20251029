from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import pandas as pd
import os

# FastAPI 초기화
app = FastAPI()

# ~/KAMP/backend 까지의 경로 세팅
BASE_DIR            = os.path.dirname(os.path.abspath(__file__))

# 각 폴더에 맞게 경로 세팅
TEMPLATES_DIR       = os.path.join(BASE_DIR, "templates")
STATIC_DIR          = os.path.join(BASE_DIR, "static")
MODELS_OUTPUT_DIR   = os.path.join(os.path.dirname(BASE_DIR), "models", "outputs")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

templates = Jinja2Templates(directory=TEMPLATES_DIR)

#####################################################################
# 페이지 라우팅
#####################################################################

# 인트로 페이지
@app.get("/", response_class=HTMLResponse)
def intro_page(request: Request):
    return templates.TemplateResponse("intro.html", {"request": request})

# 대시보드 페이지
@app.get("/dashboard", response_class=HTMLResponse)
def dashboard_page(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

#####################################################################
# API : CNN-LSTM 학습 로그
#####################################################################

@app.get("/api/training-log")
def get_training_log():
    file_path = os.path.join(MODELS_OUTPUT_DIR, "cnn_lstm_training_log.csv")
    if not os.path.exists(file_path):
        return JSONResponse(content={"error": "학습 로그 파일이 존재하지 않습니다."}, status_code=404)

    df = pd.read_csv(file_path)
    data = {
        "epoch": list(range(len(df))),
        "loss": df["loss"].tolist(),
        "val_loss": df["val_loss"].tolist(),
        "mae": df["mean_absolute_error"].tolist(),
        "val_mae": df["val_mean_absolute_error"].tolist()
    }
    return JSONResponse(content=data)

#####################################################################
# API : CNN-LSTM 예측 결과 (실제 vs 예측)
#####################################################################

@app.get("/api/prediction-result")
def get_prediction_result():
    file_path = os.path.join(MODELS_OUTPUT_DIR, "cnn_lstm_prediction_result.csv")
    if not os.path.exists(file_path):
        return JSONResponse(content={"error": "예측 결과 파일이 존재하지 않습니다."}, status_code=404)

    df = pd.read_csv(file_path)
    if "Actual_Restored" not in df.columns or "Predicted_Restored" not in df.columns:
        return JSONResponse(content={"error": "예측 결과 파일에 필요한 컬럼이 없습니다."}, status_code=400)

    data = {
        "actual": df["Actual_Restored"].tolist(),
        "predicted": df["Predicted_Restored"].tolist(),
        "index": list(range(len(df)))
    }
    return JSONResponse(content=data)
