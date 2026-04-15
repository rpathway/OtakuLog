import { HOME_CATEGORIES, HOME_CATEGORIES_FALLBACK, fetchWithCache, normalizeJikanData } from './jikan.mjs';
import { BASE_URL, initCarousel } from './utils.mjs';
import { openSeriesModal } from './modal.mjs';
import { createCarouselCard, createSection } from './templates.mjs';



export async function loadHomePage() {
  const main = document.querySelector('main');
  main.innerHTML = '';

  // Sets an observer to fetch new category upon scroll outside of oberved container
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(async entry => {
      if (!entry.isIntersecting) return;

      const section = entry.target;
      const title = entry.target.dataset.title;
      const url = section.dataset.url;
      const carousel = section.querySelector('.carousel-container');
      const displayErrorCard = (err) => {
        const types = {
          429: `<p>You are being rate limited by Jikan or&nbsp;</p><p>MyAnimeList is rate-limiting their servers.&nbsp;</p><p>Try again in 30 seconds.</p>`,
          500: `<p>HTTP 500 Something didn't work.&nbsp;</p><p>Try again later.</p>`,
          503: `<p>The resource is down for maintenance.&nbsp;</p><p>Try again later.</p>`
        }

        return `
          <div class="error-wrapper">
            <i class="bi bi-exclamation-triangle text-yellow-400"></i>
            <div class="md:flex md:justify-center">
              ${types[err?.status] ?? err}
            </div>
          </div>
        `;
      }

      observer.unobserve(section);
      // 429 Rate limit 'bypass'
      await new Promise(resolve => setTimeout(resolve, 400));

      fetchWithCache(url, `${BASE_URL}${HOME_CATEGORIES_FALLBACK[title]}`).then(items => {
        // If there's an error passed back from Jikan, display it
        if (items?.status) {
          carousel.innerHTML = displayErrorCard(items);
          console.log(carousel.outerHTML)

          return;
        }

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
        carousel.innerHTML = displayErrorCard(error);
        carousel.parentNode.querySelector('.fade-left').remove();
        carousel.parentNode.querySelector('.fade-right').remove();

        console.error(`Error in loadHomePage: ${error}`);
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