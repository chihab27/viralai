// Test Service Worker Registration
// This file tests that the service worker can be registered without using modules

// Register the service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./background-worker.js')
    .then(registration => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error);
    });
}
