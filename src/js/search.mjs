import { fetchWithCache, normalizeJikanData } from './jikan.mjs';
import { openSeriesModal } from './modal.mjs';
import { getSettings } from './utils.mjs';

const JIKAN_URL = import.meta.env.VITE_JIKAN_BASE_URL;
const SEARCH_URL = `${JIKAN_URL}/anime`;
const GENRES = [
  'Action', 'Adventure', 'Comedy',  'Drama',  'Fantasy',
  'Horror', 'Mystery',   'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Supernatural', 'Thriller'
];
const TYPES = ['tv', 'movie', 'ova', 'special', 'music'];
const STATUS = ['airing', 'complete', 'upcoming'];
let searchTimeout = null;


// Initializes search modal listeners
function initSearchListeners() {
  const overlay = document.getElementById('search-overlay');
  const backdrop = overlay.querySelector('.search-backdrop');
  const closeBtn = document.getElementById('search-close');
  const input = document.getElementById('search-input');
  const typeSelect = document.getElementById('search-type');
  const statusSelect = document.getElementById('search-status');
  const genreSelect = document.getElementById('search-genre');
  const sortSelect = document.getElementById('search-sort');

  function closeSearch() {
    overlay.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    input.value = '';
    document.getElementById('search-results').innerHTML = '<p class="text-gray-500 text-center text-sm mt-8">Start typing to search...</p>';
  }

  backdrop.addEventListener('click', closeSearch);
  closeBtn.addEventListener('click', closeSearch);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearch() });

  // Debounced search on input
  input.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(runSearch, 400);
  });

  // Re-run search when filters change
  [typeSelect, statusSelect, genreSelect, sortSelect].forEach(el => {
    el.addEventListener('change', runSearch);
  });
}

// Builds overlay for search modal
function buildSearchOverlay() {
  const exists = document.getElementById('search-overlay');
  if (exists) return;

  const overlay = document.createElement('div');
  overlay.id = 'search-overlay';
  overlay.className = 'search-overlay hidden';
  overlay.innerHTML = `
    <div class="search-backdrop"></div>
    <div class="search-container">
      <!-- Search bar -->
      <div class="search-bar-row">
        <i class="bi bi-search text-gray-400"></i>
        <input id="search-input" type="text" placeholder="Search anime..." class="search-input"autocomplete="off">
        <button id="search-close" class="search-close-btn">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <!-- Filters -->
      <div class="search-filters">
        <select id="search-type" class="search-select">
          <option value="">All Types</option>
          ${TYPES.map(t => `<option value="${t}">${t.toUpperCase()}</option>`).join('')}
        </select>
        <select id="search-status" class="search-select">
          <option value="">All Status</option>
          ${STATUS.map(s => `<option value="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
        </select>
        <select id="search-genre" class="search-select">
          <option value="">All Genres</option>
          ${GENRES.map(g => `<option value="${g}">${g}</option>`).join('')}
        </select>
        <select id="search-sort" class="search-select">
          <option value="">Sort: Relevance</option>
          <option value="score">Sort: Score</option>
          <option value="popularity">Sort: Popularity</option>
          <option value="rank">Sort: Rank</option>
        </select>
      </div>
      <!-- Results -->
      <div id="search-results" class="search-results">
        <p class="text-gray-500 text-center text-sm mt-8">Start typing to search...</p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  initSearchListeners();
}

// Executes search queries as the user types
async function runSearch() {
  const sfw = getSettings('settings').sfw.value;
  const query = document.getElementById('search-input').value.trim();
  const type = document.getElementById('search-type').value;
  const status = document.getElementById('search-status').value;
  const genre = document.getElementById('search-genre').value;
  const sort = document.getElementById('search-sort').value;
  const results = document.getElementById('search-results');

  if (!query && !type && !status && !genre) {
    results.innerHTML = '<p class="text-gray-500 text-center text-sm mt-8">Start typing to search...</p>';
    return;
  }

  results.innerHTML = `
    <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
      ${Array(10).fill('<div class="animate-pulse bg-accent3 rounded-lg h-[160px]"></div>').join('')}
    </div>
  `;

  try {
    const params = new URLSearchParams();
    if (query)  params.set('q', query);
    if (type)   params.set('type', type);
    if (status) params.set('status', status);
    if (genre)  params.set('genres', genre);
    if (sort)   params.set('order_by', sort);
    params.set('sfw', sfw);
    params.set('limit', '20');

    const url = `${SEARCH_URL}?${params.toString()}`;
    // Fetch data from endpoint
    const data = await fetchWithCache(url);

    if (!data || !data.length) {
      results.innerHTML = '<p class="text-gray-500 text-center text-sm mt-8">No results found.</p>';
      return;
    }

    results.innerHTML = `
      <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
        ${data.map(item => {
          const normalized = normalizeJikanData(item);

          return `
            <div class="search-result-card" data-malid="${normalized.id}">
              <img src="${normalized.image}" alt="${normalized.title}" class="w-full h-[140px] sm:h-[180px] object-cover rounded-lg">
              <p class="text-xs text-gray-300 truncate mt-1">${normalized.title}</p>
              <p class="text-xs text-gray-500">${normalized.score !== 'N/A' ? `<i class="bi bi-star-fill text-amber-500"></i>${normalized.score}` : ''}</p>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Builds result cards
    results.querySelectorAll('.search-result-card').forEach(card => {
      card.addEventListener('click', () => {
        openSeriesModal(parseInt(card.dataset.malid));
      });
    });

  } catch (e) {
    results.innerHTML = `<p class="text-red-400 text-center text-sm mt-8">Search failed. Try again shortly.</p>`;
    console.error('Search error:', e);
  }
}


// Creates search container, sets listeners and debounce.
export function openSearch() {
  buildSearchOverlay();

  const overlay = document.getElementById('search-overlay');
  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
  document.body.classList.add('overflow-hidden');

  setTimeout(() => document.getElementById('search-input')?.focus(), 50);
}