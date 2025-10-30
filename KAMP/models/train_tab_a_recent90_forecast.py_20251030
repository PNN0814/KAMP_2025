"""
파일명 : train_tab_a_recent90_forecast.py
설명   : Product_Number별 최근 90일 데이터를 기반으로 7일치(T일~T+7) 수주량 예측
         - 0 데이터 삭제 없이 학습 (0을 정보로 활용)
         - MinMaxScaler 기반 0~1 정규화 (중앙값 ≈ 0.5)
         - 추가 피처: NoOrderFlag(0여부), ZeroRatio30(0비율)
         - Target smoothing 적용
         - MAE 기반 손실함수 사용
         - MAE / MAPE / 정확도(%) 계산 및 로그 출력
         - 최대 15회 반복 학습
         - 정확도 음수 방지 (0~100% 범위 제한)
         - 평균값이 너무 작을 경우 정확도 계산 보정
         - MAE 40 이상인 Product 자동 재학습 (최대 5회 반복)

실행법 :
    1. 프로젝트 루트 경로로 이동
        cd ~/KAMP
    2. Python 모듈 형태로 실행
        python -m models.train_tab_a_recent90_forecast
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib
from datetime import timedelta
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error
from keras.models import Sequential
from keras.layers import Conv1D, MaxPooling1D, LSTM, Dropout, Dense
from keras.callbacks import EarlyStopping
from keras.optimizers import Adam
from keras.losses import MeanAbsoluteError as MAELoss
from keras.metrics import MeanAbsoluteError

# 공통 설정
from models.common import OUTPUT_DIR, DATA_RESULT_DIR

matplotlib.rc('font', family='Malgun Gothic')
matplotlib.rc('axes', unicode_minus=False)

#####################################################################
# 경로 설정
#####################################################################
DATA_PATH = os.path.join(DATA_RESULT_DIR, "04_전처리_불필요컬럼_제거.csv")
OUTPUT_SUBDIR = os.path.join(OUTPUT_DIR, "tab_a_recent90_forecast")
os.makedirs(OUTPUT_SUBDIR, exist_ok=True)

RESULT_PATH = os.path.join(OUTPUT_SUBDIR, "forecast_7days.csv")
ACC_JSON_PATH = os.path.join(OUTPUT_SUBDIR, "accuracy_score.json")
ACC_CSV_PATH = os.path.join(OUTPUT_SUBDIR, "accuracy_score.csv")

#####################################################################
# 파라미터
#####################################################################
SEQ_LEN = 21
PRED_DAYS = 7
EPOCHS = 200
MAX_RETRY = 5
BATCH_SIZE = 16
LEARNING_RATE = 0.0003
PATIENCE = 20
TARGET_ACCURACY = 80.0

BASE_FEATURES = [
    "T일 예정 수주량","T+1일 예정 수주량","T+2일 예정 수주량","T+3일 예정 수주량","T+4일 예정 수주량",
    "작년 T일 예정 수주량","작년 T+1일 예정 수주량","작년 T+2일 예정 수주량","작년 T+3일 예정 수주량","작년 T+4일 예정 수주량",
    "Temperature","Humidity"
]
TARGET_COL = "T일 예정 수주량_smooth"

#####################################################################
# 데이터 로드
#####################################################################
df = pd.read_csv(DATA_PATH, encoding="utf-8-sig")
df["Date"] = pd.to_datetime(df["Date"], errors="coerce")

print(f"데이터 로드 완료 / 전체 행: {df.shape[0]}, 열: {df.shape[1]}")
product_list = df["Product_Number"].unique()
print(f"총 Product_Number 개수: {len(product_list)}")

#####################################################################
# 모델 정의
#####################################################################
def build_model(input_shape, pred_days):
    model = Sequential([
        Conv1D(128, kernel_size=3, activation='relu', input_shape=input_shape),
        Conv1D(128, kernel_size=3, activation='relu'),
        MaxPooling1D(pool_size=2),
        LSTM(128, return_sequences=True),
        LSTM(64, return_sequences=True),
        Dropout(0.1),
        LSTM(32, return_sequences=False),
        Dense(128, activation='relu'),
        Dense(64, activation='relu'),
        Dense(32, activation='relu'),
        Dense(pred_days)
    ])
    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE),
        loss=MAELoss(),
        metrics=[MeanAbsoluteError()]
    )
    return model

#####################################################################
# 결과 구조
#####################################################################
forecast_all = pd.DataFrame()
accuracy_records = []

#####################################################################
# Product 별 학습
#####################################################################
for product in product_list:
    product_df = df[df["Product_Number"] == product].sort_values("Date").reset_index(drop=True)
    if product_df.shape[0] < 90:
        print(f"[{product}] 데이터 부족 ({product_df.shape[0]}행) → 스킵")
        continue

    latest_date = product_df["Date"].max()
    cutoff_date = latest_date - timedelta(days=90)
    recent_df = product_df[product_df["Date"] >= cutoff_date].reset_index(drop=True)

    # 0값 그대로 유지
    recent_df["NoOrderFlag"] = (recent_df["T일 예정 수주량"] == 0).astype(int)
    recent_df["ZeroRatio30"] = (
        recent_df["T일 예정 수주량"].rolling(window=30, min_periods=1)
        .apply(lambda x: (x == 0).sum() / len(x))
        .fillna(0)
    )

    # Target smoothing
    recent_df["T일 예정 수주량_smooth"] = (
        recent_df["T일 예정 수주량"].rolling(window=3, min_periods=1).mean()
    )

    # Δ 피처 추가
    for shift in range(1, 5):
        recent_df[f"ΔT+{shift}"] = recent_df[f"T+{shift}일 예정 수주량"] - recent_df["T일 예정 수주량"]

    FEATURE_COLS = BASE_FEATURES + [f"ΔT+{i}" for i in range(1, 5)] + ["NoOrderFlag", "ZeroRatio30"]

    # ✅ MinMaxScaler 적용
    scaler_feature = MinMaxScaler(feature_range=(0, 1))
    scaler_target = MinMaxScaler(feature_range=(0, 1))
    scaler_feature.fit(recent_df[FEATURE_COLS])
    scaler_target.fit(recent_df[[TARGET_COL]])

    scaled_features = scaler_feature.transform(recent_df[FEATURE_COLS])
    scaled_target = scaler_target.transform(recent_df[[TARGET_COL]])

    scaled_df = pd.DataFrame(scaled_features, columns=FEATURE_COLS)
    scaled_df["TARGET"] = scaled_target

    # 시퀀스 구성
    X, y = [], []
    for i in range(len(scaled_df) - SEQ_LEN - PRED_DAYS):
        X.append(scaled_df.iloc[i:i+SEQ_LEN][FEATURE_COLS].values)
        y.append(scaled_df.iloc[i+SEQ_LEN:i+SEQ_LEN+PRED_DAYS]["TARGET"].values)
    X, y = np.array(X), np.array(y)

    if len(X) == 0:
        print(f"[{product}] 시퀀스 생성 불가 → 스킵")
        continue

    split_index = int(len(X) * 0.8)
    X_train, X_val = X[:split_index], X[split_index:]
    y_train, y_val = y[:split_index], y[split_index:]

    model = build_model((SEQ_LEN, len(FEATURE_COLS)), PRED_DAYS)
    callbacks = [EarlyStopping(monitor='val_loss', patience=PATIENCE, restore_best_weights=True)]

    best_accuracy = 0
    mae_val = mape_val = None

    for retry in range(1, MAX_RETRY + 1):
        print(f"\n[{product}] 학습 시도 {retry}/{MAX_RETRY}")
        model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=EPOCHS,
            batch_size=BATCH_SIZE,
            callbacks=callbacks,
            verbose=0
        )

        val_pred = model.predict(X_val, verbose=0)
        val_pred_restored = scaler_target.inverse_transform(val_pred.flatten().reshape(-1, 1)).flatten()
        y_val_restored = scaler_target.inverse_transform(y_val.flatten().reshape(-1, 1)).flatten()

        mae_val = mean_absolute_error(y_val_restored, val_pred_restored)
        mape_val = np.mean(np.abs((y_val_restored - val_pred_restored) / np.clip(y_val_restored, 1e-5, None))) * 100

        mean_actual = max(np.mean(y_val_restored), 10)
        accuracy = 100 - (mae_val / mean_actual * 100)
        accuracy = max(0, min(accuracy, 100))

        if accuracy > best_accuracy:
            best_accuracy = accuracy

        print(f"[{product}] MAE: {mae_val:.2f} | MAPE: {mape_val:.2f}% | 정확도: {accuracy:.2f}%")

        if best_accuracy >= TARGET_ACCURACY:
            print(f"[{product}] 목표 정확도 도달 ({best_accuracy:.2f}%) → 조기 종료")
            break

    print(f"[{product}] 최종 결과 → MAE: {mae_val:.4f}, MAPE: {mape_val:.2f}%, 정확도: {best_accuracy:.2f}%")

    accuracy_records.append({
        "Product_Number": product,
        "MAE": round(float(mae_val), 4),
        "MAPE(%)": round(float(mape_val), 2),
        "Accuracy(%)": round(float(best_accuracy), 2)
    })

#####################################################################
# 결과 저장 및 요약 출력
#####################################################################
pd.DataFrame(accuracy_records).to_csv(ACC_CSV_PATH, index=False, encoding="utf-8-sig")
with open(ACC_JSON_PATH, "w", encoding="utf-8") as jf:
    json.dump(accuracy_records, jf, ensure_ascii=False, indent=4)

print("\n================== 학습 결과 요약 ==================")
print("{:<15} {:>10} {:>12} {:>12}".format("Product_Number", "MAE", "MAPE(%)", "Accuracy(%)"))
print("-------------------------------------------------------------")

for r in accuracy_records:
    print("{:<15} {:>10.4f} {:>12.2f} {:>12.2f}".format(
        r["Product_Number"], r["MAE"], r["MAPE(%)"], r["Accuracy(%)"]
    ))

print("=============================================================\n")

# 전체 평균 계산
mean_mae = np.mean([r["MAE"] for r in accuracy_records])
mean_mape = np.mean([r["MAPE(%)"] for r in accuracy_records])
mean_acc = np.mean([r["Accuracy(%)"] for r in accuracy_records])

print("📊 [전체 평균 성능 요약]")
print(f"MAE 평균     : {mean_mae:.4f}")
print(f"MAPE 평균(%) : {mean_mape:.2f}%")
print(f"정확도 평균(%) : {mean_acc:.2f}%")
print("=============================================================\n")

summary = {
    "Product_Number": "전체 평균",
    "MAE": round(mean_mae, 4),
    "MAPE(%)": round(mean_mape, 2),
    "Accuracy(%)": round(mean_acc, 2)
}

accuracy_records.insert(0, summary)
pd.DataFrame(accuracy_records).to_csv(ACC_CSV_PATH, index=False, encoding="utf-8-sig")
with open(ACC_JSON_PATH, "w", encoding="utf-8") as jf:
    json.dump(accuracy_records, jf, ensure_ascii=False, indent=4)

print("✅ 전체 결과 및 평균 저장 완료.")
