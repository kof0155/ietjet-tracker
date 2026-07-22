// app.js

const CORS_FALLBACK_DATA = {
  "last_updated": new Date().toISOString(),
  "fukuoka": {
    "route": "TPE ⇄ FUK (福岡 5 天來回)",
    "average_price": 12250,
    "grid": [
      {"start": "2026-08-06", "end": "2026-08-10", "display": "08/06(四) ~ 08/10(一)", "tag": "週四~週一", "price": 12500, "stops": "直達"},
      {"start": "2026-08-07", "end": "2026-08-11", "display": "08/07(五) ~ 08/11(二)", "tag": "週五~週二", "price": 10800, "stops": "直達"}
    ]
  },
  "tokyo": {
    "route": "TPE ⇄ TYO (東京 5 天來回)",
    "average_price": 15200,
    "grid": [
      {"start": "2026-08-06", "end": "2026-08-10", "display": "08/06(四) ~ 08/10(一)", "tag": "週四~週一", "price": 15500, "stops": "直達"},
      {"start": "2026-08-07", "end": "2026-08-11", "display": "08/07(五) ~ 08/11(二)", "tag": "週五~週二", "price": 14200, "stops": "直達"}
    ]
  }
};

let currentCity = "fukuoka";
let flightData = null;
let priceChartInstance = null;

function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    if (tabId === 'dashboard' && flightData) renderDashboard(flightData);
}

function switchCity(city) {
    currentCity = city;
    document.querySelectorAll('.nav-menu .city-selector .nav-btn').forEach(btn => btn.classList.remove('active'));
    
    if (city === 'fukuoka') {
        document.getElementById('btn-fukuoka').classList.add('active');
        document.getElementById('route-display-badge').textContent = 'TPE ⇄ FUK';
        document.getElementById('route-date-range').innerHTML = '追蹤區間：<b>未來 6 週 (四~一 & 五~二)</b>';
    } else {
        document.getElementById('btn-tokyo').classList.add('active');
        document.getElementById('route-display-badge').textContent = 'TPE ⇄ TYO';
        document.getElementById('route-date-range').innerHTML = '追蹤區間：<b>未來 12 週 (四~一 & 五~二)</b>';
    }
    
    switchTab('dashboard');
    if (flightData) renderDashboard(flightData);
}

async function loadFlightPrices() {
    try {
        const response = await fetch('./flight_prices.json', { cache: 'no-store' });
        if (!response.ok) throw new Error("Fetch failed");
        flightData = await response.json();
        renderDashboard(flightData);
    } catch (error) {
        flightData = CORS_FALLBACK_DATA;
        renderDashboard(CORS_FALLBACK_DATA);
    }
}

function formatTimestamp(isoString) {
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;
        return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    } catch (e) { return isoString; }
}

function renderDashboard(data) {
    document.getElementById('update-time').textContent = formatTimestamp(data.last_updated);
    const cityData = data[currentCity];
    if (!cityData) return;

    const grid = cityData.grid || [];
    if (grid.length === 0) return;

    const prices = grid.map(item => item.price);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const sortedGrid = [...grid].sort((a, b) => a.price - b.price);
    const bestOpt = sortedGrid[0];

    document.getElementById('current-price').textContent = `TWD ${bestOpt.price.toLocaleString()}`;
    document.getElementById('best-date-text').textContent = `${bestOpt.display}`;
    document.getElementById('lowest-price').textContent = `TWD ${avgPrice.toLocaleString()}`;

    const savings = avgPrice - bestOpt.price;
    const pct = Math.round((savings / avgPrice) * 100);
    const adviceEl = document.getElementById('advice-status');
    const adviceDetailsEl = document.getElementById('advice-details');
    const limitTrigger = currentCity === 'fukuoka' ? 300 : 500;

    if (savings >= limitTrigger) {
        adviceEl.textContent = `省 ${pct}%`;
        adviceEl.className = "card-value text-success";
        adviceDetailsEl.innerHTML = `推薦購買 <b>${bestOpt.display}</b>，比平均便宜了 TWD <b>${savings.toLocaleString()}</b> 元！`;
    } else {
        adviceEl.textContent = `價格平穩`;
        adviceEl.className = "card-value text-warning";
        adviceDetailsEl.textContent = `目前價格在正常行情區間。`;
    }

    renderBarChart(grid, bestOpt.price);
    renderTableList(grid, bestOpt.price);
}

function renderBarChart(grid, bestPrice) {
    const ctx = document.getElementById('priceChart');
    if (!ctx) return;

    const labels = grid.map(item => item.display);
    const values = grid.map(item => item.price);
    const backgroundColors = grid.map(item => item.price === bestPrice ? '#e60814' : (item.tag === "週五~週二" ? 'rgba(30, 144, 255, 0.35)' : 'rgba(255, 255, 255, 0.15)'));
    const borderColors = grid.map(item => item.price === bestPrice ? '#e60814' : (item.tag === "週五~週二" ? 'rgba(30, 144, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)'));

    if (priceChartInstance) priceChartInstance.destroy();

    const destName = currentCity === 'fukuoka' ? '福岡' : '東京';
    document.getElementById('chart-title').innerHTML = `<i class="fa-solid fa-chart-bar text-primary"></i> ${destName} 直飛票價對比 (藍色:週五~週二 / 灰色:週四~週一)`;

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
                barPercentage: 0.75
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(22, 28, 41, 0.95)',
                    padding: 12,
                    callbacks: {
                        label: ctx => `來回直飛票價: TWD ${ctx.parsed.y.toLocaleString()} 元`
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: 'hsl(210, 12%, 60%)', font: { size: 9 } } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: 'hsl(210, 12%, 60%)', callback: v => `${v / 1000}k` } }
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
        const bestBadge = isBest ? '<span class="badge success" style="margin-left:8px;">🔥 最省首選</span>' : '';
        const destCode = currentCity === 'fukuoka' ? 'FUK' : 'TYO';
        const searchUrl = `https://www.google.com/travel/flights?q=Flights%20to%20${destCode}%20from%20TPE%20on%20${item.start}%20through%20${item.end}%20direct`;

        html += `
        <tr ${isBest ? 'style="background: rgba(230, 8, 20, 0.03);"' : ''}>
            <td style="font-weight:700;">#${index + 1}</td>
            <td style="font-weight:700;">${item.display} ${bestBadge}</td>
            <td><span class="badge" style="background:rgba(255,255,255,0.06);">${item.tag || '5天來回'}</span></td>
            <td class="text-success"><i class="fa-solid fa-circle-check"></i> ${item.stops}</td>
            <td class="price-text" ${isBest ? 'style="color:var(--color-primary);"' : ''}>TWD ${item.price.toLocaleString()} 元</td>
            <td>
                <a href="${searchUrl}" target="_blank" class="btn-book">
                    <i class="fa-solid fa-cart-shopping"></i> 前往 Google
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
