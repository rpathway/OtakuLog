import { fetchResource } from './utils.mjs';
import { carouselCard } from './templates.mjs';

const JIKAN_URL = import.meta.env.JIKAN_BASE_URL
const ANILIST_URL = import.meta.env.ANILIST_BASE_URL

// Valid parameters for the Preselected endpoint
const ENDPOINT_PARAMS = {
  top: {
    anime: {
      type: {type: 'string'},
      filter: {type: 'string'},
      rating: {type: 'string'},
      sfw: {type: 'boolean'},
      page: {type: 'number'},
      limit: {type: 'number'}
    }
  }
}


/**
 *  Cleans and parses the data that had been fetched to a consistant
 *    state to be used amongst the site.
 * 
 * @param {String} dataSource   The resource the data had been fetched from
 * @param {String} data         The resource data to be normalized
 */
function normalizeData(dataSource='', data='') {
  const CLEANED_KEYS = {
    id: 0,
    name: '',
    url: '',
    image: '',
  };
}


/**
 *  Creates the carousel item cards for the home, and search page.
 * 
 * 
 * @param {*} data 
 */
function createCarouselCard(data) {
  const normalizeInt = new Intl.NumberFormat('en', { notation: 'compact', compactDisplay: 'short'});
  const airingStatus = {
    "Finished Airing": 'Finished',
    "Currently Airing": 'Ongoing',
    "Not yet aired": 'Upcoming'
  }
  return `
    <div class="carousel-card" title="${data.title}">
      <a href="/details/?malid=${data.id}">
        <h2 class="carousel-title">${data.title}</h2>
        <img class="w-[150px] h-auto rounded-sm" src="${data.image.base}" alt="Cover art for tv series: ${data.title}">
      </a>
      <div class="grid grid-cols-2 text-sm text-white max-w-[240px] my-1">
        <span class="col-start-1" title="Series ranking"><i class="bi bi-fire text-orange-500"></i> #${data.rank}</span>
        <span class="col-start-2 text-right" title="Series favorited by">${normalizeInt.format(data.favorites)} ❤️</span>
        <span class="col-start-1" title="Series score out of 10"><i class="bi bi-star-fill text-amber-500"></i> ${data.score}</span>
        <span class="col-start-2 text-right" title="Series status">${airingStatus[data.status]} <i class="bi bi-broadcast text-lime-500"></i></span>
      </div>
    </div>
  `
}


/**
 *  Retrieves the resource from `api.jikan.moe` and returns the requested data.
 * 
 * @calledBy main.js
 */
export async function getJikanAPIData() {
  // Getting top movies, ova's and tv shows for the front page.
  const featuredContent = [
    `${JIKAN_URL}/top/anime?type=movie`
    `${JIKAN_URL}/top/anime?type=ova`,
    `${JIKAN_URL}/top/anime?type=tv`,
  ]

  try {
    const response = fetchResource(JIKAN_URL).then(r => r.json());

    if (response) {
      return response;
    }

  } catch (e) {
    console.error(`Error in jikanAPI: ${e}`);
  }
}