// Central client-side configuration for Slotify.
// Change API_BASE_URL to point the frontend at your backend.
//   - Local development:  http://localhost:3000
//   - Production:         your deployed backend URL (use https://)
//
// The frontend talks only to this backend API; it never connects to the
// database directly.
window.SLOTIFY_CONFIG = {
  API_BASE_URL: "http://localhost:3000",
};
