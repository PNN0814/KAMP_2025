"""
파일명 : train_cnn_lstm.py
설명   : 사출성형 공급망 데이터 기반 CNN-LSTM 예측 모델 학습
실행법 :
    - 1. 프로젝트 루트로 이동 : ~/KAMP
    - 2. 명령어 실행          : python -m models.train_cnn_lstm
"""

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.preprocessing import MinMaxScaler

from tensorflow import keras

from keras.models import Sequential
from keras.layers import Conv1D, MaxPooling1D, LSTM, Dense, Dropout
from keras.callbacks import EarlyStopping, ModelCheckpoint
from keras.optimizers import Adam
from keras.losses import MeanSquaredError
from keras.metrics import MeanAbsoluteError

# 경로 가져오기
from models.common import OUTPUT_DIR, DATA_RESULT_DIR

# 각 파일들 불러오거나 저장할 경로 및 파일명 세팅
DATA_PATH  = os.path.join(DATA_RESULT_DIR, "03_전처리_이상치_제거.csv")
MODEL_PATH = os.path.join(OUTPUT_DIR, "cnn_lstm_model.h5")
RESULT_LOG = os.path.join(OUTPUT_DIR, "cnn_lstm_training_log.csv")
PRED_PATH  = os.path.join(OUTPUT_DIR, "cnn_lstm_prediction_result.csv")

#####################################################################
# 데이터 불러오기
#####################################################################

df = pd.read_csv(DATA_PATH, encoding="utf-8-sig")
print(f"데이터 로드 완료 / 행: {df.shape[0]}, 열: {df.shape[1]}")

#####################################################################
# 학습에 사용할 컬럼 지정
#####################################################################

FEATURE_COLS = ["Temperature", "Humidity", "T일 예정 수주량"]
TARGET_COL   = "T+1일 예정 수주량"

# 예상 수주량 일 시 위에 거 주석하고 아래 거 주석 해제
# FEATURE_COLS = ["Temperature", "Humidity", "T일 예상 수주량"]
# TARGET_COL   = "T+1일 예상 수주량"

# 필수 컬럼 검증
required_columns = FEATURE_COLS + [TARGET_COL]
missing_columns = [col for col in required_columns if col not in df.columns]

if missing_columns:
    print("누락된 컬럼 감지됨:", missing_columns)
    print("현재 데이터셋 컬럼 목록:", list(df.columns))
    raise ValueError(f"필요한 컬럼이 누락되었습니다: {missing_columns}")
else:
    print("모든 학습 컬럼이 정상적으로 존재합니다.")

#####################################################################
# 데이터 정규화 (0~1 스케일)
#####################################################################

scaler = MinMaxScaler()
scaled = scaler.fit_transform(df[FEATURE_COLS + [TARGET_COL]])
scaled_df = pd.DataFrame(scaled, columns=FEATURE_COLS + [TARGET_COL])

#####################################################################
# 시퀀스 데이터 구성 (최근 7일 → 다음날 예측)
#####################################################################

SEQ_LEN = 7
X, y = [], []
for i in range(len(scaled_df) - SEQ_LEN):
    X.append(scaled_df.iloc[i:i+SEQ_LEN][FEATURE_COLS].values)
    y.append(scaled_df.iloc[i+SEQ_LEN][TARGET_COL])
X, y = np.array(X), np.array(y)

print(f"입력 데이터 X: {X.shape}, 타겟 y: {y.shape}")

#####################################################################
# 학습/검증 데이터 분리
#####################################################################

split_index = int(len(X) * 0.8)
X_train, X_val = X[:split_index], X[split_index:]
y_train, y_val = y[:split_index], y[split_index:]

print(f"Train 데이터: {X_train.shape}, Validation 데이터: {X_val.shape}")

#####################################################################
# 모델 구조 (CNN-LSTM)
#####################################################################

model = Sequential([
    Conv1D(filters=64, kernel_size=2, activation='relu', input_shape=(SEQ_LEN, len(FEATURE_COLS))),
    MaxPooling1D(pool_size=2),
    LSTM(64, return_sequences=False),
    Dropout(0.2),
    Dense(32, activation='relu'),
    Dense(1)
])

model.compile(
    optimizer=Adam(learning_rate=0.001),
    loss=MeanSquaredError(),
    metrics=[MeanAbsoluteError()]
)

model.summary()

#####################################################################
# 콜백 설정 (조기 종료 + 체크포인트)
#####################################################################

callbacks = [
    EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True),
    ModelCheckpoint(filepath=MODEL_PATH, monitor='val_loss', save_best_only=True)
]

#####################################################################
# 모델 학습
#####################################################################

print("모델 학습을 시작합니다...")
history = model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=100,
    batch_size=16,
    callbacks=callbacks,
    verbose=1
)

#####################################################################
# 학습 로그 저장
#####################################################################

hist_df = pd.DataFrame(history.history)
hist_df.to_csv(RESULT_LOG, index=False, encoding="utf-8-sig")
print(f"학습 로그 저장 완료 : {RESULT_LOG}")

#####################################################################
# 예측 결과 생성 및 저장
#####################################################################

pred_scaled = model.predict(X_val)
pred_df = pd.DataFrame({
    "Actual": y_val,
    "Predicted": pred_scaled.flatten()
})

# 스케일 복원
temp = np.zeros((len(pred_df), len(FEATURE_COLS) + 1))
temp[:, -1] = pred_df["Actual"]
actual_restored = scaler.inverse_transform(temp)[:, -1]

temp[:, -1] = pred_df["Predicted"]
pred_restored = scaler.inverse_transform(temp)[:, -1]

pred_df["Actual_Restored"] = actual_restored
pred_df["Predicted_Restored"] = pred_restored
pred_df.to_csv(PRED_PATH, index=False, encoding="utf-8-sig")
print(f"예측 결과 저장 완료 : {PRED_PATH}")

#####################################################################
# 학습 곡선 시각화 (Loss & MAE)
#####################################################################

plt.figure(figsize=(10,4))
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Validation Loss')
plt.legend()
plt.title("Training & Validation Loss")
plt.xlabel("Epoch")
plt.ylabel("MSE Loss")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "cnn_lstm_loss_curve.png"))
plt.close()

plt.figure(figsize=(10,4))
plt.plot(history.history['mean_absolute_error'], label='Train MAE')
plt.plot(history.history['val_mean_absolute_error'], label='Validation MAE')
plt.legend()
plt.title("Training & Validation MAE")
plt.xlabel("Epoch")
plt.ylabel("MAE")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "cnn_lstm_mae_curve.png"))
plt.close()

print(f"모델 저장 완료 : {MODEL_PATH}")
print("CNN-LSTM 학습 완료")
"""
결과 분석
    - CNN-LSTM 모델은 시계열 패턴(최근 7일) 기반으로 다음날 수주량을 예측함
    - 학습 및 검증 손실(MSE, MAE)을 통해 모델의 수렴 여부를 평가함
    - 예측 결과 파일(pred_df)을 통해 실제값 대비 예측값 비교 가능
결론
    - 전처리된 센서 기반 데이터로 CNN-LSTM 학습이 성공적으로 수행됨
    - 저장된 모델(cnn_lstm_model.h5)은 FastAPI에서 불러와 실시간 예측 서비스에 활용 가능
"""