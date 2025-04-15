// Background Worker Wrapper
// This file is used to register the service worker without using import statements

// Register the service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./background-worker.js', { type: 'module' })
    .then(registration => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error);
    });
}
