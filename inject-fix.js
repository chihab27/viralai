// Inject the fix script into the extension background page

// Function to inject a script into the current page
function injectScript(file) {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(file);
  script.onload = function() {
    console.log(`Script ${file} injected successfully`);
    this.remove(); // Remove the script element after loading
  };
  (document.head || document.documentElement).appendChild(script);
}

// Function to inject code directly
function injectCode(code) {
  const script = document.createElement('script');
  script.textContent = code;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

// Inject the direct fix script
injectScript('direct-fix.js');

// Also inject a small piece of code to ensure the fixes are applied
injectCode(`
  // Make sure the fixes are applied when the page loads
  window.addEventListener('load', function() {
    if (window.ViralAIFixes && window.ViralAIFixes.applyAllFixes) {
      console.log('Applying ViralAI fixes on page load...');
      window.ViralAIFixes.applyAllFixes();
    } else {
      console.warn('ViralAI fixes not found on page load');
    }
  });
  
  // Also try to apply fixes immediately
  if (window.ViralAIFixes && window.ViralAIFixes.applyAllFixes) {
    console.log('Applying ViralAI fixes immediately...');
    window.ViralAIFixes.applyAllFixes();
  }
`);

console.log('ViralAI fix injection script executed');
