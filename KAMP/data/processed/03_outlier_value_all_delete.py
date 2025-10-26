"""
실행법
    - 1. 프로젝트의 ROOT 폴더로 이동 | ~/KAMP
    - 2. cmd에 코드 실행           | python -m data.processed.03_outlier_value_all_delete
"""

"""
이상치 확인 및 제거
    - 데이터 내 비정상적인 센서 값 및 수주량 음수값(Outlier)을 확인하고 제거하여 품질 확보
"""

"""
Q. 이상치 제거 기준
    1. Humidity(습도)        : 0 이하 또는 100 이상 삭제
    2. Temperature(온도)     : 비정상적으로 높거나 낮은 값 제거 (예: -10도 ~ 60도)
    3. 수주량(Orders)        : 음수(< 0) 값 삭제
    4. Date(날짜)            : 공식 데이터 수집 기간(2022-01-26 ~ 2022-05-11)을 벗어난 값 삭제

Q. 제거 이유
    - 센서(Humidity, Temperature)의 물리적으로 불가능한 값은 장비 오류나 측정 문제로 발생
    - 수주량(Orders)의 음수 값은 논리적으로 불가능한 데이터(입력 또는 전송 오류)
    - 날짜(Date)가 공식 수집 기간을 벗어난 데이터는 비정상적이거나 외부 삽입된 데이터로 간주
    - 이러한 이상치는 분석 모델 학습 시 왜곡을 유발하므로 사전에 제거 필요
"""

import os
import pandas as pd

# data.common에 작성된 코드 가져오기
from data.common import RESULT_DIR

# 데이터 정제 완료 데이터셋 불러오기
file_path  = os.path.join(RESULT_DIR, "02_전처리_데이터_정제.csv")

# 저장될 파일명 및 위치
output_path = os.path.join(RESULT_DIR, "03_전처리_이상치_제거.csv")

#####################################################################
# 원본 데이터 불러오고 세팅
#####################################################################

df = pd.read_csv(file_path, encoding = "utf-8-sig")

print(f"원본 데이터 로드 완료 / 행 개수 : {df.shape[0]}, 열 개수 : {df.shape[1]}")

#####################################################################
# Humidity (습도) 이상치 제거
# 기준 : 0 이하 또는 100 이상 삭제
#####################################################################

before_rows = len(df)

df = df[(df["Humidity"] > 0) & (df["Humidity"] < 100)]

print(f"습도 이상치 제거 완료 : {before_rows - len(df)}개 삭제")

#####################################################################
# Temperature (온도) 이상치 제거
# 기준 : 비정상적으로 높거나 낮은 값 제거 > -10도 이하 또는 60도 이상 값 제거
#####################################################################

before_rows = len(df)

df = df[(df["Temperature"] >= -10) & (df["Temperature"] <= 60)]

print(f"온도 이상치 제거 완료 : {before_rows - len(df)}개 삭제")

#####################################################################
# 수주량 관련 컬럼 음수값 제거
# 기준 : 수주량 값이 0 미만(음수)인 행 제거
#####################################################################

# 수주량 관련 컬럼 자동 탐색
order_cols = []

for col in df.columns:
    if "수주량" in col:
        order_cols.append(col)

before_rows = len(df)

# 모든 수주량 컬럼 중 하나라도 음수가 있으면 해당 행 제거
df = df[~(df[order_cols] < 0).any(axis=1)]

print(f"수주량 음수값 이상치 제거 완료 : {before_rows - len(df)}개 삭제")

#####################################################################
# Date 범위 이상치 제거
# 기준 : 2022-01-26 ~ 2022-05-11 사이의 데이터만 유지
#####################################################################

if "Date" in df.columns:
    df["Date"] = pd.to_datetime(df["Date"], errors = "coerce")

    start_date = pd.Timestamp("2022-01-26")
    end_date   = pd.Timestamp("2022-05-11")

    before_rows = len(df)
    df = df[(df["Date"] >= start_date) & (df["Date"] <= end_date)]
    print(f"Date 범위 이상치 제거 완료 : {before_rows - len(df)}개 삭제")
else:
    print("Date 컬럼이 존재하지 않습니다. 데이터 정제 단계를 확인하세요.")

#####################################################################
# 인덱스 초기화 및 결과 저장
#####################################################################

df.reset_index(drop = True, inplace = True)
df.to_csv(output_path, index = False, encoding = "utf-8-sig")

print(f"이상치 제거 완료 / 최종 데이터 크기 : {df.shape}")
print(f"결과 파일 저장 완료 : {output_path}")

"""
결과 분석
    - 센서 데이터(Humidity, Temperature)의 물리적 비정상 범위 값 제거
    - 수주량 관련 컬럼의 음수값 제거로 논리적 품질 이상치 보정
    - Date 컬럼의 공식 수집 기간 외 데이터 제거
    - 남은 데이터는 센서 기반 통계 분석 및 예측 모델 학습에 적합한 상태로 정제됨
"""