import { fetchSeriesDetails, normalizeSeriesDetails } from './anilist.mjs';
import { getLists, addToList, removeFromList, getSeriesLists, getSeriesProgress, setProgress, createList, DEFAULT_LISTS } from './lists.mjs';
import { initCarousel, initListHints } from './utils.mjs';
import { deleteList } from './lists.mjs';

const normalizeInt = new Intl.NumberFormat('en', { notation: 'compact', compactDisplay: 'short' });
const statusMap = {
  FINISHED: 'Finished',
  RELEASING: 'Ongoing',
  NOT_YET_RELEASED: 'Upcoming',
  CANCELLED: 'Cancelled',
  HIATUS: 'On Hiatus',
};


// Initializes modal listeners for series detailed view
function initModalListeners() {
  const modal = document.getElementById('series-modal');
  const backdrop = modal.querySelector('.series-modal-backdrop');
  const closeBtn = document.getElementById('modal-close');

  function closeModal() {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  backdrop.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  })

  // Episode progress count
  document.getElementById('modal-ep-dec').addEventListener('click', () => adjustEpisodeCount(-1));
  document.getElementById('modal-ep-inc').addEventListener('click', () => adjustEpisodeCount(1));

  // Expands description when clicked
  document.getElementById('modal-description').addEventListener('click', (e) => {
    e.target.classList.toggle('line-clamp-4');
  })

  // New list creation
  document.getElementById('modal-add-list').addEventListener('click', () => {
    const input = document.getElementById('modal-new-list')
    const name = input.value.trim();
    if (!name) return;

    if (createList(name)) {
      input.value = '';
      renderLists(parseInt(modal.dataset.malId));
    }
  });
}

// Builds the detailed view for the series
function buildModal() {
  const existing = document.getElementById('series-modal');
  if (existing) return;

  const modal = document.createElement('div');
  modal.id = 'series-modal';
  modal.className = 'series-modal hidden';
  modal.ariaLabel = `Open detailed view for the selected series`;
  modal.tabIndex  = 0;
  modal.innerHTML = `
    <div class="series-modal-backdrop"></div>
    <div class="series-modal-container">
      <!-- Loading -->
      <div id="modal-loading" class="flex items-center justify-center h-64">
        <i class="bi bi-arrow-repeat animate-spin text-4xl text-secondary"></i>
      </div>
      <!-- Content -->
      <div id="modal-content" class="hidden">
        <!-- Banner -->
        <div class="relative">
          <div id="modal-banner" class="series-modal-banner"></div>
          <button id="modal-close" class="bi bi-x-lg absolute top-3 right-3 text-white bg-black/50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 cursor-pointer border-none z-10"></button>
          <img id="modal-cover" class="series-modal-cover" src="" alt="">
        </div>
        <!-- Details -->
        <div class="p-4 space-y-4">
          <!-- Title -->
          <div>
            <h2 id="modal-title" class="text-xl ml-25 sm:ml-30 font-bold text-white font-syne overflow-hidden text-ellipsis"></h2>
            <p id="modal-native-title" class="text-sm ml-25 sm:ml-30 mb-5 text-gray-400"></p>
            <div id="modal-genres" class="flex flex-wrap gap-1 mt-2"></div>
          </div>
          <!-- Stats -->
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div class="series-modal-stats">
              <i class="bi bi-star-fill text-amber-500"></i>
              <span id="modal-score"></span>
              <p>Score</p>
            </div>
            <div class="series-modal-stats">
              <i class="bi bi-fire text-orange-500"></i>
              <span id="modal-popularity"></span>
              <p>Popularity</p>
            </div>
            <div class="series-modal-stats">
              <i class="bi bi-heart-fill text-accent1"></i>
              <span id="modal-favourites"></span>
              <p>Favourites</p>
            </div>
            <div class="series-modal-stats">
              <i class="bi bi-tv text-secondary"></i>
              <span id="modal-episodes"></span>
              <p>Episodes</p>
            </div>
          </div>
          <!-- Studio & Status -->
          <div class="flex gap-4 text-sm text-gray-400">
            <span><i class="bi bi-building"></i> <span id="modal-studio"></span></span>
            <span><i class="bi bi-broadcast"></i> <span id="modal-status"></span></span>
          </div>
          <!-- Description -->
          <div>
            <h3 class="series-modal-title">Synopsis</h3>
            <p id="modal-description" class="text-sm text-gray-300 leading-relaxed line-clamp-4 cursor-pointer" title="Click to expand"></p>
          </div>
          <!-- Episode progress -->
          <div>
            <h3 class="series-modal-title">Episodes Watched</h3>
            <div class="flex items-center gap-3">
              <button id="modal-ep-dec" class="series-modal-ep-btn"><i class="bi bi-dash"></i></button>
              <span id="modal-ep-count" class="text-white font-bold text-lg min-w-[3ch] text-center">0</span>
              <span class="text-gray-400 text-sm">/ <span id="modal-ep-total"></span></span>
              <button id="modal-ep-inc" class="series-modal-ep-btn"><i class="bi bi-plus"></i></button>
            </div>
          </div>
          <!-- List management -->
          <div>
            <h3 class="series-modal-title">My Lists</h3>            
            <div class="series-modal-lists-wrapper">
              <div id="modal-lists" class="series-modal-lists-container">
              </div>
              <div class="fade-top hidden"></div>
              <div class="fade-bottom"></div>
            </div>
            <div class="flex gap-2 mt-2">
              <input id="modal-new-list" type="text" placeholder="New list name..." class="series-modal-input flex-1">
              <button id="modal-add-list" class="series-modal-add-list-btn"><i class="bi bi-plus"></i> Add</button>
            </div>
          </div>
          <!-- Characters -->
          <h3 class="series-modal-title">Characters</h3>
          <div class="carousel-wrapper">
            <div class="carousel-container">

              <div>
                <div id="modal-characters" class="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]"></div>
              </div>

            </div>
            <!-- Carousel buttons -->
            <div class="fade-left hidden">
              <button class="bi bi-chevron-compact-left"></button>
            </div>
            <div class="fade-right">
              <button class="bi bi-chevron-compact-right"></button>
            </div>
          </div>

          <!-- Recommendations -->
          <div class="carousel-wrapper">
            <h3 class="series-modal-title">Recommended</h3>
            <div class="carousel-container">

              <div>
                <div id="modal-recommendations" class="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]"></div>
              </div>

            </div>
            <!-- Carousel buttons -->
            <div class="fade-left hidden">
              <button class="bi bi-chevron-compact-left"></button>
            </div>
            <div class="fade-right">
              <button class="bi bi-chevron-compact-right"></button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  initModalListeners();
}

/**
 *  Increment/Decrement the episodes watched count
 * 
 * @param {Number} num  1 or -1
 */
function adjustEpisodeCount(num) {
  const modal = document.getElementById('series-modal');
  const malId = parseInt(modal.dataset.malId);
  const totalEp = parseInt(modal.dataset.totalEpisodes) || Infinity;
  const current = getSeriesProgress(malId);
  const next = Math.max(0, Math.min(current + num, totalEp));

  setProgress(malId, next);

  document.getElementById('modal-ep-count').textContent = next;
}

/**
 *  Creates the default and user created lists
 * 
 * @param {Number} malId  The MyAnimeList id for the series
 */
function renderLists(malId) {
  const container = document.getElementById('modal-lists');
  const lists = getLists();
  const seriesLists = getSeriesLists(malId);

  container.innerHTML = Object.keys(lists).map(name => {
    const inList = seriesLists.includes(name);
    const isDefault = DEFAULT_LISTS.includes(name);

    return `
      <div class="flex items-center justify-between text-sm">
        <label class="text-lg flex items-center gap-2 text-white cursor-pointer">
          <i class="bi ${inList ? 'bi-check-circle-fill' : 'bi-check-circle'}"></i>
          <input type="checkbox" class="modal-list-checkbox hidden accent-secondary" data-list="${name}" ${inList ? 'checked' : ''}>
          ${name}
        </label>
        ${!isDefault ? `<button class="modal-delete-list text-gray-500 hover:text-accent1 cursor-pointer border-none bg-transparent" data-list="${name}"><i class="bi bi-trash"></i></button>` : ''}
      </div>
    `;
  }).join('');


  // Fade hints
  initListHints(container.parentNode);

  // Checkbox listeners
  container.querySelectorAll('.modal-list-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const listName = cb.dataset.list;
      cb.previousElementSibling.classList.remove('bi-check-circle-fill', 'bi-check-circle');
      cb.previousElementSibling.classList.add(cb.checked ? 'bi-check-circle-fill' : 'bi-check-circle');

      if (cb.checked) addToList(listName, malId);
      else removeFromList(listName, malId);
    });
  });

  // Delete list listeners
  container.querySelectorAll('.modal-delete-list').forEach(btn => {
    btn.addEventListener('click', () => {
      const listName = btn.dataset.list;

      // popen browser alert - maybe custom one made later?
      if (confirm(`Delete list "${listName}"?`)) {
        deleteList(listName);
        renderLists(malId);
      }
    });
  });
}


/**
 *  Opens the detailed view for the series in a modal
 * 
 * 
 * @param {Number} malId  The MyAnimeList id
 * @returns               Error element if not found
 */
export async function openSeriesModal(malId) {
  buildModal();

  const modal = document.getElementById('series-modal');
  const loading = document.getElementById('modal-loading');
  const content = document.getElementById('modal-content');

  modal.dataset.malId = malId;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.classList.add('overflow-hidden');

  loading.classList.remove('hidden');
  content.classList.add('hidden');

  const seriesData = await fetchSeriesDetails(malId);
  if (!seriesData) {
    loading.innerHTML = `<p class="text-gray-400">Failed to load series details.</p>`;
    return;
  }

  const data = normalizeSeriesDetails(seriesData);
  modal.dataset.totalEpisodes = data.episodes;

  // Banner
  const banner = document.getElementById('modal-banner');
  banner.style.backgroundImage = data.banner ? `url(${data.banner})` : 'none';
  if (!data.banner) banner.classList.add('bg-accent3');

  // Cover
  const cover = document.getElementById('modal-cover');
  cover.src = data.cover;
  cover.alt = `Cover art for ${data.title}`;

  // Text
  document.getElementById('modal-title').textContent = data.title;
  document.getElementById('modal-native-title').textContent = data.titleNative ?? '';
  document.getElementById('modal-score').textContent = data.score;
  document.getElementById('modal-popularity').textContent = normalizeInt.format(data.popularity);
  document.getElementById('modal-favourites').textContent = normalizeInt.format(data.favourites);
  document.getElementById('modal-episodes').textContent = data.episodes;
  document.getElementById('modal-studio').textContent = data.studio;
  document.getElementById('modal-status').textContent = statusMap[data.status] ?? data.status;
  document.getElementById('modal-description').textContent = data.description;
  document.getElementById('modal-ep-total').textContent = data.episodes;
  document.getElementById('modal-ep-count').textContent = getSeriesProgress(malId);

  // Genres
  document.getElementById('modal-genres').innerHTML = data.genres.map(g => `<span class="series-modal-genre">${g}</span>`).join('');

  // Lists
  renderLists(malId);

  // Character icons
  document.getElementById('modal-characters').innerHTML = data.characters.map(c => `
    <div class="flex flex-col items-center gap-1 shrink-0">
      <img src="${c.image}" alt="${c.name}" class="w-12 h-12 rounded-full object-cover border border-accent1/30">
      <span class="text-xs text-gray-400 text-center w-14 truncate">${c.name}</span>
    </div>
  `).join('');

  // Recommendations
  document.getElementById('modal-recommendations').innerHTML = data.recommendations.map(r => `
    <div class="shrink-0 cursor-pointer" data-malid="${r.id}">
      <img src="${r.cover}" alt="${r.title}" class="w-[80px] h-[110px] object-cover rounded-lg">
      <p class="text-xs text-gray-400 w-[80px] truncate mt-1">${r.title}</p>
    </div>
  `).join('');

  // Click recommended series to open its modal
  document.getElementById('modal-recommendations').querySelectorAll('[data-malid]').forEach(seriesCard => {
    seriesCard.addEventListener('click', () => openSeriesModal(parseInt(seriesCard.dataset.malid)));
  });

  // Add listeners to Character & Recommendations carousel
  document.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
    initCarousel(wrapper);
  });

  loading.classList.add('hidden');
  content.classList.remove('hidden');
}