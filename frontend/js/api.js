// api.js
// Handles API requests, with fallback to mock data for development

const API_BASE_URL = 'https://api.example.com'; // Replace with real API Gateway URL after deployment
const USE_MOCK = true; // Set to false when backend is ready

// Mock Data
const MOCK_DATA = {
    news: [
        {
            title: "AWS、日本でクラウド人材育成を強化 2024年までに10万人",
            link: "#",
            published: "2024-05-15 10:00:00",
            source: "ITmedia NEWS",
            summary: "AWSジャパンは、日本国内でのクラウド人材育成プログラムを拡大すると発表した...",
            image: "https://via.placeholder.com/300x200?text=News+Image"
        },
        {
            title: "次世代iPhone、AI機能を大幅強化か リーク情報まとめ",
            link: "#",
            published: "2024-05-15 09:30:00",
            source: "GIGAZINE",
            summary: "次期iPhoneに搭載されるiOS 18では、生成AIを活用した機能が多数搭載されると噂されている...",
            image: "https://via.placeholder.com/300x200?text=Gadget"
        },
        {
            title: "Steam『サマーセール』開催日程が決定 最大90%オフ",
            link: "#",
            published: "2024-05-14 18:00:00",
            source: "AUTOMATON",
            summary: "Valveは今年のSteamサマーセールの開催日程を発表した...",
            image: "https://via.placeholder.com/300x200?text=Game"
        }
    ],
    weather: {
        current: {
            temperature: 22.5,
            weathercode: 1, // Clear/Mainly Clear
        },
        daily: [
            { date: "2024-05-15", max_temp: 24.0, min_temp: 15.0, weather_code: 1, precip_prob: 0 },
            { date: "2024-05-16", max_temp: 22.0, min_temp: 16.0, weather_code: 3, precip_prob: 40 }, // Overcast
            { date: "2024-05-17", max_temp: 25.0, min_temp: 17.0, weather_code: 0, precip_prob: 0 }, // Clear
            { date: "2024-05-18", max_temp: 26.0, min_temp: 18.0, weather_code: 61, precip_prob: 60 }, // Rain
            { date: "2024-05-19", max_temp: 23.0, min_temp: 16.0, weather_code: 1, precip_prob: 10 },
        ]
    },
    steam: {
        sales: [
            { id: 1, name: "Cyberpunk 2077", discount: 50, price: 4300, original_price: 8600, image: "https://via.placeholder.com/460x215?text=Cyberpunk" },
            { id: 2, name: "Hades", discount: 40, price: 1500, original_price: 2500, image: "https://via.placeholder.com/460x215?text=Hades" },
            { id: 3, name: "Civilization VI", discount: 90, price: 700, original_price: 7000, image: "https://via.placeholder.com/460x215?text=Civ6" },
        ],
        new_releases: [
            { id: 4, name: "New Indie Hit", price: 2000, discount: 0, image: "https://via.placeholder.com/200x100?text=New+Game" },
            { id: 5, name: "RPG Sequel", price: 7800, discount: 10, image: "https://via.placeholder.com/200x100?text=RPG" },
        ],
        top_sellers: [
            { id: 6, name: "Apex Legends", price: 0, discount: 0, image: "https://via.placeholder.com/200x100?text=Apex" },
            { id: 7, name: "Elden Ring", price: 9240, discount: 0, image: "https://via.placeholder.com/200x100?text=EldenRing" },
        ]
    },
    english: {
        word: {
            word: "delegate",
            phonetic: "/ˈdɛlɪɡeɪt/",
            meaning_ja: "委任する、権限を与える",
            definition: "To entrust a task or responsibility to another person.",
            example: "She delegates simple tasks to her assistant.",
            audio: null
        },
        quiz: {
            question: "What is the meaning of 'negotiate'?",
            correct_word: "negotiate",
            options: [
                { label: "無視する", word: "ignore", is_correct: false },
                { label: "交渉する", word: "negotiate", is_correct: true },
                { label: "記録する", word: "record", is_correct: false },
                { label: "延期する", word: "postpone", is_correct: false }
            ]
        }
    }
};

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 8000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
}

export const api = {
    async getNews(category = 'top', keyword = null) {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 500)); // Simulate delay
            // Filter mock data based on category if we had more mock data
            return MOCK_DATA.news;
        }

        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (keyword) params.append('q', keyword);

        const endpoint = keyword ? '/news/search' : '/news';
        const res = await fetchWithTimeout(`${API_BASE_URL}${endpoint}?${params.toString()}`);
        return res.json();
    },

    async getWeather(lat, lon) {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 600));
            return MOCK_DATA.weather;
        }
        const res = await fetchWithTimeout(`${API_BASE_URL}/weather?lat=${lat}&lon=${lon}`);
        return res.json();
    },

    async getSteamSales() {
        if (USE_MOCK) return MOCK_DATA.steam.sales;
        const res = await fetchWithTimeout(`${API_BASE_URL}/steam/sales`);
        return res.json();
    },

    async getSteamNew() {
        if (USE_MOCK) return MOCK_DATA.steam.new_releases;
        const res = await fetchWithTimeout(`${API_BASE_URL}/steam/new`);
        return res.json();
    },

    async getSteamPopular() {
        if (USE_MOCK) return MOCK_DATA.steam.top_sellers;
        const res = await fetchWithTimeout(`${API_BASE_URL}/steam/popular`);
        return res.json();
    },

    async getEnglishWord() {
        if (USE_MOCK) return MOCK_DATA.english.word;
        const res = await fetchWithTimeout(`${API_BASE_URL}/english/word`);
        return res.json();
    },

    async getEnglishQuiz() {
        if (USE_MOCK) return MOCK_DATA.english.quiz;
        const res = await fetchWithTimeout(`${API_BASE_URL}/english/quiz`);
        return res.json();
    }
};
