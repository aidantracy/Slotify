// Shared authentication helpers for Slotify. Load this AFTER js/config.js on
// every page. Exposes window.Auth and auto-updates the nav on page load.
(function () {
  const TOKEN_KEY = 'slotify_token';
  const USER_KEY = 'slotify_user';

  const Auth = {
    getToken() {
      return localStorage.getItem(TOKEN_KEY);
    },
    getUser() {
      try {
        return JSON.parse(localStorage.getItem(USER_KEY));
      } catch {
        return null;
      }
    },
    isLoggedIn() {
      return !!localStorage.getItem(TOKEN_KEY);
    },
    setSession(token, user) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    logout() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
    // Header object to spread into fetch() calls that need authentication.
    authHeaders() {
      const t = localStorage.getItem(TOKEN_KEY);
      return t ? { Authorization: 'Bearer ' + t } : {};
    },
    // Redirect to the login page if the user is not authenticated.
    requireAuth(loginPath) {
      if (!this.isLoggedIn()) {
        window.location.href = loginPath || 'login.html';
        return false;
      }
      return true;
    },
    // Show/hide nav items and fill in the logged-in user's name.
    // Elements with class "auth-only" show only when logged in; "guest-only"
    // show only when logged out. #logout-link clears the session on click,
    // #nav-user-name is filled with the user's name.
    updateNav() {
      const loggedIn = this.isLoggedIn();
      document.querySelectorAll('.auth-only').forEach((el) => {
        el.style.display = loggedIn ? '' : 'none';
      });
      document.querySelectorAll('.guest-only').forEach((el) => {
        el.style.display = loggedIn ? 'none' : '';
      });
      const nameEl = document.getElementById('nav-user-name');
      if (nameEl) {
        const u = this.getUser();
        if (u) nameEl.textContent = `${u.first_name} ${u.last_name}`;
      }
      const logout = document.getElementById('logout-link');
      if (logout) {
        // Clear the session, then let the link's href navigate home.
        logout.addEventListener('click', () => this.logout());
      }
    },
  };

  window.Auth = Auth;
  document.addEventListener('DOMContentLoaded', () => Auth.updateNav());
})();
