// weather.js
import { api } from './api.js';

let weatherChart = null;

export async function initWeather(location) {
    if (!location) return;

    document.getElementById('weather-location').textContent = location.name || "Loading...";

    try {
        const data = await api.getWeather(location.lat, location.lon);
        renderWeather(data);
    } catch (e) {
        console.error("Weather load failed", e);
        document.getElementById('weather-location').textContent = "Error";
    }
}

function renderWeather(data) {
    if (!data || !data.current) return;

    const current = data.current;
    const daily = data.daily || [];
    const hourly = data.hourly || [];
    const pollen = data.pollen || {};

    // Current
    document.getElementById('current-temp').textContent = `${Math.round(current.temperature)}°C`;
    document.getElementById('current-condition').textContent = getWeatherLabel(current.weathercode);

    // Today's High/Low
    if (daily.length > 0) {
        document.getElementById('temp-high').textContent = Math.round(daily[0].max_temp);
        document.getElementById('temp-low').textContent = Math.round(daily[0].min_temp);
    }

    // Weekly Forecast (5 days including today)
    const forecastContainer = document.getElementById('weather-forecast');
    forecastContainer.innerHTML = '';

    daily.slice(0, 5).forEach(day => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('ja-JP', { weekday: 'short' }); // 月, 火...
        const icon = getWeatherIcon(day.weather_code);
        const label = getWeatherLabel(day.weather_code);

        const el = document.createElement('div');
        el.className = 'flex flex-col items-center min-w-[4rem] bg-white/10 rounded p-1 mx-1 backdrop-blur-sm';
        el.innerHTML = `
            <span class="text-xs font-medium opacity-90 mb-1">${dayName}</span>
            <i class="fa-solid ${icon} text-xl mb-1"></i>
            <span class="text-xs font-bold mb-1">${label}</span>
            <span class="text-sm font-bold">${Math.round(day.max_temp)}°</span>
        `;
        forecastContainer.appendChild(el);
    });

    // Pollen
    renderPollen(pollen);

    // Hourly Chart
    renderChart(hourly);
}

function renderPollen(pollenData) {
    const container = document.getElementById('pollen-container');
    const list = document.getElementById('pollen-list');
    list.innerHTML = '';

    if (!pollenData || Object.keys(pollenData).length === 0) {
        container.classList.add('hidden');
        return;
    }

    // Check if any pollen data exists (>0)
    const hasPollen = Object.values(pollenData).some(v => v > 0);

    if (!hasPollen) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');

    const labels = {
        "alder_pollen": "ハンノキ",
        "birch_pollen": "シラカバ",
        "grass_pollen": "イネ科",
        "mugwort_pollen": "ヨモギ",
        "olive_pollen": "オリーブ",
        "ragweed_pollen": "ブタクサ",
        "japan_cedar_pollen": "スギ",
        "japan_cypress_pollen": "ヒノキ"
    };

    Object.entries(pollenData).forEach(([key, value]) => {
        if (value > 0) {
            const span = document.createElement('span');
            span.className = "bg-white/30 px-2 py-1 rounded text-white";
            span.textContent = `${labels[key] || key}: ${value.toFixed(1)}`;
            list.appendChild(span);
        }
    });
}

function renderChart(hourlyData) {
    const ctx = document.getElementById('weather-chart');
    if (!ctx) return;

    if (weatherChart) {
        weatherChart.destroy();
    }

    if (!hourlyData || hourlyData.length === 0) return;

    // Limit to 24 hours
    const data = hourlyData.slice(0, 24);
    const labels = data.map(d => {
        const date = new Date(d.time);
        return `${date.getHours()}:00`;
    });
    const temps = data.map(d => d.temp);
    const probs = data.map(d => d.precip_prob);
    const amounts = data.map(d => d.precip_amount);

    weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '気温 (°C)',
                    data: temps,
                    borderColor: 'rgba(255, 255, 255, 1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    yAxisID: 'y',
                    tension: 0.4,
                    pointRadius: 2
                },
                {
                    label: '降水確率 (%)',
                    data: probs,
                    borderColor: 'rgba(147, 197, 253, 0.8)', // Light Blue
                    backgroundColor: 'rgba(147, 197, 253, 0.3)',
                    yAxisID: 'y1',
                    type: 'bar',
                    barThickness: 8
                },
                {
                    label: '降水量 (mm)',
                    data: amounts,
                    borderColor: 'rgba(59, 130, 246, 0.8)', // Blue
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    yAxisID: 'y1',
                    type: 'bar',
                    barThickness: 8,
                    hidden: true // Hidden by default as amounts are usually 0 and scale messes up probs
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    labels: { color: 'white', boxWidth: 10, font: { size: 10 } }
                }
            },
            scales: {
                x: {
                    ticks: { color: 'white', maxTicksLimit: 8, font: { size: 10 } },
                    grid: { display: false }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: { color: 'white', font: { size: 10 } },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { display: false },
                    ticks: { color: 'rgba(147, 197, 253, 1)', font: { size: 10 } },
                    suggestedMax: 100,
                    beginAtZero: true
                }
            }
        }
    });
}

function getWeatherLabel(code) {
    if (code === 0) return "晴天";
    if (code >= 1 && code <= 3) return "曇り";
    if (code >= 45 && code <= 48) return "霧";
    if (code >= 51 && code <= 55) return "霧雨";
    if (code >= 61 && code <= 65) return "雨";
    if (code >= 71 && code <= 77) return "雪";
    if (code >= 80 && code <= 82) return "にわか雨";
    if (code >= 95) return "雷雨";
    return "不明";
}

function getWeatherIcon(code) {
    if (code === 0) return "fa-sun";
    if (code >= 1 && code <= 3) return "fa-cloud";
    if (code >= 45 && code <= 48) return "fa-smog";
    if (code >= 51 && code <= 65) return "fa-cloud-rain";
    if (code >= 71 && code <= 77) return "fa-snowflake";
    if (code >= 80 && code <= 82) return "fa-cloud-showers-heavy";
    if (code >= 95) return "fa-bolt";
    return "fa-question";
}
