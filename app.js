// app.js

// 本地 CORS 預覽備份模擬資料 (包含福岡與東京)
const CORS_FALLBACK_DATA = {
  "last_updated": new Date().toISOString(),
  "fukuoka": {
    "route": "TPE ⇄ FUK (福岡 5 天來回)",
    "average_price": 12250,
    "grid": [
      {"start": "2026-07-02", "end": "2026-07-06", "display": "07/02 ~ 07/06", "price": 12500, "airline": "直飛航空", "stops": "直達"},
      {"start": "2026-07-09", "end": "2026-07-13", "display": "07/09 ~ 07/13", "price": 10800, "airline": "直飛航空", "stops": "直達"},
      {"start": "2026-07-16", "end": "2026-07-20", "display": "07/16 ~ 07/20", "price": 13200, "airline": "直飛航空", "stops": "直達"},
      {"start": "2026-07-23", "end": "2026-07-27", "display": "07/23 ~ 07/27", "price": 11800, "airline": "直飛航空", "stops": "直達"},
      {"start": "2026-07-30", "end": "2026-08-03", "display": "07/30 ~ 08/03", "price": 12900, "airline": "直飛航空", "stops": "直達"},
      {"start": "2026-08-06", "end": "2026-08-10", "display": "08/06 ~ 08/10", "price": 12100, "airline": "直飛航空", "stops": "直達"}
    ]
  },
  "tokyo": {
    "route": "TPE ⇄ TYO (東京 5 天來回)",
    "average_price": 15200,
    "grid": [
      {"start": "2026-07-02", "end": "2026-07-06", "display": "07/02 ~ 07/06", "price": 15500, "airline": "直飛航空", "stops": "直達"},
      {"start": "2026-07-09", "end": "2026-07-13", "display": "07/09 ~ 07/13", "price": 14200, "airline": "直飛航空", "stops": "直達"},
      {"start": "2026-07-16", "end": "2026-07-20", "display": "07/16 ~ 07/20", "price": 16800, "airline": "直飛航空", "stops": "直達"},
      {"start": "2026-07-23", "end": "2026-07-27", "display": "07/23 ~ 07/27", "price": 13900, "airline": "直飛航空", "stops": "直達"},
      {"start": "2026-07-30", "end": "2026-08-03", "display": "07/30 ~ 08/03", "price": 15900, "airline": "直飛航空", "stops": "直達"},
      {"start": "2026-08-06", "end": "2026-08-10", "display": "08/06 ~ 08/10", "price": 14800, "airline": "直飛航空", "stops": "直達"},
      {"start": "2026-08-13", "end": "2026-08-17", "display": "08/13 ~ 08/17", "price": 16200, "airline": "直飛航空", "stops": "直達"},
      {"start": "2026-08-20", "end": "2026-08-24", "display": "08/20 ~ 08/24", "price": 14100, "airline": "直飛航空", "stops": "直達"},
      {"start": "2026-08-27", "end": "2026-08-31", "display": "08/27 ~ 08/31", "price": 15200, "airline": "直飛航空", "stops": "直達"},
      {"start": "2026-09-03", "end": "2026-09-07", "display": "09/03 ~ 09/07", "price": 14900, "airline": "直飛航空", "stops": "直達"},
      {"start": "2026-09-10", "end": "2026-09-14", "display": "09/10 ~ 09/14", "price": 16500, "airline": "直飛航空", "stops": "直達"},
      {"start": "2026-09-17", "end": "2026-09-21", "display": "09/17 ~ 09/21", "price": 14500, "airline": "直飛航空", "stops": "直達"}
    ]
  }
};

let currentCity = "fukuoka"; // 預設呈現福岡
let flightData = null;
let priceChartInstance = null;

function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    // 如果切換回 dashboard 確保圖表正確渲染
    if (tabId === 'dashboard' && flightData) {
        renderDashboard(flightData);
    }
}

function switchCity(city) {
    currentCity = city;
    document.querySelectorAll('.nav-menu .city-selector .nav-btn').forEach(btn => btn.classList.remove('active'));
    
    if (city === 'fukuoka') {
        document.getElementById('btn-fukuoka').classList.add('active');
        document.getElementById('route-display-badge').textContent = 'TPE ⇄ FUK';
        document.getElementById('route-date-range').innerHTML = '追蹤區間：<b>未來 6 週 (5天來回)</b>';
    } else {
        document.getElementById('btn-tokyo').classList.add('active');
        document.getElementById('route-display-badge').textContent = 'TPE ⇄ TYO';
        document.getElementById('route-date-range').innerHTML = '追蹤區間：<b>未來 12 週 (3個月來回)</b>';
    }
    
    switchTab('dashboard');
    if (flightData) {
        renderDashboard(flightData);
    }
}

async function loadFlightPrices() {
    try {
        const response = await fetch('./flight_prices.json', { cache: 'no-store' });
        if (!response.ok) throw new Error("Fetch failed");
        flightData = await response.json();
        renderDashboard(flightData);
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
        flightData = CORS_FALLBACK_DATA;
        renderDashboard(CORS_FALLBACK_DATA);
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

function renderDashboard(data) {
    document.getElementById('update-time').textContent = formatTimestamp(data.last_updated);

    // 依據目前選擇的城市讀取對應的資料
    const cityData = data[currentCity];
    if (!cityData) return;

    const grid = cityData.grid || [];
    if (grid.length === 0) return;

    // 計算平均票價
    const prices = grid.map(item => item.price);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    
    // 找出最劃算選項
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

    const destName = currentCity === 'fukuoka' ? '福岡' : '東京';
    const limitTrigger = currentCity === 'fukuoka' ? 300 : 500;

    if (savings >= limitTrigger) {
        adviceEl.textContent = `省 ${pct}%`;
        adviceEl.className = "card-value text-success";
        adviceDetailsEl.innerHTML = `推薦購買 <b>${bestOpt.display}</b>，比平均便宜了 TWD <b>${savings.toLocaleString()}</b> 元！`;
    } else {
        adviceEl.textContent = `價格平穩`;
        adviceEl.className = "card-value text-warning";
        adviceDetailsEl.textContent = `目前價格均在 ${destName} 的正常行情區間。`;
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
    
    // 最劃算的使用紅色，其他使用半透明白色
    const backgroundColors = grid.map(item => item.price === bestPrice ? '#e60814' : 'rgba(255, 255, 255, 0.15)');
    const borderColors = grid.map(item => item.price === bestPrice ? '#e60814' : 'rgba(255, 255, 255, 0.3)');

    if (priceChartInstance) {
        priceChartInstance.destroy();
    }

    // 動態修改圖表標題
    const destName = currentCity === 'fukuoka' ? '福岡' : '東京';
    document.getElementById('chart-title').innerHTML = `<i class="fa-solid fa-chart-bar text-primary"></i> ${destName} 出發票價對比 (週四~週一)`;

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
                barPercentage: currentCity === 'fukuoka' ? 0.6 : 0.8
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
                            return `來回直飛票價: TWD ${context.parsed.y.toLocaleString()} 元`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: 'hsl(210, 12%, 60%)', font: { family: 'Outfit', size: 10 } }
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
        const destCode = currentCity === 'fukuoka' ? 'FUK' : 'TYO';
        const searchUrl = `https://www.google.com/travel/flights?q=Flights%20to%20${destCode}%20from%20TPE%20on%20${item.start}%20through%20${item.end}%20direct`;

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
