// Simple fix for ViralAI extension
// This script adds the missing setLatestShortResult function

// Define the missing function
function setLatestShortResult(result) {
  console.log('Setting latest short result:', result);
  
  // Store the result in memory
  self.latestShortResult = result;
  
  // Also save to storage for persistence
  chrome.storage.local.set({ latestShortResult: result }, () => {
    console.log('Short result saved to storage:', result.status || 'unknown');
  });
  
  return result;
}

// Make the function globally available
self.setLatestShortResult = setLatestShortResult;

// Patch the createShortWithViralDetection function to use our setLatestShortResult function
const originalCreateShortWithViralDetection = self.createShortWithViralDetection;

self.createShortWithViralDetection = function(request, sendResponse, openRouterApiKey, sieveApiKey, setLatestShortResultParam) {
  // Use our global setLatestShortResult function if none is provided
  const setLatestShortResultFunc = setLatestShortResultParam || setLatestShortResult;
  
  // Call the original function with our setLatestShortResult function
  return originalCreateShortWithViralDetection(request, sendResponse, openRouterApiKey, sieveApiKey, setLatestShortResultFunc);
};

console.log('ViralAI fix applied successfully! The setLatestShortResult function has been defined.');
