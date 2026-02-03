import { api } from './api.js';
import { settings } from './settings.js';
import { initWeather } from './weather.js';
import { initSteamCarousel, renderSteamLists } from './carousel.js';
import { initEnglish } from './english.js';
import { prefectures } from './prefectures.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("News Hub Initializing...");

    const userSettings = settings.get();

    // Initialize Components
    initTheme();
    initWeather(userSettings.location);
    initNews(userSettings.categories);
    initSteam();
    initEnglish();
    initSettingsModal();

    // Global Event Listeners
    document.getElementById('refresh-btn').addEventListener('click', () => {
        location.reload();
    });
});

// --- Theme Logic ---
function initTheme() {
    const current = settings.get();
    applyTheme(current.theme);

    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
            applyTheme(newTheme);
            settings.updateTheme(newTheme);
        });
    }
}

function applyTheme(theme) {
    const html = document.documentElement;
    const icon = document.querySelector('#theme-toggle-btn i');
    if (theme === 'dark') {
        html.classList.add('dark');
        if (icon) icon.className = 'fa-solid fa-sun';
    } else {
        html.classList.remove('dark');
        if (icon) icon.className = 'fa-solid fa-moon';
    }
}

// --- News Logic ---
let currentCategory = 'top';

async function initNews(categories) {
    // Setup Tabs
    const tabContainer = document.querySelector('.overflow-x-auto');
    // Hide tabs not in user settings? For now, show all but highlight active

    const tabs = document.querySelectorAll('.news-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Remove active class
            tabs.forEach(t => t.classList.remove('active', 'text-blue-600', 'border-b-2', 'border-blue-600'));
            tabs.forEach(t => t.classList.add('text-gray-500'));

            // Add active class
            e.target.classList.add('active', 'text-blue-600', 'border-b-2', 'border-blue-600');
            e.target.classList.remove('text-gray-500');

            currentCategory = e.target.dataset.category;
            loadNews(currentCategory);
        });
    });

    // Load initial news
    loadNews('top');

    // Search
    const handleSearch = async (query) => {
        if (!query) return loadNews(currentCategory);
        renderNewsLoading();
        try {
            const data = await api.getNews(null, query);
            renderNews(data);
        } catch (e) {
            renderError('news-container', 'Search failed');
        }
    };

    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch(e.target.value);
    });
    document.getElementById('search-input-mobile').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch(e.target.value);
    });
}

async function loadNews(category) {
    renderNewsLoading();
    try {
        const data = await api.getNews(category);
        renderNews(data);
    } catch (e) {
        console.error(e);
        renderError('news-container', 'Failed to load news');
    }
}

function renderNewsLoading() {
    const container = document.getElementById('news-container');
    container.innerHTML = `
        <div class="animate-pulse space-y-4">
            ${[1,2,3].map(() => `
            <div class="flex space-x-4">
                <div class="bg-gray-200 dark:bg-gray-700 h-24 w-32 rounded-lg flex-shrink-0"></div>
                <div class="flex-1 space-y-2 py-1">
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
            </div>`).join('')}
        </div>
    `;
}

function renderNews(newsItems) {
    const container = document.getElementById('news-container');
    container.innerHTML = '';

    if (!newsItems || newsItems.length === 0) {
        container.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-8">No news found.</p>';
        return;
    }

    const list = document.createElement('div');
    list.className = 'space-y-4 fade-in';

    newsItems.forEach(item => {
        const date = new Date(item.published || Date.now()).toLocaleDateString('ja-JP');
        const el = document.createElement('a');
        el.href = item.link;
        el.target = '_blank';
        el.className = 'flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group';

        const imgHtml = item.image
            ? `<img src="${item.image}" alt="" class="h-32 w-full md:w-32 md:h-24 object-cover rounded-lg flex-shrink-0 bg-gray-200 dark:bg-gray-600">`
            : `<div class="h-32 w-full md:w-32 md:h-24 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 flex-shrink-0"><i class="fa-regular fa-image"></i></div>`;

        el.innerHTML = `
            ${imgHtml}
            <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2 mb-1">
                    <span class="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-gray-700 dark:text-blue-400 px-2 py-0.5 rounded">${item.source}</span>
                    <span class="text-xs text-gray-400 dark:text-gray-500">${date}</span>
                </div>
                <h3 class="font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 transition-colors line-clamp-2">${item.title}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">${item.summary.replace(/<[^>]*>/g, '')}</p>
            </div>
        `;
        list.appendChild(el);
    });

    container.appendChild(list);
}

function renderError(elementId, message) {
    document.getElementById(elementId).innerHTML = `
        <div class="text-center py-8 text-red-500">
            <i class="fa-solid fa-circle-exclamation mb-2"></i>
            <p>${message}</p>
        </div>
    `;
}

// --- Steam Logic ---
async function initSteam() {
    try {
        const [sales, newReleases, popular] = await Promise.all([
            api.getSteamSales(),
            api.getSteamNew(),
            api.getSteamPopular()
        ]);

        initSteamCarousel(sales);
        renderSteamLists(newReleases, popular);
    } catch (e) {
        console.error("Steam load error", e);
    }
}

// --- Settings Logic ---
function initSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const btn = document.getElementById('settings-btn');
    const closeBtn = document.getElementById('close-settings-btn');
    const saveBtn = document.getElementById('save-settings-btn');
    const prefSelect = document.getElementById('settings-prefecture');
    const latInput = document.getElementById('settings-lat');
    const lonInput = document.getElementById('settings-lon');

    // Populate Prefectures
    prefectures.forEach(pref => {
        const option = document.createElement('option');
        option.value = pref.name;
        option.textContent = pref.name;
        option.dataset.lat = pref.lat;
        option.dataset.lon = pref.lon;
        prefSelect.appendChild(option);
    });

    prefSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        if (selectedOption.value && selectedOption.value !== 'custom') {
            latInput.value = selectedOption.dataset.lat;
            lonInput.value = selectedOption.dataset.lon;
        } else if (selectedOption.value === 'custom') {
            latInput.value = '';
            lonInput.value = '';
        }
    });

    btn.addEventListener('click', () => {
        const current = settings.get();
        latInput.value = current.location.lat;
        lonInput.value = current.location.lon;

        // Try to match prefecture
        const matched = prefectures.find(p =>
            Math.abs(p.lat - current.location.lat) < 0.001 &&
            Math.abs(p.lon - current.location.lon) < 0.001
        );

        if (matched) {
            prefSelect.value = matched.name;
        } else {
            prefSelect.value = 'custom';
        }

        modal.classList.remove('hidden');
    });

    const close = () => modal.classList.add('hidden');
    closeBtn.addEventListener('click', close);

    saveBtn.addEventListener('click', () => {
        const lat = parseFloat(latInput.value);
        const lon = parseFloat(lonInput.value);
        const selectedPref = prefSelect.value;
        const name = (selectedPref && selectedPref !== 'custom') ? selectedPref : "Custom";

        if (lat && lon) {
            settings.updateLocation(name, lat, lon);
            initWeather({name, lat, lon}); // Reload weather
        }
        close();
    });
}
