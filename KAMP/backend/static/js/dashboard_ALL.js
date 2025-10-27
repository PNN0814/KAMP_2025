// Tab: All Data
createComparisonChart();
createAccuracyTrendChart();
createDistributionChart();
createLossChart();

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