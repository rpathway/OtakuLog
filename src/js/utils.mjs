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


/**
 *  Loads the navigation for every page.
 *    Adds listeners for the expand/retracted views.
 * 
 */
async function loadNavigation() {
  const hamburger = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const navLinks = mobileNav.querySelectorAll('a');
  const overlay = document.querySelector('.nav-overlay');

  // Dialog elements
  const settingsDialog = document.getElementById('settings-dialog');
  const openSettingsBtn = document.querySelector('.settings-btn');
  const saveSettingsBtn = document.getElementById('dialog-save');
  const cancelSettingsBtn = document.getElementById('dialog-cancel');
  const toggleSettingsBtn = document.querySelectorAll('.settings-toggle');
  const dialogBackdrop = document.querySelector('.dialog-backdrop');
  const dialogStateIcons = {
    "true": "bi-toggle-on",
    "false": "bi-toggle-off"
  };

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

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 640) {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('open');
        overlay.classList.remove('active');
        hamburger.innerHTML = '<i class="bi bi-list"></i>'
      }
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 640) {
      hamburger.classList.remove('active');
      mobileNav.classList.remove('open');
      overlay.classList.remove('active');
      hamburger.innerHTML = '<i class="bi bi-list"></i>'
    }
  });

  // Gets the default state of each button and sets it in localstorage
  toggleSettingsBtn.forEach(btn => {
    const name = btn.dataset.name;
    const enabledState = btn.dataset.enabled;
    const savedState = getLocalStorage(name);

    // If it's not saved in storage then set the state.
    if (savedState === null) setLocalStorage(name, enabledState);

    // Iterates through each toggle and sets a listener to change the enabled state
    btn.addEventListener('click', (e) => {
      const thisBtn = e.currentTarget;
      const enable = thisBtn.dataset.enabled !== 'true';
      thisBtn.dataset.enabled = String(enable);
  
      thisBtn.classList.toggle('bi-toggle-on', enable);
      thisBtn.classList.toggle('bi-toggle-off', !enable);
    })
  });

  // Retrieves the localstored state of each setting when opening the dialog and sets the settings buttons to reflect it.
  openSettingsBtn.addEventListener('click', () => {
    settingsDialog.showModal(); // popen modal
    toggleSettingsBtn.forEach(btn => {
      const thisBtn = btn;
      const name = thisBtn.dataset.name;
      const enabledState = thisBtn.dataset.enabled;
      let savedState = getLocalStorage(name);
  
      // Initialize if nothing saved in storage for whatever reason
      if (savedState === null) {
        setLocalStorage(name, enabledState);
        savedState = enabledState;
      }

      // Remove both possible classes
      thisBtn.classList.remove("bi-toggle-on", "bi-toggle-off");
  
      // Add saved state class
      thisBtn.classList.add(dialogStateIcons[savedState]);
    });
  })

  // Close settings when clicking outside of container or clicking `Cancel` button
  dialogBackdrop.addEventListener('click', () => settingsDialog.close())
  cancelSettingsBtn.addEventListener('click', () => settingsDialog.close());

  // Saves the settings dialog configuration to localstorage
  saveSettingsBtn.addEventListener('click', () => {
    toggleSettingsBtn.forEach(btn => {
      const name = btn.dataset.name;
      const enabledState = btn.dataset.enabled;

      setLocalStorage(name, enabledState);
    })

    // Close dialog after saving
    settingsDialog.close();

    // #TODO: Show alert for saved status.
  })

  // If the user closes the settings dialog without saving then revert changes
  settingsDialog.addEventListener('close', () => {
    toggleSettingsBtn.forEach(btn => {
      const name = btn.dataset.name;
      const enabledState = btn.dataset.enabled;
      const savedState = getLocalStorage(name);

      if (savedState !== enabledState && savedState !== null) {
        btn.dataset.enabled = savedState
        btn.classList.remove('bi-toggle-on', 'bi-toggle-off')
        btn.classList.add(dialogStateIcons[savedState]);
      }
    })
  })
}

/**
 *  Loads the header and footer for the provided resource
 * 
 */
export async function loadHeaderFooter() {
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const headerTemplate = await loadTemplate('../partials/header.html');
  const footerTemplate = await loadTemplate('../partials/footer.html')

  header.innerHTML = headerTemplate;
  footer.innerHTML = footerTemplate;

  document.getElementById('currentyear').textContent = new Date().getFullYear();
  loadNavigation();  
}

// Adds a shadow hint to show that there are more items in the carousel
document.querySelectorAll(".carousel-wrapper")?.forEach((wrapper) => {
  const carousel = wrapper.querySelector(".carousel-container");
  const fadeLeft = wrapper.querySelector(".fade-left");
  const fadeRight = wrapper.querySelector(".fade-right");

  // Fade hints for carousel items
  function updateFades() {
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;

    fadeLeft.classList.toggle("hidden", carousel.scrollLeft <= 0);
    fadeRight.classList.toggle("hidden", carousel.scrollLeft >= maxScroll - 1);
  }

  carousel.addEventListener("scroll", updateFades);
  window.addEventListener("resize", updateFades);

  updateFades();
});