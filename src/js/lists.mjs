import { setLocalStorage, getLocalStorage } from './utils.mjs';

const LISTS_KEY = 'user-lists';
const PROGRESS_KEY = 'episode-progress';
export const DEFAULT_LISTS = [
  'Want to Watch',
  'Watching',
  'Completed',
  'Dropped',
  'On Hold'
];


/**
 *  Retrieves saved lists from localstorage
 * 
 * @returns {Object} The user's saved lists or default
 */
export function getLists() {
  const stored = JSON.parse(getLocalStorage(LISTS_KEY))
  if (stored) return stored;

  // Init with default
  const defaults = {};
  DEFAULT_LISTS.forEach(name => defaults[name] = []);
  saveLists(defaults);

  return defaults;
}

// Saves lists to localstorage
export function saveLists(lists) {
  setLocalStorage(LISTS_KEY, JSON.stringify(lists));
}

// Retrieves the episode progress for the series
export function getProgress() {
  return JSON.parse(getLocalStorage(PROGRESS_KEY)) || {};
}

// Sets the episode progress forr the series
export function setProgress(malId, count) {
  const progress = getProgress();

  progress[String(malId)] = count;
  setLocalStorage(PROGRESS_KEY, JSON.stringify(progress));
}

// Returns the series episode progress or 0 if none
export function getSeriesProgress(malId) {
  return getProgress()[String(malId)] ?? 0;
}

// Adds a series to the list and saves to localstorage
export function addToList(listName, malId) {
  const lists = getLists();

  if (!lists[listName]) lists[listName] = [];
  if (!lists[listName].includes(malId)) lists[listName].push(malId);

  saveLists(lists);
}

// Removes the series from the list and saves state to localstorage
export function removeFromList(listName, malId) {
  const lists = getLists();
  if (!lists[listName]) return;

  lists[listName] = lists[listName].filter(id => id !== malId);
  saveLists(lists);
}

// Returns all the lists for the series that the user has saved to
export function getSeriesLists(malId) {
  const lists = getLists();
  return Object.entries(lists).filter(([_, id]) => id.includes(malId)).map(([name]) => name);
}

// Creates a list
export function createList(name) {
  const lists = getLists();
  // already exists
  if (lists[name]) return false;

  lists[name] = [];
  saveLists(lists);

  return true;
}

// Delete a user created list
export function deleteList(name) {
  // Can't delete default lists (Want to watch|Watching|Completed|Dropped|On Hold)
  if (DEFAULT_LISTS.includes(name)) return false;
  const lists = getLists();

  delete lists[name];
  saveLists(lists);

  return true;
}