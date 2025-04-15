// Background script for the ViralAI Fix extension

console.log('ViralAI Fix: Background script loaded');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'applyFix') {
    console.log('ViralAI Fix: Received request to apply fix');
    
    // Find the ViralAI extension
    chrome.management.getAll(function(extensions) {
      const viralAIExtension = extensions.find(ext => 
        ext.name.includes('ViralAI') || 
        ext.description.includes('viral') || 
        ext.description.includes('YouTube') && ext.description.includes('shorts')
      );
      
      if (viralAIExtension) {
        console.log('ViralAI Fix: Found ViralAI extension', viralAIExtension.id);
        
        // Save the extension ID for later use
        chrome.storage.local.set({ viralAIExtensionId: viralAIExtension.id });
        
        // Try to inject the fix into the ViralAI extension's background page
        try {
          chrome.scripting.executeScript({
            target: { extensionId: viralAIExtension.id },
            files: ['apply-fixes.js']
          }).then(() => {
            console.log('ViralAI Fix: Successfully injected fix into ViralAI extension');
            sendResponse({ success: true });
          }).catch(error => {
            console.error('ViralAI Fix: Failed to inject fix into ViralAI extension:', error);
            sendResponse({ success: false, error: error.message });
          });
        } catch (error) {
          console.error('ViralAI Fix: Error injecting fix:', error);
          sendResponse({ success: false, error: error.message });
        }
      } else {
        console.error('ViralAI Fix: Could not find ViralAI extension');
        sendResponse({ success: false, error: 'Could not find ViralAI extension' });
      }
    });
    
    return true; // Keep the message channel open for the async response
  }
});

// Listen for installation
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    console.log('ViralAI Fix: Extension installed');
    
    // Open the popup page
    chrome.tabs.create({ url: 'fix-viralaiai.html' });
  }
});
