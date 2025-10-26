// Navigation
function navigateToIntro() {
    window.location.href = '/';
}

// Tab Switching
function switchTab(tabName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// Chart Configuration
Chart.defaults.color = '#cbd5e1';
Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.2)';
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            labels: {
                color: '#cbd5e1',
                padding: 12,
                font: { size: 12 }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#ffffff',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(59, 130, 246, 0.5)',
            borderWidth: 1,
            padding: 12,
            displayColors: true
        }
    },
    scales: {
        x: {
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { color: '#94a3b8' }
        },
        y: {
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { color: '#94a3b8' }
        }
    }
};

// Initialize Charts
document.addEventListener('DOMContentLoaded', function() {
    initializeAllCharts();
});

function initializeAllCharts() {
    // Tab: All Data
    createComparisonChart();
    createAccuracyTrendChart();
    createDistributionChart();
    createLossChart();

    // Tab: Preprocessing 1
    createPredictionChart('prep1', [92, 87, 95, 91, 88, 94, 89, 96, 93, 90]);
    createFeatureImportanceChart('prep1', [0.25, 0.18, 0.15, 0.12, 0.10]);
    createEpochsChart('prep1', [0.75, 0.82, 0.88, 0.92, 0.95, 0.97, 0.98]);
    createConfusionMatrix('prep1');

    // Tab: Preprocessing 2
    createPredictionChart('prep2', [88, 85, 92, 87, 84, 91, 86, 93, 89, 88]);
    createFeatureImportanceChart('prep2', [0.22, 0.20, 0.17, 0.14, 0.12]);
    createEpochsChart('prep2', [0.72, 0.79, 0.85, 0.90, 0.93, 0.95, 0.98]);
    createConfusionMatrix('prep2');

    // Tab: Preprocessing 3
    createPredictionChart('prep3', [90, 89, 94, 92, 87, 93, 88, 95, 91, 89]);
    createFeatureImportanceChart('prep3', [0.24, 0.19, 0.16, 0.13, 0.11]);
    createEpochsChart('prep3', [0.74, 0.81, 0.87, 0.91, 0.94, 0.96, 0.98]);
    createConfusionMatrix('prep3');
}

// All Data Tab Charts
function createComparisonChart() {
    const ctx = document.getElementById('chart-all-comparison');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['전처리 A', '전처리 B', '전처리 C'],
            datasets: [{
                label: '정확도 (%)',
                data: [98.2, 97.5, 97.9],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(139, 92, 246, 0.7)',
                    'rgba(236, 72, 153, 0.7)'
                ],
                borderColor: [
                    'rgb(59, 130, 246)',
                    'rgb(139, 92, 246)',
                    'rgb(236, 72, 153)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function createAccuracyTrendChart() {
    const ctx = document.getElementById('chart-all-accuracy');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
            datasets: [
                {
                    label: '전처리 A',
                    data: [92, 93.5, 94.8, 95.5, 96.2, 97.1, 97.8, 98.2],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                },
                {
                    label: '전처리 B',
                    data: [90, 91.8, 93.2, 94.5, 95.3, 96.2, 96.8, 97.5],
                    borderColor: 'rgb(139, 92, 246)',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                },
                {
                    label: '전처리 C',
                    data: [91, 92.5, 94, 95, 96, 96.8, 97.3, 97.9],
                    borderColor: 'rgb(236, 72, 153)',
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                }
            ]
        },
        options: chartOptions
    });
}

function createDistributionChart() {
    const ctx = document.getElementById('chart-all-distribution');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['전처리 A', '전처리 B', '전처리 C', '미처리'],
            datasets: [{
                data: [400, 450, 350, 50],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(139, 92, 246, 0.7)',
                    'rgba(236, 72, 153, 0.7)',
                    'rgba(148, 163, 184, 0.3)'
                ],
                borderColor: [
                    'rgb(59, 130, 246)',
                    'rgb(139, 92, 246)',
                    'rgb(236, 72, 153)',
                    'rgb(148, 163, 184)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                legend: {
                    ...chartOptions.plugins.legend,
                    position: 'right'
                }
            }
        }
    });
}

function createLossChart() {
    const ctx = document.getElementById('chart-all-loss');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            datasets: [
                {
                    label: 'Training Loss',
                    data: [2.5, 1.8, 1.3, 0.9, 0.6, 0.4, 0.3, 0.2, 0.15, 0.12],
                    borderColor: 'rgb(52, 211, 153)',
                    backgroundColor: 'rgba(52, 211, 153, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                },
                {
                    label: 'Validation Loss',
                    data: [2.6, 1.9, 1.4, 1.0, 0.7, 0.5, 0.4, 0.3, 0.25, 0.20],
                    borderColor: 'rgb(251, 146, 60)',
                    backgroundColor: 'rgba(251, 146, 60, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                }
            ]
        },
        options: chartOptions
    });
}

// Preprocessing Specific Charts
function createPredictionChart(prefix, actualData) {
    const ctx = document.getElementById(`chart-${prefix}-prediction`);
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

function createFeatureImportanceChart(prefix, importanceData) {
    const ctx = document.getElementById(`chart-${prefix}-features`);
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

function createEpochsChart(prefix, accuracyData) {
    const ctx = document.getElementById(`chart-${prefix}-epochs`);
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

function createConfusionMatrix(prefix) {
    const ctx = document.getElementById(`chart-${prefix}-confusion`);
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

//////////////////////////////////////////////////////////////////////////////////
// 20251027 - 정기홍 > 학습 데이터 불러와서 뿌려주기
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
