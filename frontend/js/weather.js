// weather.js
import { api } from './api.js';

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

    // Current
    document.getElementById('current-temp').textContent = `${Math.round(current.temperature)}°C`;
    document.getElementById('current-condition').textContent = getWeatherLabel(current.weathercode);

    // Today's High/Low
    if (daily.length > 0) {
        document.getElementById('temp-high').textContent = Math.round(daily[0].max_temp);
        document.getElementById('temp-low').textContent = Math.round(daily[0].min_temp);
    }

    // Weekly Forecast
    const forecastContainer = document.getElementById('weather-forecast');
    forecastContainer.innerHTML = '';

    daily.slice(1, 6).forEach(day => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('ja-JP', { weekday: 'short' }); // 月, 火...
        const icon = getWeatherIcon(day.weather_code);

        const el = document.createElement('div');
        el.className = 'flex flex-col items-center min-w-[3rem]';
        el.innerHTML = `
            <span class="text-sm font-medium opacity-90 mb-1">${dayName}</span>
            <i class="fa-solid ${icon} text-xl mb-1"></i>
            <span class="text-sm font-bold">${Math.round(day.max_temp)}°</span>
        `;
        forecastContainer.appendChild(el);
    });
}

function getWeatherLabel(code) {
    // WMO Weather interpretation codes (WW)
    // Simplified mapping
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
