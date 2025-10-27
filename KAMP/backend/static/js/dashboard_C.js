//////////////////////////////////////////////////////////////////////////////////
// 20251027 - 정기홍 > 학습 데이터 불러와서 뿌려주기 시작
//////////////////////////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", async () => {
    await renderTabCTrainingChart();
    await renderTabCPredictionChart();
    await renderTabCPredVsActualChart();
    await renderTabCEpochChart();
});

// ① 모델 학습 추이 (Loss / MAE)
async function renderTabCTrainingChart() {
    const res = await fetch("/api/training-log");
    const data = await res.json();
    if (data.error) return console.error(data.error);

    const ctx = document.getElementById("tab_c_training_chart").getContext("2d");
    new Chart(ctx, {
        type: "line",
        data: {
            labels: data.epoch,
            datasets: [
                {
                    label: "Train Loss",
                    data: data.loss,
                    borderColor: "rgba(0, 123, 255, 1)",
                    fill: false,
                    borderWidth: 2,
                    tension: 0.2
                },
                {
                    label: "Validation Loss",
                    data: data.val_loss,
                    borderColor: "rgba(255, 99, 132, 1)",
                    borderDash: [5, 5],
                    fill: false,
                    borderWidth: 2,
                    tension: 0.2
                },
                {
                    label: "Train MAE",
                    data: data.mae,
                    borderColor: "rgba(0, 200, 100, 1)",
                    fill: false,
                    borderWidth: 2,
                    tension: 0.2
                },
                {
                    label: "Validation MAE",
                    data: data.val_mae,
                    borderColor: "rgba(255, 180, 0, 1)",
                    borderDash: [5, 5],
                    fill: false,
                    borderWidth: 2,
                    tension: 0.2
                }
            ]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom" },
                title: { display: true, text: "모델 학습 추이 (Loss / MAE)" }
            },
            scales: { y: { beginAtZero: true } }
        }
    });
}

// ② 실제 수주량 vs 예측 수주량
async function renderTabCPredictionChart() {
    const res = await fetch("/api/prediction-result");
    const data = await res.json();
    if (data.error) return console.error(data.error);

    const ctx = document.getElementById("tab_c_prediction_chart").getContext("2d");
    new Chart(ctx, {
        type: "line",
        data: {
            labels: data.index,
            datasets: [
                {
                    label: "Actual",
                    data: data.actual,
                    borderColor: "rgba(0, 123, 255, 1)",
                    fill: false,
                    borderWidth: 2,
                    tension: 0.2
                },
                {
                    label: "Predicted",
                    data: data.predicted,
                    borderColor: "rgba(255, 99, 132, 1)",
                    borderDash: [5, 5],
                    fill: false,
                    borderWidth: 2,
                    tension: 0.2
                }
            ]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom" },
                title: { display: true, text: "실제 수주량 vs 예측 수주량" }
            },
            scales: { y: { beginAtZero: false } }
        }
    });
}

// ③ 예측 vs 실제 (산점도)
async function renderTabCPredVsActualChart() {
    const res = await fetch("/api/prediction-result");
    const data = await res.json();
    if (data.error) return console.error(data.error);

    const ctx = document.getElementById("tab_c_pred_vs_actual_chart").getContext("2d");
    new Chart(ctx, {
        type: "scatter",
        data: {
            datasets: [
                {
                    label: "예측 vs 실제",
                    data: data.actual.map((a, i) => ({ x: a, y: data.predicted[i] })),
                    backgroundColor: "rgba(75, 192, 192, 0.7)"
                }
            ]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: "Predicted vs Actual (산점도)" },
                legend: { display: false }
            },
            scales: {
                x: { title: { display: true, text: "Actual" } },
                y: { title: { display: true, text: "Predicted" } }
            }
        }
    });
}

// ④ 에포크별 정확도 (MAE)
async function renderTabCEpochChart() {
    const res = await fetch("/api/training-log");
    const data = await res.json();
    if (data.error) return console.error(data.error);

    const ctx = document.getElementById("tab_c_epochs_chart").getContext("2d");
    new Chart(ctx, {
        type: "line",
        data: {
            labels: data.epoch,
            datasets: [
                {
                    label: "Train MAE",
                    data: data.mae,
                    borderColor: "rgba(0, 200, 100, 1)",
                    fill: false,
                    borderWidth: 2,
                    tension: 0.2
                },
                {
                    label: "Validation MAE",
                    data: data.val_mae,
                    borderColor: "rgba(255, 180, 0, 1)",
                    borderDash: [5, 5],
                    fill: false,
                    borderWidth: 2,
                    tension: 0.2
                }
            ]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom" },
                title: { display: true, text: "MAE per Epoch (CNN-LSTM)" }
            },
            scales: { y: { beginAtZero: true } }
        }
    });
}

//////////////////////////////////////////////////////////////////////////////////
// 20251027 - 정기홍 > 학습 데이터 불러와서 뿌려주기 종료
//////////////////////////////////////////////////////////////////////////////////

// Tab: Preprocessing 3
createPredictionChart([90, 89, 94, 92, 87, 93, 88, 95, 91, 89]);
createFeatureImportanceChart([0.24, 0.19, 0.16, 0.13, 0.11]);
createEpochsChart([0.74, 0.81, 0.87, 0.91, 0.94, 0.96, 0.98]);
createConfusionMatrix();

// Preprocessing Specific Charts
function createPredictionChart(actualData) {
    const ctx = document.getElementById(`chart-prep3-prediction`);
    const predictedData = actualData.map(val => val + (Math.random() - 0.5) * 4);
    
    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: '예측 정확도',
                data: actualData.map((actual, i) => ({ x: actual, y: predictedData[i] })),
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgb(59, 130, 246)',
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                x: {
                    ...chartOptions.scales.x,
                    title: { display: true, text: '실제 값', color: '#cbd5e1' }
                },
                y: {
                    ...chartOptions.scales.y,
                    title: { display: true, text: '예측 값', color: '#cbd5e1' }
                }
            }
        }
    });
}

function createFeatureImportanceChart(importanceData) {
    const ctx = document.getElementById(`chart-prep3-features`);
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5'],
            datasets: [{
                label: '중요도',
                data: importanceData,
                backgroundColor: 'rgba(139, 92, 246, 0.7)',
                borderColor: 'rgb(139, 92, 246)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            ...chartOptions,
            indexAxis: 'y'
        }
    });
}

function createEpochsChart(accuracyData) {
    const ctx = document.getElementById(`chart-prep3-epochs`);
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: accuracyData.map((_, i) => `Epoch ${i + 1}`),
            datasets: [{
                label: '정확도',
                data: accuracyData,
                borderColor: 'rgb(52, 211, 153)',
                backgroundColor: 'rgba(52, 211, 153, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: chartOptions
    });
}

function createConfusionMatrix() {
    const ctx = document.getElementById(`chart-prep3-confusion`);
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['True Pos', 'False Pos', 'True Neg', 'False Neg'],
            datasets: [{
                label: 'Count',
                data: [850, 45, 920, 35],
                backgroundColor: [
                    'rgba(52, 211, 153, 0.7)',
                    'rgba(251, 146, 60, 0.7)',
                    'rgba(52, 211, 153, 0.7)',
                    'rgba(239, 68, 68, 0.7)'
                ],
                borderColor: [
                    'rgb(52, 211, 153)',
                    'rgb(251, 146, 60)',
                    'rgb(52, 211, 153)',
                    'rgb(239, 68, 68)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: chartOptions
    });
}