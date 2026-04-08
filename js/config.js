/**
 * Analytics Hub - Configuration
 */
const AppConfig = {
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/'
    : 'https://35vk25poq2.execute-api.us-east-1.amazonaws.com/'
};
