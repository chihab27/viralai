// This is a non-module wrapper for the secure-storage.js module
// It provides access to the secure storage functions without requiring module imports

console.log('Secure storage wrapper loaded');

// Define the functions that will be exposed
let secureStorage = {
  saveApiKey: null,
  getApiKey: null,
  initializeApiKeys: null,
  clearApiKeys: null
};

// Load the module and assign the functions
import('./secure-storage.js')
  .then(module => {
    secureStorage.saveApiKey = module.saveApiKey;
    secureStorage.getApiKey = module.getApiKey;
    secureStorage.initializeApiKeys = module.initializeApiKeys;
    secureStorage.clearApiKeys = module.clearApiKeys;
    console.log('Secure storage module loaded successfully');
  })
  .catch(error => {
    console.error('Error loading secure storage module:', error);
  });

// Expose the functions globally
window.secureStorage = secureStorage;
