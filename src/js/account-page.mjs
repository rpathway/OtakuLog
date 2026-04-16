import { BASE_URL, getLocalStorage, setLocalStorage, createAlertController, loadTemplate, getAccount, isLoggedIn } from './utils.mjs';


/**
 *  Checks password strength and returns a score and label
 * 
 * @param {String} password   The password to test
 * @returns {Object}          The score and strength labels
 */
function passwordStrength(password) {
  // Checkbox requirements
  let score = 0;

  // length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // variety checks
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // penalty for obvious patterns
  if (/^(123456|password|qwerty)/i.test(password)) score -= 2;
  // Repeating characters
  if (/(.)\1\1/i.test(password)) score -= 1;

  return {
    score: Math.floor((score / 6) * 100),
    label: score > 5 ? "Strong" : (score <= 4 && score > 2 ? "Medium" : "Weak")
  };
}


/**
 * 
 * @param {*} message 
 * @returns 
 */
async function hashData(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Delivers account view.
async function deliverAccountPage(params) {
  const main = document.querySelector('main');
  try {
    const profilePage = await loadTemplate(`${BASE_URL}/partials/account-page.html`);
    main.innerHTML = profilePage;
  } catch (e) {
    console.error(`Error in deliverAccountPage`);
  }
}


/**
 *  initializes login/signup form listeners
 * 
 */
async function initAccountPage() {
  // const main = document.querySelector('main');
  // try {
  //   const formPage = await loadTemplate(`${BASE_URL}partials/account-login.html`);
  //   main.innerHTML = formPage;
  // } catch (e) {
  //   console.error(`Error in deliverFormPage: ${e}`);
  // }

  const accountForm = document.getElementById('account-form');
  const submitBtn = document.getElementById('submit-form-btn');
  const toggleFormBtn = document.getElementById('toggle-form-btn');

  // Enables/disabled the submit button based upon valid form entries
  accountForm.addEventListener('input', () => {
    submitBtn.disabled = !accountForm.checkValidity()
  })

  /**
   *  Toggles between the sign up and login form
   * 
   * @param {String} type   The type of form being presented
   */
  function toggleForm(type='Login') {
    const isLogin = type === 'Login';
    const goBackType = isLogin ? 'Sign up' : 'Login';

    // Form elements
    const usernameInput = accountForm.querySelector('#username');
    const userLabel = accountForm.querySelector('[for="username"]');
    const suggestionsBox = accountForm.querySelector('#pw-suggestions');
    const pwQuality = accountForm.querySelector('#pw-quality-bar');
    const requiredIndicator = accountForm.querySelectorAll('#required-field');
    accountForm.querySelector('#password').value = '';

    // Hide/Unhide elements based off of form type
    requiredIndicator.forEach(e => e.classList.toggle('hidden', isLogin))
    pwQuality.classList.toggle('hidden', isLogin);
    suggestionsBox.classList.toggle('hidden', isLogin);
    userLabel.classList.toggle('hidden', isLogin);
    usernameInput.classList.toggle('hidden', isLogin);
    usernameInput.disabled = isLogin;

    submitBtn.disabled = !accountForm.checkValidity()
    submitBtn.value = isLogin ? 'Login' : 'Sign up';
    toggleFormBtn.textContent = goBackType;
    toggleFormBtn.dataset.formType = goBackType;
  }

  /**
   *  Catches the submitted data and saves it to localstorage if user has been created.
   *    Retrieves saved data from storage and checks validity.
   */
  accountForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const alertPanel = document.getElementById('alert-panel');
    const alertController = createAlertController(alertPanel);
    const loginData = getAccount();

    const formData = new FormData(accountForm);
    const email = formData.get('email');
    const password = formData.get('password');
    const username = formData.get('username');

    const hashedData = await hashData(JSON.stringify({ email, password }));

    const showLoadingState = () => {
      submitBtn.disabled = true;
      submitBtn.classList.add('hidden');
      accountForm.querySelector('.loading-spinner').classList.remove('hidden');
    };

    const reloadAfterDelay = (delay = 3000) => {
      setTimeout(() => window.location.href = '/', delay);
    };

    // Sign up
    if (submitBtn.value === 'Sign up') {
      showLoadingState();
      setLocalStorage('login', JSON.stringify({
        user: username,
        hash: hashedData,
        loggedIn: false
      }));

      alertController.show('Successfully Signed up!', 'success');
      return reloadAfterDelay();
    }

    // Log in
    if (!loginData) {
      return alertController.show('Could not find your account. Please check your details and try again, or sign up to create a new account.', 'error', 5000);
    }

    if (loginData.hash !== hashedData) {
      return alertController.show('Invalid email or password.', 'error');
    }

    showLoadingState();

    loginData.loggedIn = true;
    setLocalStorage('login', JSON.stringify(loginData));

    alertController.show('Successfully Logged in!', 'success');
    reloadAfterDelay();
  });

  /**
   *  Adds event listener to input elements to reflect invalid and valid inputs
   *    Sets password strength and quality indicators
   */
  accountForm.querySelectorAll('input').forEach(inputEl => {
    const id = inputEl.id;
    if (id == 'submit-form-btn') return;

    if (id == 'password') {
      inputEl.addEventListener('input', (e) => {
        if (document.getElementById('submit-form-btn').value === 'Login') return;
        const pw = e.currentTarget.value;
        const hardToGuess = document.getElementById('pw-guess');
        const lengthRequirement = document.getElementById('pw-length');
        const commonPassword = document.getElementById('pw-common');
        const strengthText = document.getElementById('strength-text');
        const bar = document.getElementById('strength-bar');
        const score = passwordStrength(pw)
  
        // Set quality bar width based off of score
        bar.style.width = `${score.score}%`;
        bar.style.background = score.score > 80 ? 'green' : (score.score <= 80 && score.score > 20 ? 'orange' : 'red');
        strengthText.textContent = score.label;

        // Set check boxes for suggestions
        lengthRequirement.classList.toggle('text-lime-500', pw.length >= 8 && pw.length <= 64)
        hardToGuess.classList.toggle('text-lime-500', score.score >= 60);
        commonPassword.classList.toggle('text-lime-500', score.score >= 90);
      })
    }

    inputEl.addEventListener('blur', () => {
      inputEl.classList.toggle('touched', inputEl.value);
    });
  })

  // Sets event listener to toggle form type
  toggleFormBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const type = toggleFormBtn.dataset.formType;
    document.querySelector('main h1').textContent = type;

    toggleForm(type);
  })
}



/**
 *  initializes account page
 * 
 *    Checks for saved login, delivers login/signup page if none is found.
 *    Loads account view if logged in.
 */
async function init() {
  // const hasLogin = getAccount();

  // Deliver form login/signup page
  await initAccountPage();
  // if (!hasLogin || hasLogin?.loggedIn === false) {
  //   await deliverFormPage()

  // // Deliver account view
  // } else if (hasLogin.loggedIn) {
  //   // await deliverAccountPage();
  // }
}

init()