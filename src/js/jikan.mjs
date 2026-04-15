const JIKAN_URL = import.meta.env.VITE_JIKAN_BASE_URL
const TOP_ANIME_URL = `${JIKAN_URL}/top/anime`
export const HOME_CATEGORIES = {
  Favorites:  `${TOP_ANIME_URL}?filter=favorite&limit=20`,
  Popular:    `${TOP_ANIME_URL}?filter=bypopularity&limit=20`,
  Airing:     `${TOP_ANIME_URL}?filter=airing&limit=20`,
  Upcoming:   `${TOP_ANIME_URL}?filter=upcoming&limit=20`,
  Movies:     `${TOP_ANIME_URL}?type=movie&limit=20`,
  OVA:        `${TOP_ANIME_URL}?type=ova&limit=20`,
  TV:         `${TOP_ANIME_URL}?type=tv&limit=20`,
  Specials:   `${TOP_ANIME_URL}?type=tv_special&limit=20`,
};
export const HOME_CATEGORIES_FALLBACK = {
  Favorites:  `/json/favorite.json`,
  Popular:    `/json/bypopularity.json`,
  Airing:     `/json/airing.json`,
  Upcoming:   `/json/upcoming.json`,
  Movies:     `/json/movie.json`,
  OVA:        `/json/ova.json`,
  TV:         `/json/tv.json`,
  Specials:   `/json/tv_special.json`,
}



export function normalizeJikanData(item) {
  return {
    id:        item.mal_id,
    title:     item.title_english ?? item.title,
    image:     item.images?.jpg?.image_url,
    rank:      item.rank,
    score:     item.score ?? 'N/A',
    favorites: item.favorites,
    status:    item.status,
  };
}

/**
 *  fetches data with cache ttl of 30 minutes to
 *    reduce being rate limited.
 * 
 * 
 * @param {*} url 
 * @returns 
 */
export async function fetchWithCache(url = '', fallbackUrl = '') {
  const CACHE_TTL = 1000 * 60 * 30;
  const cacheKey = `cache:${url}`;
  const cached = JSON.parse(localStorage.getItem(cacheKey));

  // Return cached data if it's still fresh
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(url);
    // We got rate limited, return with banner.
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status
      throw error;
    }
    const json = await response.json();

    // Jikan returns errors in body response, return to handle errors
    if (json?.status) return json;

    // Save to cache with timestamp
    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: json.data
    }));

    return json.data;
  } catch (e) {
    if (fallbackUrl) {
      console.warn(`Falling back to local JSON for ${url}`);
      const fallback = await fetch(fallbackUrl);

      // if fallback also fails, throw original error
      if (!fallback.ok) throw e;
      const json = await fallback.json();

      return json.data ?? json;
    }
    throw e;
  }
}

export async function fetchCategory(url = '') {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
 
    return json.data;
  } catch (e) {
    console.error(`fetchCategory error: ${e}`);
    return [];
  }
}