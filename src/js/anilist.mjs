const ANILIST_URL = import.meta.env.VITE_ANILIST_BASE_URL;

/**
 *  GraphQL query
 * 
 *  Params:
 *    malId - Jikan MyAnimeList series id
 *    id    - Media id
 *    idMal - Anilist MyAnimeList series id
 *    title - Title of series in Romanji, English, and the Native language.
 *    description - Synopsis of the series
 *    episodes - Total episode count for series
 *    status   - Media release status: FINISHED|RELEASING|NOT_YET_RELEASED|CANCELLED|HIATUS
 *    averageScore - Average score by users
 *    popularity   - Number of users with this media on their list
 *    favourites   - Amount of favorite
 *    genres       - Genres of series
 *    tags         - List of tags that describes elements and themes of the media: (name) of descriptor
 *    coverImage   - Cover image of series
 *    bannerImage  - Banner image of series
 *    studios      - The companies who produced the media 
 *    characters   - The characters in the media: Sort by role, 10 characters with name and image.
 *    recommendations - User recommendations for similar media: idMal (see idMal above), title (english, romanji), image
 *    
 * 
 */
const SERIES_QUERY = `
query ($malId: Int) {
  Media(idMal: $malId, type: ANIME) {
    id
    idMal
    title { romaji english native }
    description(asHtml: false)
    episodes
    status
    averageScore
    popularity
    favourites
    genres
    tags { name }
    coverImage { extraLarge large }
    bannerImage
    studios(isMain: true) { nodes { name } }
    characters(sort: ROLE, perPage: 10) {
      nodes {
        name { full }
        image { medium }
      }
    }
    recommendations(perPage: 8) {
      nodes {
        mediaRecommendation {
          idMal
          title { english romaji }
          coverImage { medium }
        }
      }
    }
  }
}`;


/**
 *  Retrieves the series details based off of the MyAnimeList id
 * 
 * 
 * @param {Number} malId  The MyAnimeList id
 * @returns {Object|Null}      The fetched data as a JSON Object or null
 */
export async function fetchSeriesDetails(malId) {
  try {
    const response = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: SERIES_QUERY, variables: { malId: parseInt(malId) } })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();

    return json.data.Media;
  } catch (e) {
    console.error(`fetchSeriesDetails error: ${e}`);
    return null;
  }
}

/**
 *  Normalizes Anilist data
 * 
 * 
 * @param {Object} media  The returned data from fetchSeriesDetails
 * @returns {Object}      JSON Object
 */
export function normalizeSeriesDetails(media) {
  return {
    id: media.idMal,
    anilistId: media.id,
    title: media.title.english ?? media.title.romaji,
    titleNative: media.title.native,
    description: media.description?.replace(/<[^>]*>/g, '') ?? 'No description available.',
    episodes: media.episodes ?? '?',
    status: media.status,
    score: media.averageScore ? (media.averageScore / 10).toFixed(1) : 'N/A',
    popularity: media.popularity,
    favourites: media.favourites,
    genres: media.genres ?? [],
    studio: media.studios.nodes[0]?.name ?? 'Unknown',
    cover: media.coverImage.extraLarge ?? media.coverImage.large,
    banner: media.bannerImage,
    characters: media.characters.nodes.map(c => ({
      name: c.name.full,
      image: c.image.medium
    })),
    recommendations: media.recommendations.nodes
      .filter(n => n.mediaRecommendation?.idMal)
      .map(n => ({
        id:    n.mediaRecommendation.idMal,
        title: n.mediaRecommendation.title.english ?? n.mediaRecommendation.title.romaji,
        cover: n.mediaRecommendation.coverImage.medium
      }))
  };
}