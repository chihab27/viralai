// This script ensures the service worker is properly registered

// Check if the browser supports service workers
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    console.log('Attempting to register service worker...');
    
    // Register the service worker
    navigator.serviceWorker.register('background.js', { type: 'module' })
      .then(function(registration) {
        // Registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(function(error) {
        // Registration failed
        console.error('ServiceWorker registration failed: ', error);
      });
  });
} else {
  console.log('Service workers are not supported in this browser.');
}
