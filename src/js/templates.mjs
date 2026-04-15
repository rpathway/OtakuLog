const airingStatus = {
  'Finished Airing': 'Finished',
  'Currently Airing': 'Ongoing',
  'Not yet aired': 'Upcoming',
};

export function createCarouselCard(data) {
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

export function createSection(title, url) {
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