// app.js

// Hardcoded Seed Backup Data for Local File Protocol (CORS Fallback)
const CORS_FALLBACK_DATA = {
  "last_updated": "2026-05-25T15:40:00+08:00",
  "route": "TPE ⇄ BKK",
  "dates": "2026/06/18 - 2026/06/22",
  "airline": "Thai VietJet (泰越捷航空)",
  "history": [
    {"timestamp": "2026-05-18T12:00:00+08:00", "price": 12500, "is_mock": true, "note": "Initial tracking"},
    {"timestamp": "2026-05-19T12:00:00+08:00", "price": 12200, "is_mock": true},
    {"timestamp": "2026-05-20T12:00:00+08:00", "price": 11900, "is_mock": true},
    {"timestamp": "2026-05-21T12:00:00+08:00", "price": 11800, "is_mock": true},
    {"timestamp": "2026-05-22T12:00:00+08:00", "price": 11200, "is_mock": true},
    {"timestamp": "2026-05-23T12:00:00+08:00", "price": 10950, "is_mock": true},
    {"timestamp": "2026-05-24T12:00:00+08:00", "price": 10800, "is_mock": true},
    {"timestamp": "2026-05-25T15:40:00+08:00", "price": 10424, "is_mock": false}
  ],
  "options": [
    {
      "outbound": {"departure": "15:40", "arrival": "18:30", "flight_no": "VZ563", "duration": "3h 50m", "stops": "直達"},
      "inbound": {"departure": "09:10", "arrival": "13:55", "flight_no": "VZ562", "duration": "3h 45m", "stops": "直達"},
      "price": 10424
    },
    {
      "outbound": {"departure": "15:40", "arrival": "18:30", "flight_no": "VZ563", "duration": "3h 50m", "stops": "直達"},
      "inbound": {"departure": "01:55", "arrival": "06:45", "flight_no": "VZ564", "duration": "3h 50m", "stops": "直達"},
      "price": 11463
    }
  ]
};

// Default personal threshold price stored locally
const DEFAULT_THRESHOLD = 10500;
let priceChartInstance = null;

// Tab Switcher Logic
function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    // Find button that triggers it
    const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => 
        btn.getAttribute('onclick').includes(tabId)
    );
    if (activeBtn) activeBtn.classList.add('active');
}

// Fetch and load the flight prices JSON database
async function loadFlightPrices() {
    try {
        console.log("Attempting to load flight prices...");
        const response = await fetch('./flight_prices.json', { cache: 'no-store' });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Loaded live data successfully.");
        renderDashboard(data, false);
    } catch (error) {
        console.warn("Could not fetch flight_prices.json dynamically (likely CORS under file:// protocol). Falling back to backup seed data.", error);
        
        // Indicate to the user that they are in preview mode
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

// Format ISO date to user-friendly string
function formatTimestamp(isoString) {
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;
        
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        
        return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
    } catch (e) {
        return isoString;
    }
}

// Render Dashboard components
function renderDashboard(data, isPreviewMode) {
    // 1. Update Last Updated time
    const updateTimeEl = document.getElementById('update-time');
    if (updateTimeEl) {
        updateTimeEl.textContent = formatTimestamp(data.last_updated);
    }

    // 2. Parse price values
    const history = data.history || [];
    if (history.length === 0) return;
    
    const latestEntry = history[history.length - 1];
    const currentPrice = latestEntry.price;
    
    // Find historical lowest
    let lowestPrice = currentPrice;
    let lowestDate = latestEntry.timestamp;
    
    history.forEach(item => {
        if (item.price < lowestPrice) {
            lowestPrice = item.price;
            lowestDate = item.timestamp;
        }
    });

    // 3. Render Metric Cards
    // Card 1: Current Price
    const currentPriceEl = document.getElementById('current-price');
    if (currentPriceEl) {
        currentPriceEl.textContent = `TWD ${currentPrice.toLocaleString()}`;
    }
    
    // Price change compared to previous
    const changeBadge = document.getElementById('price-change-badge');
    if (changeBadge && history.length > 1) {
        const prevPrice = history[history.length - 2].price;
        const diff = currentPrice - prevPrice;
        const pct = ((diff / prevPrice) * 100).toFixed(1);
        
        changeBadge.className = 'badge'; // reset
        if (diff < 0) {
            changeBadge.textContent = `↓ TWD ${Math.abs(diff).toLocaleString()} (${Math.abs(pct)}%)`;
            changeBadge.classList.add('success');
        } else if (diff > 0) {
            changeBadge.textContent = `↑ TWD ${diff.toLocaleString()} (+${pct}%)`;
            changeBadge.classList.add('danger');
        } else {
            changeBadge.textContent = `— 持平`;
            changeBadge.classList.add('neutral');
        }
    } else if (changeBadge) {
        changeBadge.textContent = '— 無紀錄';
        changeBadge.classList.add('neutral');
    }

    // Card 2: Historical Lowest Price
    const lowestPriceEl = document.getElementById('lowest-price');
    const lowestPriceDateEl = document.getElementById('lowest-price-date');
    if (lowestPriceEl) {
        lowestPriceEl.textContent = `TWD ${lowestPrice.toLocaleString()}`;
    }
    if (lowestPriceDateEl) {
        const formattedLowDate = formatTimestamp(lowestDate).split(' ')[0]; // only get date part
        lowestPriceDateEl.textContent = `最低點落在: ${formattedLowDate}`;
    }

    // Card 3: Status and target threshold
    // Get personal threshold from localStorage or fallback to default
    const savedThreshold = localStorage.getItem('personal_price_threshold');
    const threshold = savedThreshold ? parseInt(savedThreshold) : DEFAULT_THRESHOLD;
    
    const adviceEl = document.getElementById('advice-status');
    const adviceDetailsEl = document.getElementById('advice-details');
    
    if (adviceEl) {
        if (currentPrice <= threshold) {
            adviceEl.textContent = "✨ 建議購買 !";
            adviceEl.className = "card-value text-success";
            if (adviceDetailsEl) {
                adviceDetailsEl.innerHTML = `已低於目標價 <b>TWD ${threshold.toLocaleString()}</b>`;
            }
        } else {
            adviceEl.textContent = "⌛ 再等一下...";
            adviceEl.className = "card-value text-warning";
            if (adviceDetailsEl) {
                adviceDetailsEl.innerHTML = `尚未達到目標 <b>TWD ${threshold.toLocaleString()}</b>`;
            }
        }
    }

    // 4. Render Chart.js line chart
    renderChart(history);

    // 5. Render Flight Options Table
    renderFlightOptionsTable(data.options || []);
}

// Render Line Chart
function renderChart(history) {
    const ctx = document.getElementById('priceChart');
    if (!ctx) return;

    // Prepare chart labels and values
    const labels = history.map(item => {
        const date = new Date(item.timestamp);
        // Display format: e.g. "05/18"
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${mm}/${dd}`;
    });
    
    const values = history.map(item => item.price);

    // If chart already exists, destroy it before rendering a new one
    if (priceChartInstance) {
        priceChartInstance.destroy();
    }

    // Create gradient fill effect
    const chartCtx = ctx.getContext('2d');
    const gradient = chartCtx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(230, 8, 20, 0.25)');
    gradient.addColorStop(1, 'rgba(230, 8, 20, 0)');

    priceChartInstance = new Chart(chartCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '泰越捷來回票價 (TWD)',
                data: values,
                borderColor: '#e60814',
                borderWidth: 3,
                pointBackgroundColor: '#e60814',
                pointBorderColor: '#fff',
                pointBorderWidth: 1.5,
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.35, // Smooth line curves
                fill: true,
                backgroundColor: gradient,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // We use our own custom HTML legend
                },
                tooltip: {
                    backgroundColor: 'rgba(22, 28, 41, 0.95)',
                    titleFont: { family: 'Outfit', size: 13, weight: 'bold' },
                    bodyFont: { family: 'Outfit', size: 14, weight: 'bold' },
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `票價: TWD ${context.parsed.y.toLocaleString()} 元`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.03)',
                        borderColor: 'transparent'
                    },
                    ticks: {
                        color: 'hsl(210, 12%, 60%)',
                        font: { family: 'Outfit', size: 11, weight: '500' }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.03)',
                        borderColor: 'transparent'
                    },
                    ticks: {
                        color: 'hsl(210, 12%, 60%)',
                        font: { family: 'Outfit', size: 11, weight: '500' },
                        callback: function(value) {
                            return `${value / 1000}k`;
                        }
                    }
                }
            }
        }
    });
}

// Render Flight Options Table
function renderFlightOptionsTable(options) {
    const tableBody = document.getElementById('flight-options-body');
    if (!tableBody) return;
    
    if (options.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center">無可用航班選項。</td></tr>`;
        return;
    }

    let rowsHTML = "";
    options.forEach((opt, index) => {
        const out = opt.outbound || {};
        const ib = opt.inbound || {};
        const googleFlightsUrl = "https://www.google.com/travel/flights?q=Flights%20to%20BKK%20from%20TPE%20on%202026-06-18%20through%202026-06-22";

        rowsHTML += `
        <tr>
            <td style="font-weight: 700;">#${index + 1}</td>
            <td>
                <div class="flight-cell">
                    <div class="flight-time-line">
                        <span>${out.departure || '15:40'}</span>
                        <i class="fa-solid fa-arrow-right time-arrow"></i>
                        <span>${out.arrival || '18:30'}</span>
                    </div>
                    <div class="flight-meta-line">
                        <span class="meta-item"><i class="fa-solid fa-plane"></i> ${out.flight_no || 'VZ563'}</span>
                        <span class="meta-item"><i class="fa-solid fa-hourglass-half"></i> ${out.duration || '3h 50m'}</span>
                        <span class="meta-item text-success"><i class="fa-solid fa-circle-check"></i> ${out.stops || '直達'}</span>
                    </div>
                </div>
            </td>
            <td>
                <div class="flight-cell">
                    <div class="flight-time-line">
                        <span>${ib.departure || '09:10'}</span>
                        <i class="fa-solid fa-arrow-right time-arrow"></i>
                        <span>${ib.arrival || '13:55'}</span>
                    </div>
                    <div class="flight-meta-line">
                        <span class="meta-item"><i class="fa-solid fa-plane"></i> ${ib.flight_no || 'VZ562'}</span>
                        <span class="meta-item"><i class="fa-solid fa-hourglass-half"></i> ${ib.duration || '3h 45m'}</span>
                        <span class="meta-item text-success"><i class="fa-solid fa-circle-check"></i> ${ib.stops || '直達'}</span>
                    </div>
                </div>
            </td>
            <td class="price-text">TWD ${opt.price.toLocaleString()} 元</td>
            <td>
                <a href="${googleFlightsUrl}" target="_blank" class="btn-book">
                    <i class="fa-solid fa-cart-shopping"></i> 訂購機票
                </a>
            </td>
        </tr>
        `;
    });

    tableBody.innerHTML = rowsHTML;
}

// Initialise Application on page load
window.addEventListener('DOMContentLoaded', () => {
    // Check if personal threshold already stored in localStorage
    const savedThreshold = localStorage.getItem('personal_price_threshold');
    if (!savedThreshold) {
        localStorage.setItem('personal_price_threshold', DEFAULT_THRESHOLD);
    }
    
    // Load flight prices dynamically
    loadFlightPrices();
});
