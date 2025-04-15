// Content script for the ViralAI Fix extension

console.log('ViralAI Fix: Content script loaded');

// Check if we're on a YouTube page
if (window.location.hostname.includes('youtube.com')) {
  console.log('ViralAI Fix: YouTube page detected');
  
  // Inject the fix script
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('apply-fixes.js');
  script.onload = function() {
    console.log('ViralAI Fix: Fix script loaded');
    this.remove(); // Remove the script element after it's loaded
  };
  (document.head || document.documentElement).appendChild(script);
}
