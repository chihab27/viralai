// Background script for the ViralAI Fix extension

// Listen for installation
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('ViralAI Fix extension installed:', details);
  
  // Find the ViralAI extension
  chrome.management.getAll(function(extensions) {
    const viralAIExtension = extensions.find(ext => 
      ext.name.includes('ViralAI') || 
      ext.description.includes('viral') || 
      ext.description.includes('YouTube') && ext.description.includes('shorts')
    );
    
    if (viralAIExtension) {
      console.log('Found ViralAI extension:', viralAIExtension.id);
      
      // Store the extension ID for later use
      chrome.storage.local.set({ viralAIExtensionId: viralAIExtension.id });
      
      // Try to inject the fix
      injectFixIntoExtension(viralAIExtension.id);
    } else {
      console.warn('ViralAI extension not found');
    }
  });
});

// Function to inject the fix into the ViralAI extension
function injectFixIntoExtension(extensionId) {
  // Try to inject into the background page
  chrome.scripting.executeScript({
    target: { extensionId: extensionId },
    files: ['direct-fix.js']
  }).then(() => {
    console.log('Successfully injected fix into ViralAI extension');
  }).catch(error => {
    console.error('Failed to inject fix into ViralAI extension:', error);
    
    // Alternative approach: inject when the popup is opened
    console.log('Will try to inject when popup is opened instead');
  });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'applyFix') {
    // Get the ViralAI extension ID
    chrome.storage.local.get(['viralAIExtensionId'], function(result) {
      if (result.viralAIExtensionId) {
        injectFixIntoExtension(result.viralAIExtensionId);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'ViralAI extension ID not found' });
      }
    });
    return true; // Keep the message channel open for the async response
  }
});
