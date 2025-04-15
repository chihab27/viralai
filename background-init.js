// This is a non-module initialization script for the background service worker
// It will handle basic initialization and then load the module version

console.log('Background initialization script loaded');

// Set up a basic message listener to ensure communication works
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Message received in background-init:', request);
  
  // Forward the message to the module version if needed
  if (request.action === 'ping') {
    sendResponse({ status: 'Background init script is running' });
    return true;
  }
});

// Load the module version of the background script
try {
  console.log('Attempting to load background.js as a module...');
  
  // We can't directly import here since this is not a module,
  // but we can ensure the service worker is registered
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('background.js', { type: 'module' })
      .then(function(registration) {
        console.log('Background module registered successfully:', registration);
      })
      .catch(function(error) {
        console.error('Error registering background module:', error);
      });
  }
} catch (error) {
  console.error('Error loading background module:', error);
}
