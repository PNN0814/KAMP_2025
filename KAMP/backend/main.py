"""
파일명 : main.py
설명   : FastAPI 백엔드 (인트로 + 대시보드)
경로   : KAMP/backend/main.py
"""

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import pandas as pd
import os

app = FastAPI()

# ---------------------------------
# 경로 설정
# ---------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
OUTPUT_DIR = os.path.join(BASE_DIR, "..", "models", "outputs", "tab_a_ensemble_forecast")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATE_DIR)

# ---------------------------------
# 기본 라우팅
# ---------------------------------
@app.get("/", response_class=HTMLResponse)
def intro_page(request: Request):
    return templates.TemplateResponse("intro.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse)
def dashboard_page(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})


# ---------------------------------
# 📊 전처리 A - 데이터 시각화용 API
# ---------------------------------
@app.get("/api/preprocessing-a")
def get_preprocessing_a_data():
    """
    - outputs/tab_a_ensemble_forecast/*.csv 로부터 데이터 로드
    - Product_Number별 최근 3일 예측값 + MAE/SMAPE/Accuracy
    - ensemble_summary.csv 파일은 완전히 제외
    """
    if not os.path.exists(OUTPUT_DIR):
        return JSONResponse({"error": "결과 폴더를 찾을 수 없습니다."}, status_code=404)

    dfs = []
    for file in os.listdir(OUTPUT_DIR):
        if not file.endswith(".csv"):
            continue

        # ✅ ensemble_summary.csv는 완전히 무시
        if file.lower().startswith("ensemble_summary"):
            continue

        path = os.path.join(OUTPUT_DIR, file)
        try:
            df = pd.read_csv(path)

            # 안전하게 Product_Number 컬럼 확인
            if "Product_Number" not in df.columns:
                continue

            df["Product_Number"] = os.path.splitext(file)[0].replace("_pred", "")
            dfs.append(df)
        except Exception as e:
            print(f"[WARN] {file} 읽기 실패: {e}")
            continue

    if not dfs:
        return JSONResponse({"error": "CSV 파일을 읽을 수 없습니다."}, status_code=404)

    df_all = pd.concat(dfs, ignore_index=True)
    df_all = df_all.fillna(0)

    # 숫자형 변환
    numeric_cols = ["Pred_Value", "MAE", "SMAPE", "Accuracy"]
    for col in numeric_cols:
        if col in df_all.columns:
            df_all[col] = pd.to_numeric(df_all[col], errors="coerce").fillna(0)

    df_all = df_all.sort_values(by="Product_Number").reset_index(drop=True)

    return JSONResponse(content=df_all.to_dict(orient="records"))
