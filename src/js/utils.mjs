const BASE_URL = import.meta.env.BASE_URL;
const DEFAULT_SETTINGS = {
  sfw: {
    label: 'SFW Only',
    value: true
  },
  'test-setting': {
    label: 'Test Setting',
    value: true
  },
  'test-setting2': {
    label: 'Test Setting1',
    value: true
  },
};


/**
 *  Retrieves the value set in localStorage
 * 
 * 
 * @param {String} key  The key to retrieve the value
 * @returns {String}
 */
export function getLocalStorage(key='') {
  return localStorage.getItem(key);
}

/**
 *  Set's the value in localstorage with a key and a value
 * 
 * 
 * @param {String} key    The key to set the value as
 * @param {String} value  The value to be set with the key
 */
export function setLocalStorage(key='', value) {
  localStorage.setItem(key, value);
}

/**
 *  Retrieves saved settings state from localstorage
 * 
 * @returns {Object}  JSON settings
 */
function getSettings() {
  return JSON.parse(getLocalStorage('settings')) || { ...DEFAULT_SETTINGS };
}

/**
 *  Saves settings modal state to localstorage
 * 
 * @param {*} settings 
 */
function saveSettings(settings = {}) {
  setLocalStorage('settings', JSON.stringify(settings));
}


/**
 *  fetches the resource url from the parameter `url`
 * 
 * @param {String} url   The url resource to fetch
 * @returns
 */
export async function fetchResource(url = '') {
  try {
    const response = await fetch(url);

    if (response.ok) {
      return response
    } else {
      return null;
    }

  } catch (e) {
    console.error(`Error in fetchResource: ${e}`);
  }
}

/**
 *  Retrieves the parameter value from the window url
 * 
 * @param {String} p  The parameter value to be returned
 * @returns 
 */
export function getParam(p = '') {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const param = urlParams.get(p)

  return param;
}


/**
 *  Retrieves an html partial page and returns it as text.
 *    If the resource is not found, then redirect to home.
 * 
 * 
 * @param {String} page   The html partial to be fetched
 * @returns 
 */
async function loadTemplate(page = '') {
  try {
    const template = await fetchResource(page).then(r => r.text())

    if (template) {
      return template;
    } else {
      window.location.href = '/'
    }

  } catch (e) {
    console.error(`Error in loadTemplate: ${e}`);
  }
}


// Sets the header icon image to the static url path
async function setHeaderIconImg() {
  const img = document.getElementById('header-icon');
  img.src = `${BASE_URL}images/main-icon-sm.webp`
}


/**
 *  Creates message alerts, shows & hides the alert panel
 * 
 * 
 * @param {Object} alertElement   The Alert Element
 * @returns {Function} show|hide  The Alert control functions to show or hide the alert panel
 */
function createAlertController(alertElement) {
  let alertTimeout = null;
  let hideTimeout = null;

  const msgElement = alertElement.querySelector('#alert-msg');
  const iconElement = alertElement.querySelector('#alert-icon');

  const icons = {
    info: ['bi-exclamation-circle-fill', 'text-blue-400'],
    success: ['bi-check-circle-fill', 'text-lime-600'],
    warn: ['bi-exclamation-diamond-fill', 'text-yellow-400'],
    error: ['bi-exclamation-diamond-fill', 'text-red-600']
  };

  function show(msg = '', type = 'info', duration = 3000) {
    // Clear existing timers
    if (alertTimeout) clearTimeout(alertTimeout);
    if (hideTimeout) clearTimeout(hideTimeout);

    // Remove all posssible icons
    Object.values(icons).forEach(icons => iconElement.classList.remove(...icons));
    iconElement.classList.add(...icons[type]);
    msgElement.textContent = msg;

    // Show
    alertElement.classList.remove('-translate-y-full', 'invisible');
    alertElement.classList.add('translate-y-0');

    // Hide
    alertTimeout = setTimeout(hide, duration);
  }

  function hide() {
    alertElement.classList.remove('translate-y-0');
    alertElement.classList.add('-translate-y-full');

    hideTimeout = setTimeout(() => {
      alertElement.classList.add('invisible');
    }, 300);
  }

  return { show, hide };
}


/**
 *  Sets listeners for the settings dialog panel and related items
 * 
 */
async function setSettingsListeners() {
  // Create and set alert panel controller for status messages
  const alertPanel = document.getElementById('alert-panel');
  const alertController = createAlertController(alertPanel);

  // Dialog elements
  const settingsDialog = document.getElementById('settings-dialog');
  const openSettingsBtn = document.querySelectorAll('.settings-btn');
  const saveSettingsBtn = document.getElementById('dialog-save');
  const cancelSettingsBtn = document.getElementById('dialog-cancel');
  const dialogBackdrop = document.querySelector('.dialog-backdrop');

  let savedSettings = getSettings();
  let pendingSettings = structuredClone(savedSettings);

  // Checks the state of every settings toggle switch with local storage and enables saving.
  const hasUnsavedChanges = () => JSON.stringify(pendingSettings) !== JSON.stringify(savedSettings);
  function setSettings(settings) {
    const list = document.getElementById('settings-list');
    list.innerHTML = '';

    Object.entries(settings).forEach(([key, entries]) => {
      const toggleState = entries.value ? 'bi-toggle-on' : 'bi-toggle-off'
      const li = document.createElement('li');
      li.className = 'flex justify-between text-center text-white items-center';
      li.innerHTML = `
        <button class="bi ${toggleState} settings-toggle text-4xl fill-white cursor-pointer" data-name="${key}"></button>
        <p class="text-end">${entries.label}</p>
      `

      list.appendChild(li);
    })

    // Sets listeners to each toggle button so save button reflects state
    list.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const name = btn.dataset.name;
        pendingSettings[name].value = !pendingSettings[name].value;
        console.log(`hasunsaved: ${hasUnsavedChanges()}`)
        saveSettingsBtn.disabled = !hasUnsavedChanges();

        setSettings(pendingSettings);
      })
    })
  }

  // Retrieves the localstored state of each setting when opening the dialog and sets the settings buttons to reflect it.
  openSettingsBtn.forEach(btn => {
    btn.addEventListener('click', () => {
      savedSettings = getSettings();
      pendingSettings = structuredClone(savedSettings);
      saveSettingsBtn.disabled = true;

      setSettings(pendingSettings);
      settingsDialog.showModal(); // popen modal
    })
  })

  // Close settings when clicking outside of container or clicking `Cancel` button
  dialogBackdrop.addEventListener('click', () => settingsDialog.close())
  cancelSettingsBtn.addEventListener('click', () => settingsDialog.close());

  // Saves the settings dialog configuration to localstorage
  saveSettingsBtn.addEventListener('click', () => {
    saveSettings(pendingSettings);
    savedSettings = structuredClone(pendingSettings);

    settingsDialog.close();
    alertController.show('Settings saved successfully!', 'success');
  })

  // If the user closes the settings dialog without saving then revert changes
  settingsDialog.addEventListener('close', () => {
    if (hasUnsavedChanges()) {
      alertController.show('Changes discarded!', 'warn');
    }

    setSettings(savedSettings);
  })

  if (!getLocalStorage('settings')) saveSettings(DEFAULT_SETTINGS);
}


/**
 *  Loads the navigation for every page.
 *    Adds listeners for the expand/retracted views.
 * 
 */
async function setNavListeners() {
  const nav = document.querySelectorAll('nav');
  const hamburger = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileNavLinks = mobileNav.querySelectorAll('a');
  const overlay = document.querySelector('.nav-overlay');


  // Sets the base url in the nav links for page routing
  nav.forEach(navMenu => {
    navMenu.querySelectorAll('[data-route]').forEach(link => {
      const base = import.meta.env.BASE_URL;
      const routes = {
        home: '',
        account: 'account/',
        search: 'search/',
        lists: 'lists/',
      };
      const route = link.dataset.route;
      link.href = base + routes[route];
    });
  })

  overlay.addEventListener('click', () => {
    hamburger.classList.remove('active');
    mobileNav.classList.remove('open');
    overlay.classList.remove('active');

    hamburger.innerHTML = '<i class="bi bi-list"></i>';
  });

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    overlay.classList.toggle('active');

    if (hamburger.classList.contains('active')) {
      hamburger.innerHTML = '<i class="bi bi-x-lg"></i>'
    } else {
      hamburger.innerHTML = '<i class="bi bi-list"></i>'
    }

    mobileNav.classList.toggle('open');
  });

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 640) {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('open');
        overlay.classList.remove('active');
        hamburger.innerHTML = '<i class="bi bi-list"></i>'
      }
    });
  });

  // Sets a listener to reset the mobile nav to a closed state on window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 640) {
      hamburger.classList.remove('active');
      mobileNav.classList.remove('open');
      overlay.classList.remove('active');
      hamburger.innerHTML = '<i class="bi bi-list"></i>'
    }
  });
}


/**
 *  Loads the header and footer for the provided resource
 * 
 */
export async function loadHeaderFooter() {
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const headerTemplate = await loadTemplate(`${BASE_URL}/partials/header.html`);
  const footerTemplate = await loadTemplate(`${BASE_URL}/partials/footer.html`)

  header.innerHTML = headerTemplate;
  footer.innerHTML = footerTemplate;

  document.getElementById('currentyear').textContent = new Date().getFullYear();
  setHeaderIconImg();
  setNavListeners();
  setSettingsListeners();
}

// Adds a shadow hint to show that there are more items in the carousel
export function initCarousel(carouselWrapper) {
  const wrapper = carouselWrapper.closest('.carousel-wrapper')
  if (!wrapper) return console.error('no wrapper found');

  const carousel = wrapper.querySelector('.carousel-container');
  const fadeLeft = wrapper.querySelector('.fade-left');
  const fadeRight = wrapper.querySelector('.fade-right');
  if (!fadeLeft || !fadeRight) return console.error('no fade divs found', wrapper.innerHTML);
  const btnLeft = fadeLeft.querySelector('button');
  const btnRight = fadeRight.querySelector('button');

  function updateFades() {
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;

    fadeLeft.classList.toggle('hidden', carousel.scrollLeft < 1);
    fadeRight.classList.toggle('hidden', carousel.scrollLeft >= maxScroll - 1);
  }

  btnLeft.addEventListener('click', () => {
    const scrollAmount = window.innerWidth < 640 ? 150 : 600;
    carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
  });
  btnRight.addEventListener('click', () => {
    const scrollAmount = window.innerWidth < 640 ? 150 : 600;
    carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  });
  carousel.addEventListener('scroll', updateFades);
  window.addEventListener('resize', updateFades);

  // Wait for images to load before setting scroll width because of lazy loading
  Promise.all([...carousel.querySelectorAll('img')].map(img => img.complete ? Promise.resolve() : new Promise(r => img.addEventListener('load', r)))).then(updateFades);
}