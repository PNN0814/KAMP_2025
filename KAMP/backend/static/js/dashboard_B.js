/**
 * 파일명 : dashboard_B.js
 * 설명   : 전처리 B 탭 (XGBoost)
 * 구조   : A탭 코드와 동일하게 완전 복제, 단일 동작 보장 + 초기 렌더 자동 실행
 * 개선   : 로딩바 없이 부드러운 fade + 순차 렌더링(progressive render)
 */

Chart.register(ChartDataLabels);

(async () => {
    const tabB = document.getElementById("tab-preprocessing2");
    if (!tabB) return;

    window.chartInstances_B = window.chartInstances_B || {};

    const res = await fetch("/api/preprocessing-b");
    const data = await res.json();
    if (data.error) return console.error("B탭 데이터 로드 실패:", data.error);

    // ----------------------------
    // 헤더 통계값 갱신
    // ----------------------------
    function updateHeaderStats_B(data) {
        if (!data || data.length === 0) return;
        const avgMAE = (data.reduce((s, d) => s + (d.MAE ?? 0), 0) / data.length).toFixed(2);
        const avgSMAPE = (data.reduce((s, d) => s + (d.SMAPE ?? 0), 0) / data.length).toFixed(2);
        const avgAcc = (data.reduce((s, d) => s + (d.Accuracy ?? 0), 0) / data.length).toFixed(2);

        document.querySelectorAll("#tab-preprocessing2 .header-stats .stat-badge").forEach(b => {
            const label = b.querySelector(".stat-label")?.textContent || "";
            const val = b.querySelector(".stat-value");
            if (!val) return;
            if (label.includes("MAE")) val.textContent = `${avgMAE}%`;
            else if (label.includes("SMAPE")) val.textContent = `${avgSMAPE}%`;
            else if (label.includes("Accuracy")) val.textContent = `${avgAcc}%`;
        });
    }

    // ----------------------------
    // 사이드바 전체 평균 갱신
    // ----------------------------
    function updateSidebarStats_B(allData) {
        if (!allData || allData.length === 0) return;
        const avgMAE = (allData.reduce((s, d) => s + (d.MAE ?? 0), 0) / allData.length).toFixed(2);
        const avgSMAPE = (allData.reduce((s, d) => s + (d.SMAPE ?? 0), 0) / allData.length).toFixed(2);
        const avgAcc = (allData.reduce((s, d) => s + (d.Accuracy ?? 0), 0) / allData.length).toFixed(2);

        document.querySelectorAll(".model-info .info-item").forEach(item => {
            const label = item.querySelector(".info-label")?.textContent || "";
            const val = item.querySelector(".info-value");
            if (!val) return;
            if (label.includes("MAE")) val.textContent = `${avgMAE}%`;
            else if (label.includes("SMAPE")) val.textContent = `${avgSMAPE}%`;
            else if (label.includes("Accuracy")) val.textContent = `${avgAcc}%`;
        });
    }

    updateSidebarStats_B(data);

    // ----------------------------
    // 탭 활성화 감지
    // ----------------------------
    const tabBObserver = new MutationObserver(muts => {
        for (const m of muts) {
            if (m.attributeName === "class" && m.target.classList.contains("active")) {
                requestAnimationFrame(() => renderCharts_B("Product_8"));
            }
        }
    });
    tabBObserver.observe(tabB, { attributes: true });

    // ----------------------------
    // 서브탭 이벤트
    // ----------------------------
    document.querySelectorAll("#tab-preprocessing2 .subtab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll("#tab-preprocessing2 .subtab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll("#tab-preprocessing2 .subtab-content").forEach(c => c.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(tab.dataset.target).classList.add("active");
            renderCharts_B("Product_8");
            document.querySelectorAll("#tab-preprocessing2 .filter-button").forEach(btn => {
                btn.classList.remove("active");
                if (btn.textContent.startsWith("Product_8")) btn.classList.add("active");
            });
        });
    });

    // ----------------------------
    // 필터 생성 함수
    // ----------------------------
    const groups_B = ["Product_8", "Product_9", "Product_a", "Product_b", "Product_c", "Product_d", "Product_e", "Product_f"];

    function createFilterTabs_B(containerId, onClick) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";
        groups_B.forEach((group, idx) => {
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

    ["filter-predict-b", "filter-table-b", "filter-metrics-b", "filter-accuracy-b"].forEach(id => {
        createFilterTabs_B(id, g => renderCharts_B(g));
    });

    // ----------------------------
    // 메인 렌더 함수 (✨ fade + 순차 렌더 추가)
    // ----------------------------
    async function renderCharts_B(prefix) {
        const filtered = data.filter(d => d.Product_Number.startsWith(prefix));
        const products = [...new Set(filtered.map(d => d.Product_Number))];

        // ✅ 렌더 중 페이드 효과
        const activeTab = tabB.querySelector(".subtab-content.active");
        if (activeTab) {
            activeTab.style.transition = "opacity 0.3s ease";
            activeTab.style.opacity = "0.4";
        }

        // ✅ Chart 생성 순차 렌더링
        await new Promise(r => setTimeout(r, 20));
        ["predChart_B", "featChart_B", "accChart_B"].forEach(destroyChart_B);
        renderPredictionChart_B(filtered, products);

        await new Promise(r => setTimeout(r, 20));
        renderTable_B(filtered);

        await new Promise(r => setTimeout(r, 20));
        renderFeatureChart_B(filtered, products);

        await new Promise(r => setTimeout(r, 20));
        renderAccuracyChart_B(filtered, products);

        updateHeaderStats_B(filtered);
        updateSidebarStats_B(data);

        // ✅ 렌더 완료 후 페이드 복귀
        setTimeout(() => { if (activeTab) activeTab.style.opacity = "1"; }, 200);
    }

    // ----------------------------
    // 안전한 차트 제거
    // ----------------------------
    function destroyChart_B(name) {
        if (window.chartInstances_B[name]) {
            try { window.chartInstances_B[name].destroy(); }
            catch (e) { console.warn(`[WARN] Chart destroy 실패 (${name}):`, e); }
            window.chartInstances_B[name] = null;
        }
    }

    // ----------------------------
    // 예측 수주량 (막대)
    // ----------------------------
    function renderPredictionChart_B(data, prods) {
        const canvas = document.getElementById("chart-prep2-prediction");
        if (!canvas) return;
        destroyChart_B("predChart_B");
        const ctx = canvas.getContext("2d");
        const colors = ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc948"];
        const allVals = data.map(d => d.Pred_Value ?? 0);
        const maxV = Math.max(...allVals);
        const step = maxV <= 50 ? 10 : maxV <= 200 ? 20 : maxV <= 500 ? 50 : maxV <= 1000 ? 100 : maxV <= 2000 ? 200 : 500;
        const yMax = Math.ceil(maxV / step + 1) * step;

        window.chartInstances_B.predChart_B = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["T+1", "T+2", "T+3"],
                datasets: prods.map((p, i) => ({
                    label: p,
                    data: data.filter(d => d.Product_Number === p).slice(-3).map(r => r.Pred_Value),
                    backgroundColor: colors[i % colors.length]
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.6,
                animation: { duration: 600, easing: "easeInOutCubic", animateScale: true },
                plugins: {
                    title: { display: true, text: "예측 vs 실제 (3일 예측 수주량 - XGBoost)" },
                    legend: { position: "bottom", labels: { color: "#e5e7eb" } },
                    datalabels: {
                        color: "#ffffff",
                        anchor: "end",
                        align: "top",
                        clip: false,
                        font: { weight: "bold", size: 11 },
                        formatter: v => (v === null || v === undefined ? "" : v.toLocaleString())
                    }
                },
                scales: {
                    x: { ticks: { color: "#cbd5e1" } },
                    y: { beginAtZero: true, max: yMax, ticks: { color: "#cbd5e1", stepSize: step } }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    // ----------------------------
    // 예측 수주량 (테이블)
    // ----------------------------
    function renderTable_B(data) {
        const container = document.getElementById("chart-prep2-table");
        if (!container) return;
        const grouped = {};
        data.forEach(r => (grouped[r.Product_Number] = grouped[r.Product_Number] || []).push(r));
        const allDates = [...new Set(data.map(d => d.Date))].sort((a, b) => new Date(b) - new Date(a));
        const recent = allDates.slice(0, 3).reverse();
        const dateLabels = recent.map((d, i) => `${d} (T+${i + 1})`);
        const rows = Object.entries(grouped).map(([prod, items]) => {
            const byDate = {}; items.forEach(i => (byDate[i.Date] = i.Pred_Value ?? "-"));
            return { Product_Number: prod, T1: byDate[recent[0]] ?? "-", T2: byDate[recent[1]] ?? "-", T3: byDate[recent[2]] ?? "-" };
        });
        container.innerHTML = `
            <table class="prediction-table">
                <thead><tr><th>#</th><th>Product_Number</th>
                <th>${dateLabels[0]}</th><th>${dateLabels[1]}</th><th>${dateLabels[2]}</th></tr></thead>
                <tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r.Product_Number}</td><td>${r.T1}</td><td>${r.T2}</td><td>${r.T3}</td></tr>`).join("")}</tbody>
            </table>`;
    }

    // ----------------------------
    // 지표 비교 (막대)
    // ----------------------------
    function renderFeatureChart_B(data, prods) {
        const canvas = document.getElementById("chart-prep2-features");
        if (!canvas) return;
        destroyChart_B("featChart_B");
        const ctx = canvas.getContext("2d");
        const metrics = ["MAE", "SMAPE", "Accuracy"];
        const colors = ["#4e79a7", "#f28e2b", "#e15759"];
        const vals = data.flatMap(d => [d.MAE ?? 0, d.SMAPE ?? 0, d.Accuracy ?? 0]);
        const maxV = Math.max(...vals);
        const step = maxV <= 50 ? 10 : maxV <= 200 ? 20 : maxV <= 500 ? 50 : maxV <= 1000 ? 100 : 200;
        const yMax = Math.ceil(maxV / step + 1) * step;

        window.chartInstances_B.featChart_B = new Chart(ctx, {
            type: "bar",
            data: {
                labels: prods,
                datasets: metrics.map((m, i) => ({
                    label: m,
                    data: prods.map(p => data.find(d => d.Product_Number === p)?.[m] ?? 0),
                    backgroundColor: colors[i]
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.6,
                animation: { duration: 600, easing: "easeInOutCubic", animateScale: true },
                plugins: {
                    title: { display: true, text: "지표 비교 (MAE / SMAPE / Accuracy - XGBoost)" },
                    legend: { position: "bottom", labels: { color: "#e5e7eb" } },
                    datalabels: {
                        color: "#ffffff",
                        anchor: "end",
                        align: "top",
                        clip: false,
                        font: { weight: "bold", size: 11 },
                        formatter: v => (v === null || v === undefined ? "" : v.toLocaleString())
                    }
                },
                scales: {
                    x: { ticks: { color: "#cbd5e1" } },
                    y: { beginAtZero: true, max: yMax, ticks: { color: "#cbd5e1", stepSize: step } }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    // ----------------------------
    // 정확도 비교 (라인)
    // ----------------------------
    function renderAccuracyChart_B(data, prods) {
        const canvas = document.getElementById("chart-prep2-epochs");
        if (!canvas) return;
        destroyChart_B("accChart_B");
        const ctx = canvas.getContext("2d");

        window.chartInstances_B.accChart_B = new Chart(ctx, {
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
                animation: { duration: 600, easing: "easeInOutCubic" },
                plugins: {
                    title: { display: true, text: "제품별 Accuracy 변화 (XGBoost)" },
                    legend: { position: "bottom", labels: { color: "#e5e7eb" } },
                    datalabels: {
                        color: "#ffffff",
                        anchor: "center",
                        align: "bottom",
                        font: { weight: "bold", size: 10 },
                        formatter: v => (v === null || v === undefined ? "" : v.toFixed(1) + "%")
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

    // ✅ 첫 렌더 강제 실행 (새로고침 시 차트 안 나오는 현상 방지)
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => {
            if (document.getElementById("tab-preprocessing2")) {
                try {
                    renderCharts_B("Product_8");
                } catch (e) {
                    console.warn("B탭 초기 렌더 중 오류:", e);
                }
            }
        }, 200);
    });

    // ✅ 전역에서 접근 가능하도록 export
    window.renderCharts_B = renderCharts_B;

    // ✅ 기본 렌더
    renderCharts_B("Product_8");
})();
