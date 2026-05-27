// app.js

const CORS_FALLBACK_DATA = {
  "last_updated": new Date().toISOString(),
  "route": "TPE ⇄ FUK (直飛 5 天來回)",
  "average_price": 12250,
  "grid": [
    {"start": "2026-06-04", "end": "2026-06-08", "display": "06/04 ~ 06/08", "price": 12500, "airline": "直飛航空", "stops": "直達"},
    {"start": "2026-06-11", "end": "2026-06-15", "display": "06/11 ~ 06/15", "price": 10800, "airline": "直飛航空", "stops": "直達"},
    {"start": "2026-06-18", "end": "2026-06-22", "display": "06/18 ~ 06/22", "price": 13200, "airline": "直飛航空", "stops": "直達"},
    {"start": "2026-06-25", "end": "2026-06-29", "display": "06/25 ~ 06/29", "price": 11800, "airline": "直飛航空", "stops": "直達"},
    {"start": "2026-07-02", "end": "2026-07-06", "display": "07/02 ~ 07/06", "price": 12900, "airline": "直飛航空", "stops": "直達"},
    {"start": "2026-07-09", "end": "2026-07-13", "display": "07/09 ~ 07/13", "price": 12100, "airline": "直飛航空", "stops": "直達"}
  ]
};

let priceChartInstance = null;

function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => 
        btn.getAttribute('onclick').includes(tabId)
    );
    if (activeBtn) activeBtn.classList.add('active');
}

async function loadFlightPrices() {
    try {
        const response = await fetch('./flight_prices.json', { cache: 'no-store' });
        if (!response.ok) throw new Error("Fetch failed");
        const data = await response.json();
        renderDashboard(data, false);
    } catch (error) {
        console.warn("Using fallback preview data.", error);
        const statusText = document.querySelector('.status-text');
        const pulseDot = document.querySelector('.pulse-dot');
        if (statusText && pulseDot) {
            statusText.textContent = "本地預覽模式";
            statusText.style.color = "var(--color-info)";
            pulseDot.style.backgroundColor = "var(--color-info)";
            pulseDot.style.boxShadow = "0 0 10px var(--color-info)";
        }
        renderDashboard(CORS_FALLBACK_DATA, true);
    }
}

function formatTimestamp(isoString) {
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;
        return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    } catch (e) {
        return isoString;
    }
}

function renderDashboard(data, isPreview) {
    document.getElementById('update-time').textContent = formatTimestamp(data.last_updated);

    const grid = data.grid || [];
    if (grid.length === 0) return;

    // 計算平均票價
    const prices = grid.map(item => item.price);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    
    // 找出最划算選項
    const sortedGrid = [...grid].sort((a, b) => a.price - b.price);
    const bestOpt = sortedGrid[0];

    // Card 1: 最低票價與最佳日期
    document.getElementById('current-price').textContent = `TWD ${bestOpt.price.toLocaleString()}`;
    document.getElementById('best-date-text').textContent = bestOpt.display;

    // Card 2: 平均票價
    document.getElementById('lowest-price').textContent = `TWD ${avgPrice.toLocaleString()}`;

    // Card 3: 購票評估
    const savings = avgPrice - bestOpt.price;
    const pct = Math.round((savings / avgPrice) * 100);
    const adviceEl = document.getElementById('advice-status');
    const adviceDetailsEl = document.getElementById('advice-details');

    if (savings > 300) {
        adviceEl.textContent = `省 ${pct}%`;
        adviceEl.className = "card-value text-success";
        adviceDetailsEl.innerHTML = `推薦購買 <b>${bestOpt.display}</b>，比行情便宜了 TWD <b>${savings.toLocaleString()}</b> 元！`;
    } else {
        adviceEl.textContent = `行情價`;
        adviceEl.className = "card-value text-warning";
        adviceDetailsEl.textContent = "價格平穩，與 6 週內平均行情相近。";
    }

    // 繪製柱狀圖
    renderBarChart(grid, bestOpt.price);

    // 渲染表格清單
    renderTableList(grid, bestOpt.price);
}

function renderBarChart(grid, bestPrice) {
    const ctx = document.getElementById('priceChart');
    if (!ctx) return;

    const labels = grid.map(item => item.display);
    const values = grid.map(item => item.price);
    const backgroundColors = grid.map(item => item.price === bestPrice ? '#e60814' : 'rgba(255, 255, 255, 0.15)');
    const borderColors = grid.map(item => item.price === bestPrice ? '#e60814' : 'rgba(255, 255, 255, 0.3)');

    if (priceChartInstance) {
        priceChartInstance.destroy();
    }

    priceChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1.5,
                borderRadius: 6,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(22, 28, 41, 0.95)',
                    titleFont: { family: 'Outfit', size: 13, weight: 'bold' },
                    bodyFont: { family: 'Outfit', size: 14, weight: 'bold' },
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `來回票價: TWD ${context.parsed.y.toLocaleString()} 元`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: 'hsl(210, 12%, 60%)', font: { family: 'Outfit', size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: {
                        color: 'hsl(210, 12%, 60%)',
                        font: { family: 'Outfit', size: 11 },
                        callback: value => `${value / 1000}k`
                    }
                }
            }
        }
    });
}

function renderTableList(grid, bestPrice) {
    const body = document.getElementById('flight-options-body');
    if (!body) return;

    let html = "";
    grid.forEach((item, index) => {
        const isBest = item.price === bestPrice;
        const bestBadge = isBest ? '<span class="badge success" style="margin-left:8px;">🔥 最省選這週</span>' : '';
        const searchUrl = `https://www.google.com/travel/flights?q=Flights%20to%20FUK%20from%20TPE%20on%20${item.start}%20through%20${item.end}%20direct`;

        html += `
        <tr ${isBest ? 'style="background: rgba(230, 8, 20, 0.03);"' : ''}>
            <td style="font-weight:700;">#${index + 1}</td>
            <td style="font-weight:700;">
                ${item.display}
                ${bestBadge}
            </td>
            <td>5 天來回 (週四 ~ 週一)</td>
            <td class="text-success"><i class="fa-solid fa-circle-check"></i> ${item.stops}</td>
            <td class="price-text" ${isBest ? 'style="color:var(--color-primary);"' : ''}>TWD ${item.price.toLocaleString()} 元</td>
            <td>
                <a href="${searchUrl}" target="_blank" class="btn-book">
                    <i class="fa-solid fa-cart-shopping"></i> 前往 Google Flights
                </a>
            </td>
        </tr>
        `;
    });
    body.innerHTML = html;
}

window.addEventListener('DOMContentLoaded', () => {
    loadFlightPrices();
});
