/**
 * 파일명 : dashboard_A.js
 * 설명   : 전처리 A 탭 (Chart.js 중복 생성/충돌 완전 방지)
 */
(async () => {
    const tabA = document.getElementById("tab-preprocessing1");
    if (!tabA) return;

    // 🚫 active 탭만 실행
    if (!tabA.classList.contains("active")) return;

    // ✅ 안전한 차트 인스턴스 전역 저장소 생성
    window.chartInstances = window.chartInstances || {};

    // ✅ 데이터 로드
    const res = await fetch("/api/preprocessing-a");
    const data = await res.json();
    if (data.error) return console.error("데이터 로드 실패:", data.error);

    // ----------------------------
    // 서브탭 이벤트 연결
    // ----------------------------
    document.querySelectorAll(".subtab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".subtab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".subtab-content").forEach(c => c.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(tab.dataset.target).classList.add("active");
            renderCharts("Product_8");
            document.querySelectorAll(".filter-button").forEach(btn => {
                btn.classList.remove("active");
                if (btn.textContent.startsWith("Product_8")) {
                    btn.classList.add("active");
                }
            });
        });
    });

    // ----------------------------
    // 필터 생성
    // ----------------------------
    const groups = [
        "Product_8", "Product_9", "Product_a", "Product_b",
        "Product_c", "Product_d", "Product_e", "Product_f"
    ];

    function createFilterTabs(containerId, onClick) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";

        groups.forEach((group, idx) => {
            const btn = document.createElement("button");
            btn.className = "filter-button" + (idx === 0 ? " active" : "");
            btn.textContent = group + "~";
            btn.dataset.group = group;
            btn.addEventListener("click", () => {
                container.querySelectorAll(".filter-button").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                onClick(group);
            });
            container.appendChild(btn);
        });
    }

    createFilterTabs("filter-predict", g => renderCharts(g));
    createFilterTabs("filter-table", g => renderCharts(g));
    createFilterTabs("filter-metrics", g => renderCharts(g));
    createFilterTabs("filter-accuracy", g => renderCharts(g));

    // ----------------------------
    // 메인 렌더 함수
    // ----------------------------
    function renderCharts(prefix) {
        const filtered = data.filter(d => d.Product_Number.startsWith(prefix));
        const products = [...new Set(filtered.map(d => d.Product_Number))];

        // ✅ 모든 차트 새로 그리기 전 안전 destroy
        destroyChart("predChart");
        destroyChart("featChart");
        destroyChart("accChart");

        renderPredictionChart(filtered, products);
        renderTable(filtered);
        renderFeatureChart(filtered, products);
        renderAccuracyChart(filtered, products);
    }

    // ✅ 안전한 차트 제거 함수
    function destroyChart(name) {
        if (window.chartInstances[name]) {
            try {
                window.chartInstances[name].destroy();
            } catch (e) {
                console.warn(`[WARN] Chart destroy 실패 (${name}):`, e);
            }
            window.chartInstances[name] = null;
        }
    }

    // ----------------------------
    // 예측 vs 실제 (막대)
    // ----------------------------
    function renderPredictionChart(data, prods) {
        const canvas = document.getElementById("chart-prep1-prediction");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        destroyChart("predChart"); // ✅ 기존 차트 제거

        const colors = ["#4e79a7","#f28e2b","#e15759","#76b7b2","#59a14f","#edc948"];
        window.chartInstances.predChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["T+1", "T+2", "T+3"],
                datasets: prods.map((p, i) => {
                    const rows = data.filter(d => d.Product_Number === p);
                    return {
                        label: p,
                        data: rows.slice(-3).map(r => r.Pred_Value),
                        backgroundColor: colors[i % colors.length]
                    };
                })
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: "예측 vs 실제 (3일 예측 수주량)" },
                    legend: { position: "bottom", labels: { color: "#e5e7eb" } }
                },
                scales: {
                    x: { ticks: { color: "#cbd5e1" } },
                    y: { beginAtZero: true, ticks: { color: "#cbd5e1" } }
                }
            }
        });
    }

    // ----------------------------
    // 예측 수주량 (테이블)
    // ----------------------------
    function renderTable(data) {
        const container = document.getElementById("chart-prep1-table");
        if (!container) return;

        const grouped = {};
        data.forEach(row => {
            const key = row.Product_Number;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(row);
        });

        const allDates = [...new Set(data.map(d => d.Date))].sort((a, b) => new Date(b) - new Date(a));
        const recentDates = allDates.slice(0, 3).reverse();
        const dateLabels = recentDates.map((d, i) => `${d} (T+${i + 1})`);

        const rows = Object.entries(grouped).map(([prod, items]) => {
            const byDate = {};
            items.forEach(i => byDate[i.Date] = i.Pred_Value ?? "-");
            return {
                Product_Number: prod,
                T1: byDate[recentDates[0]] ?? "-",
                T2: byDate[recentDates[1]] ?? "-",
                T3: byDate[recentDates[2]] ?? "-"
            };
        });

        container.innerHTML = `
            <table class="prediction-table">
                <thead>
                    <tr>
                        <th>index</th>
                        <th>Product_Number</th>
                        <th>${dateLabels[0] ?? "T+1"}</th>
                        <th>${dateLabels[1] ?? "T+2"}</th>
                        <th>${dateLabels[2] ?? "T+3"}</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map((d, idx) => `
                        <tr>
                            <td>${idx + 1}</td>
                            <td>${d.Product_Number}</td>
                            <td>${d.T1}</td>
                            <td>${d.T2}</td>
                            <td>${d.T3}</td>
                        </tr>`).join("")}
                </tbody>
            </table>
        `;
    }

    // ----------------------------
    // 지표 비교
    // ----------------------------
    function renderFeatureChart(data, prods) {
        const canvas = document.getElementById("chart-prep1-features");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        destroyChart("featChart");

        const colors = ["#4e79a7","#f28e2b","#e15759"];
        const metrics = ["MAE", "SMAPE", "Accuracy"];

        window.chartInstances.featChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: prods,
                datasets: metrics.map((m, i) => ({
                    label: m,
                    data: prods.map(p => {
                        const row = data.find(d => d.Product_Number === p);
                        return row ? row[m] : 0;
                    }),
                    backgroundColor: colors[i]
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: "지표 비교 (MAE / SMAPE / Accuracy)" },
                    legend: { position: "bottom", labels: { color: "#e5e7eb" } }
                },
                scales: {
                    x: { ticks: { color: "#cbd5e1" } },
                    y: { beginAtZero: true, ticks: { color: "#cbd5e1" } }
                }
            }
        });
    }

    // ----------------------------
    // 정확도 비교 (라인)
    // ----------------------------
    function renderAccuracyChart(data, prods) {
        const canvas = document.getElementById("chart-prep1-epochs");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        destroyChart("accChart");

        window.chartInstances.accChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: prods,
                datasets: [{
                    label: "Accuracy(%)",
                    data: prods.map(p => {
                        const row = data.find(d => d.Product_Number === p);
                        return row ? row.Accuracy : 0;
                    }),
                    borderColor: "#4e79a7",
                    backgroundColor: "rgba(78,121,167,0.2)",
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: "제품별 Accuracy 변화" },
                    legend: { position: "bottom", labels: { color: "#e5e7eb" } }
                },
                scales: {
                    x: { ticks: { color: "#cbd5e1" } },
                    y: { beginAtZero: true, max: 100, ticks: { color: "#cbd5e1" } }
                }
            }
        });
    }

    // 첫 렌더 실행
    renderCharts("Product_8");
})();