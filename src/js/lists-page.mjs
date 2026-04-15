import { getLocalStorage } from "./utils.mjs";
import { fetchWithCache, normalizeJikanData } from "./jikan.mjs";
import { createCarouselCard } from "./templates.mjs";
import { openSeriesModal } from './modal.mjs';


// anime/{id}
const JIKAN_URL = import.meta.env.VITE_JIKAN_BASE_URL;
const ENDPOINT_PATH = `${JIKAN_URL}/anime/`



// Builds accordion list sections
function buildSections(name) {
  const div = document.createElement('div');
  div.innerHTML = `
    <button id="${name}-list" class="accordion">${name} <i class="bi bi-caret-down-square"></i></button>
    <div class="accordion-panel"></div>
  `
  return div;
}

/**
 *  Initializes accordion listener to show content when clicked
 * 
 * @param {String} name   The name of the accordion section
 */
function initAccordionListeners(name) {
  const accordionBtn = document.getElementById(`${name}-list`);
  accordionBtn.addEventListener('click', () => {
    const panel = accordionBtn.parentNode.querySelector('.accordion-panel');
    panel.classList.toggle('active');
  })
}


/**
 *  populates the list section with the 
 * 
 * @param {Number} id          The MalId for the anime series
 * @param {String} listName    The list section name
 */
function populateList(id, listName) {
  const url = `${ENDPOINT_PATH}${id}`;
  const accordion = document.getElementById(`${listName}-list`).parentNode;

  try {
    fetchWithCache(url).then(series => {
      const panel = accordion.querySelector('.accordion-panel');
      const card = createCarouselCard(normalizeJikanData(series));
      const parser = new DOMParser();
      const doc = parser.parseFromString(card, 'text/html');
      panel.appendChild(doc.body.firstChild);

      panel.querySelectorAll('.carousel-card').forEach(card => {
        card.addEventListener('click', () => {
          const malId = card.dataset.malid;
          if (malId) openSeriesModal(parseInt(malId));
        });
      })

    })

  } catch (e) {
    console.error(`Error in lists-page/populateList: ${e}`);
  }
}

/**
 *  builds the accordion sections, appends list data.
 * 
 * @param {Object} data   The user's saved lists.
 */
function buildAccordion(data) {
  const main = document.querySelector('main');

  Object.entries(data).forEach(entry => {
    const listName = entry[0];
    const listData = entry[1];
    if (listData.length === 0 ) return;

    const section = buildSections(listName);
    main.appendChild(section);

    initAccordionListeners(listName);
    listData.forEach(malId => populateList(malId, listName));
  })
}


// Initializes Lists page
function init() {
  const userLists = JSON.parse(getLocalStorage('user-lists')) || {};
  buildAccordion(userLists);
}

init();