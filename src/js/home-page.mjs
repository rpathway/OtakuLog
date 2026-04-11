import { HOME_CATEGORIES, fetchWithCache, normalizeJikanData } from './jikan.mjs';
import { initCarousel } from './utils.mjs';
import { openSeriesModal } from './modal.mjs';

const airingStatus = {
  'Finished Airing': 'Finished',
  'Currently Airing': 'Ongoing',
  'Not yet aired': 'Upcoming',
};


function createCarouselCard(data) {
  const normalizeInt = new Intl.NumberFormat('en', { notation: 'compact', compactDisplay: 'short' });
  const top10 = data.rank <= 10 ? 'text-orange-500' : 'text-white';
  return `
    <div class="carousel-card" title="${data.title}" data-malid="${data.id}">
      <div>
        <img class="w-[150px] h-[200px] object-cover rounded-xl" src="${data.image}" alt="Cover art for: ${data.title}" loading="lazy">
        <h2 class="carousel-title">${data.title}</h2>
      </div>
      <div class="grid grid-cols-2 text-sm text-white max-w-[150px] my-1">
        <span class="col-start-1" title="Ranking"><i class="bi bi-fire ${top10}"></i> #${data.rank ?? '-'}</span>
        <span class="col-start-2 text-right" title="Favorites">${normalizeInt.format(data.favorites)} ❤️</span>
        <span class="col-start-1" title="Score"><i class="bi bi-star-fill text-amber-500"></i> ${data.score}</span>
        <span class="col-start-2 text-right" title="Status">${airingStatus[data.status] ?? '-'}</span>
      </div>
    </div>
  `;
}

function createSection(title, url) {
  const section = document.createElement('div');
  section.dataset.url = url;
  section.dataset.title = title;
  section.innerHTML = `
    <div class="flex flex-row justify-between" data-title="${title}" data-url="${url}">
      <h2 class="text-2xl font-inter font-bold">${title}</h2>
      <a class="text-xs place-self-end text-gray-400" href="">See More</a>
    </div>
    <hr>
    <div class="carousel-wrapper">
      <div class="carousel-container">
        ${Array(20).fill('<div class="animate-pulse bg-accent3 w-[150px] h-[200px] rounded-xl shrink-0"></div>').join('')}
      </div>
      <div class="fade-left hidden">
        <button class="bi bi-chevron-compact-left"></button>
      </div>
      <div class="fade-right">
        <button class="bi bi-chevron-compact-right"></button>
      </div>
    </div>
  `;

  return section;
}

export async function loadHomePage() {
  const main = document.querySelector('main');
  main.innerHTML = '';

  // Sets an observer to fetch new category upon scroll outside of oberved container
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(async entry => {
      if (!entry.isIntersecting) return;

      const section = entry.target;
      const url = section.dataset.url;
      const carousel = section.querySelector('.carousel-container');

      observer.unobserve(section);
      // 429 Rate limit 'bypass'
      await new Promise(resolve => setTimeout(resolve, 400));

      fetchWithCache(url).then(items => {
        carousel.innerHTML = items.map(item => createCarouselCard(normalizeJikanData(item))).join('');

        // Open modal for series detailed view on card click
        carousel.querySelectorAll('.carousel-card').forEach(card => {
          card.addEventListener('click', () => {
            const malId = card.dataset.malid;
            if (malId) openSeriesModal(parseInt(malId));
          });
        })

        initCarousel(section.querySelector('.carousel-container'));
      }).catch(error => {
        if (error?.status === 429) {
          carousel.innerHTML = `
            <div class="flex flex-col p-1 m-[1px] w-full h-[200px] bg-accent3 rounded-xl inset-ring-1 inset-ring-accent1/30 shadow-sm shadow-secondary font-syne text-center justify-center">
              <i class="bi bi-exclamation-triangle text-yellow-400"></i>
              <div class="md:flex md:justify-center">
                <p>Rate limit exceeded!&nbsp;</p>
                <p>Try again in 30 seconds.</p>
              </div>
            </div>
          `;
        }
      })
    });
  }, { rootMargin: '200px' });

  for (const [title, url] of Object.entries(HOME_CATEGORIES)) {
    const section = createSection(title, url);
    main.appendChild(section);
    // watches each section
    observer.observe(section);
  }
}


loadHomePage();