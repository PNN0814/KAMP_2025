/**
 * 파일명 : dashboard_A.js
 * 설명   : 전처리 A 탭 (Chart.js 중복 생성/충돌 완전 방지 + 데이터값 표시 + y축 반올림 확장 + 0값 출력)
 */

// ✅ Chart.js DataLabels 플러그인 등록
Chart.register(ChartDataLabels);

(async () => {
    const tabA = document.getElementById("tab-preprocessing1");
    if (!tabA) return;
    if (!tabA.classList.contains("active")) return;

    window.chartInstances = window.chartInstances || {};

    const res = await fetch("/api/preprocessing-a");
    const data = await res.json();
    if (data.error) return console.error("데이터 로드 실패:", data.error);

    const tabAObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.attributeName === "class") {
                if (m.target.classList.contains("active")) {
                    requestAnimationFrame(() => {
                        renderCharts("Product_8");
                    });
                }
            }
        }
    });
    tabAObserver.observe(tabA, { attributes: true });

    document.querySelectorAll(".subtab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".subtab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".subtab-content").forEach(c => c.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(tab.dataset.target).classList.add("active");
            renderCharts("Product_8");
            document.querySelectorAll(".filter-button").forEach(btn => {
                btn.classList.remove("active");
                if (btn.textContent.startsWith("Product_8")) btn.classList.add("active");
            });
        });
    });

    const navA = document.querySelector(".nav-item[data-tab='preprocessing1']");
    if (navA) {
        navA.addEventListener("click", () => {
            document.querySelectorAll(".subtab, .subtab-content").forEach(el => el.classList.remove("active"));
            const firstSubtab = document.querySelector("button.subtab[data-target='subtab-predict']");
            const firstContent = document.getElementById("subtab-predict");
            if (firstSubtab && firstContent) {
                firstSubtab.classList.add("active");
                firstContent.classList.add("active");
            }
            renderCharts("Product_8");
            document.querySelectorAll(".filter-button").forEach(btn => {
                btn.classList.remove("active");
                if (btn.textContent.startsWith("Product_8")) btn.classList.add("active");
            });
        });
    }

    const groups = ["Product_8", "Product_9", "Product_a", "Product_b", "Product_c", "Product_d", "Product_e", "Product_f"];
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
    ["filter-predict", "filter-table", "filter-metrics", "filter-accuracy"].forEach(id => createFilterTabs(id, g => renderCharts(g)));

    function renderCharts(prefix) {
        const filtered = data.filter(d => d.Product_Number.startsWith(prefix));
        const products = [...new Set(filtered.map(d => d.Product_Number))];
        ["predChart", "featChart", "accChart"].forEach(destroyChart);
        renderPredictionChart(filtered, products);
        renderTable(filtered);
        renderFeatureChart(filtered, products);
        renderAccuracyChart(filtered, products);
    }

    function destroyChart(name) {
        if (window.chartInstances[name]) {
            try { window.chartInstances[name].destroy(); }
            catch (e) { console.warn(`[WARN] Chart destroy 실패 (${name}):`, e); }
            window.chartInstances[name] = null;
        }
    }

    // ----------------------------
    // 예측 vs 실제 (막대)
    // ----------------------------
    function renderPredictionChart(data, prods) {
        const canvas = document.getElementById("chart-prep1-prediction");
        if (!canvas) return;
        destroyChart("predChart");
        const ctx = canvas.getContext("2d");

        // ✅ 반올림된 y축 자동 확장 계산
        const allValues = data.map(d => d.Pred_Value ?? 0);
        const maxValue = Math.max(...allValues);
        let tickStep;
        if (maxValue <= 50) tickStep = 10;
        else if (maxValue <= 200) tickStep = 20;
        else if (maxValue <= 500) tickStep = 50;
        else if (maxValue <= 1000) tickStep = 100;
        else if (maxValue <= 2000) tickStep = 200;
        else if (maxValue <= 5000) tickStep = 500;
        else tickStep = 1000;
        const yMax = Math.ceil(maxValue / tickStep + 1) * tickStep;

        const colors = ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc948"];
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
                maintainAspectRatio: true,
                aspectRatio: 2.6,
                animation: { duration: 1200, easing: "easeOutQuart", animateScale: true },
                plugins: {
                    title: { display: true, text: "예측 vs 실제 (3일 예측 수주량)" },
                    legend: { position: "bottom", labels: { color: "#e5e7eb" } },
                    datalabels: {
                        color: "#ffffff",
                        anchor: "end",
                        align: "top",
                        clip: false,
                        font: { weight: "bold", size: 11 },
                        formatter: (value) =>
                            (value === null || value === undefined ? "" : value.toLocaleString())
                    }
                },
                scales: {
                    x: { ticks: { color: "#cbd5e1" } },
                    y: { beginAtZero: true, max: yMax, ticks: { color: "#cbd5e1", stepSize: tickStep } }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    // ----------------------------
    // 예측 수주량 (테이블)
    // ----------------------------
    function renderTable(data) {
        const container = document.getElementById("chart-prep1-table");
        if (!container) return;
        const grouped = {};
        data.forEach(row => (grouped[row.Product_Number] = grouped[row.Product_Number] || []).push(row));
        const allDates = [...new Set(data.map(d => d.Date))].sort((a, b) => new Date(b) - new Date(a));
        const recentDates = allDates.slice(0, 3).reverse();
        const dateLabels = recentDates.map((d, i) => `${d} (T+${i + 1})`);
        const rows = Object.entries(grouped).map(([prod, items]) => {
            const byDate = {}; items.forEach(i => (byDate[i.Date] = i.Pred_Value ?? "-"));
            return { Product_Number: prod, T1: byDate[recentDates[0]] ?? "-", T2: byDate[recentDates[1]] ?? "-", T3: byDate[recentDates[2]] ?? "-" };
        });
        container.innerHTML = `
            <table class="prediction-table">
                <thead>
                    <tr><th>index</th><th>Product_Number</th>
                    <th>${dateLabels[0] ?? "T+1"}</th><th>${dateLabels[1] ?? "T+2"}</th><th>${dateLabels[2] ?? "T+3"}</th></tr>
                </thead>
                <tbody>${rows.map((d, i) => `
                    <tr><td>${i + 1}</td><td>${d.Product_Number}</td><td>${d.T1}</td><td>${d.T2}</td><td>${d.T3}</td></tr>`).join("")}</tbody>
            </table>`;
    }

    // ----------------------------
    // 지표 비교 (막대)
    // ----------------------------
    function renderFeatureChart(data, prods) {
        const canvas = document.getElementById("chart-prep1-features");
        if (!canvas) return;
        destroyChart("featChart");
        const ctx = canvas.getContext("2d");

        const allValues = data.flatMap(d => [d.MAE ?? 0, d.SMAPE ?? 0, d.Accuracy ?? 0]);
        const maxValue = Math.max(...allValues);
        let tickStep;
        if (maxValue <= 50) tickStep = 10;
        else if (maxValue <= 200) tickStep = 20;
        else if (maxValue <= 500) tickStep = 50;
        else if (maxValue <= 1000) tickStep = 100;
        else if (maxValue <= 2000) tickStep = 200;
        else if (maxValue <= 5000) tickStep = 500;
        else tickStep = 1000;
        const yMax = Math.ceil(maxValue / tickStep + 1) * tickStep;

        const colors = ["#4e79a7", "#f28e2b", "#e15759"];
        const metrics = ["MAE", "SMAPE", "Accuracy"];

        window.chartInstances.featChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: prods,
                datasets: metrics.map((m, i) => ({
                    label: m,
                    data: prods.map(p => (data.find(d => d.Product_Number === p)?.[m]) ?? 0),
                    backgroundColor: colors[i]
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.6,
                animation: { duration: 1200, easing: "easeOutQuart", animateScale: true },
                plugins: {
                    title: { display: true, text: "지표 비교 (MAE / SMAPE / Accuracy)" },
                    legend: { position: "bottom", labels: { color: "#e5e7eb" } },
                    datalabels: {
                        color: "#ffffff",
                        anchor: "end",
                        align: "top",
                        clip: false,
                        font: { weight: "bold", size: 11 },
                        formatter: (value) =>
                            (value === null || value === undefined ? "" : value.toLocaleString())
                    }
                },
                scales: {
                    x: { ticks: { color: "#cbd5e1" } },
                    y: { beginAtZero: true, max: yMax, ticks: { color: "#cbd5e1", stepSize: tickStep } }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    // ----------------------------
    // 정확도 비교 (라인)
    // ----------------------------
    function renderAccuracyChart(data, prods) {
        const canvas = document.getElementById("chart-prep1-epochs");
        if (!canvas) return;
        destroyChart("accChart");
        const ctx = canvas.getContext("2d");

        window.chartInstances.accChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: prods,
                datasets: [{
                    label: "Accuracy(%)",
                    data: prods.map(p => data.find(d => d.Product_Number === p)?.Accuracy ?? 0),
                    borderColor: "#4e79a7",
                    backgroundColor: "rgba(78,121,167,0.2)",
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.6,
                animation: { duration: 1200, easing: "easeOutQuart" },
                plugins: {
                    title: { display: true, text: "제품별 Accuracy 변화" },
                    legend: { position: "bottom", labels: { color: "#e5e7eb" } },
                    datalabels: {
                        color: "#ffffff",
                        anchor: "center",
                        align: "bottom",
                        font: { weight: "bold", size: 10 },
                        formatter: (value) =>
                            (value === null || value === undefined ? "" : value.toFixed(1) + "%")
                    }
                },
                scales: {
                    x: { ticks: { color: "#cbd5e1" } },
                    y: { beginAtZero: true, max: 100, ticks: { color: "#cbd5e1" } }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    renderCharts("Product_8");
})();