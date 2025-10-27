// Tab: Preprocessing 2
createPredictionChart([88, 85, 92, 87, 84, 91, 86, 93, 89, 88]);
createFeatureImportanceChart([0.22, 0.20, 0.17, 0.14, 0.12]);
createEpochsChart([0.72, 0.79, 0.85, 0.90, 0.93, 0.95, 0.98]);
createConfusionMatrix();

// Preprocessing Specific Charts
function createPredictionChart(actualData) {
    const ctx = document.getElementById(`chart-prep2-prediction`);
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
    const ctx = document.getElementById(`chart-prep2-features`);
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
    const ctx = document.getElementById(`chart-prep2-epochs`);
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
    const ctx = document.getElementById(`chart-prep2-confusion`);
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