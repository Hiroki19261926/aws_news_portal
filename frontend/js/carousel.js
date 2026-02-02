// carousel.js
// Handles Steam Sales Carousel and Lists

export function initSteamCarousel(games) {
    const container = document.getElementById('steam-sales-container');
    container.innerHTML = '';

    if (!games || games.length === 0) return;

    games.forEach(game => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';

        const priceDisplay = game.price === 0 ? "Free" : `¥${game.price.toLocaleString()}`;
        const discountDisplay = game.discount > 0 ? `-${game.discount}%` : '';
        const originalPrice = game.original_price > 0 ? `¥${game.original_price.toLocaleString()}` : '';

        slide.innerHTML = `
            <a href="${game.link}" target="_blank" class="block w-full h-full relative group">
                <img src="${game.image}" alt="${game.name}" class="w-full h-full object-cover rounded-lg">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 rounded-lg"></div>
                <div class="absolute bottom-0 left-0 p-4 w-full">
                    <h4 class="text-lg font-bold text-white truncate shadow-black drop-shadow-md">${game.name}</h4>
                    <div class="flex items-center space-x-2 mt-1">
                        ${discountDisplay ? `<span class="bg-green-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">${discountDisplay}</span>` : ''}
                        <span class="text-gray-300 line-through text-xs">${originalPrice}</span>
                        <span class="text-yellow-400 font-bold">${priceDisplay}</span>
                    </div>
                </div>
            </a>
        `;
        container.appendChild(slide);
    });

    // Initialize Swiper
    // Note: Swiper must be loaded globally via CDN as per index.html
    new Swiper('.steam-sales-swiper', {
        slidesPerView: 1,
        spaceBetween: 10,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        loop: true,
    });
}

export function renderSteamLists(newGames, popularGames) {
    renderList('steam-new-container', newGames);
    renderList('steam-popular-container', popularGames);
}

function renderList(containerId, games) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (!games || games.length === 0) return;

    games.slice(0, 5).forEach(game => {
        const el = document.createElement('a');
        el.href = game.link;
        el.target = '_blank';
        el.className = 'flex items-center space-x-3 p-2 hover:bg-gray-50 rounded transition-colors group';

        const priceDisplay = game.price === 0 ? "Free" : `¥${game.price.toLocaleString()}`;

        el.innerHTML = `
            <img src="${game.image}" alt="" class="w-16 h-8 object-cover rounded shadow-sm">
            <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600">${game.name}</h4>
            </div>
            <div class="text-sm font-bold text-gray-600">${priceDisplay}</div>
        `;
        container.appendChild(el);
    });
}
