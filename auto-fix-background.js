// Background script for ViralAI Auto-Fix extension

// Store the ViralAI extension ID
let viralAIExtensionId = null;

// Listen for installation
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('ViralAI Auto-Fix installed:', details);
  
  // Find the ViralAI extension
  findViralAIExtension().then(extensionId => {
    if (extensionId) {
      viralAIExtensionId = extensionId;
      console.log('Found ViralAI extension:', extensionId);
      
      // Apply the fix
      applyFix(extensionId);
    } else {
      console.warn('ViralAI extension not found');
    }
  });
});

// Listen for Chrome startup
chrome.runtime.onStartup.addListener(function() {
  console.log('Chrome started, checking for ViralAI extension');
  
  // Find the ViralAI extension
  findViralAIExtension().then(extensionId => {
    if (extensionId) {
      viralAIExtensionId = extensionId;
      console.log('Found ViralAI extension:', extensionId);
      
      // Apply the fix
      applyFix(extensionId);
    } else {
      console.warn('ViralAI extension not found');
    }
  });
});

// Function to find the ViralAI extension
async function findViralAIExtension() {
  return new Promise((resolve) => {
    // First check if we already have the ID in storage
    chrome.storage.local.get(['viralAIExtensionId'], function(result) {
      if (result.viralAIExtensionId) {
        resolve(result.viralAIExtensionId);
        return;
      }
      
      // If not, search for it
      chrome.management.getAll(function(extensions) {
        const viralAIExtension = extensions.find(ext => 
          ext.name.includes('ViralAI') || 
          ext.description.includes('viral') || 
          (ext.description.includes('YouTube') && ext.description.includes('shorts'))
        );
        
        if (viralAIExtension) {
          // Store the ID for future use
          chrome.storage.local.set({ viralAIExtensionId: viralAIExtension.id });
          resolve(viralAIExtension.id);
        } else {
          resolve(null);
        }
      });
    });
  });
}

// Function to apply the fix to the ViralAI extension
async function applyFix(extensionId) {
  console.log('Applying fix to ViralAI extension:', extensionId);
  
  try {
    // Apply fix to the background page
    await applyFixToBackgroundPage(extensionId);
    
    // Apply fix to any open popup pages
    await applyFixToPopupPages(extensionId);
    
    // Set up listeners for future popup pages
    setupPopupListeners(extensionId);
    
    console.log('Fix applied successfully');
    
    // Store the timestamp of the fix
    chrome.storage.local.set({ 
      fixApplied: true, 
      fixTimestamp: Date.now() 
    });
  } catch (error) {
    console.error('Error applying fix:', error);
  }
}

// Function to apply fix to the background page
async function applyFixToBackgroundPage(extensionId) {
  try {
    // Execute the fix script in the background page
    await chrome.scripting.executeScript({
      target: { extensionId: extensionId },
      files: ['auto-fix.js']
    });
    
    console.log('Fix applied to background page');
    return true;
  } catch (error) {
    console.error('Error applying fix to background page:', error);
    return false;
  }
}

// Function to apply fix to open popup pages
async function applyFixToPopupPages(extensionId) {
  try {
    // Find all tabs that might be ViralAI popup pages
    const tabs = await chrome.tabs.query({});
    
    const viralAITabs = tabs.filter(tab => 
      tab.url && tab.url.includes(`chrome-extension://${extensionId}/popup.html`)
    );
    
    if (viralAITabs.length === 0) {
      console.log('No open ViralAI popup pages found');
      return true;
    }
    
    // Apply fix to each popup page
    for (const tab of viralAITabs) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['popup-enhancer.js']
      });
      
      console.log('Fix applied to popup page:', tab.id);
    }
    
    return true;
  } catch (error) {
    console.error('Error applying fix to popup pages:', error);
    return false;
  }
}

// Function to set up listeners for future popup pages
function setupPopupListeners(extensionId) {
  // Listen for tab updates
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // Check if this is a ViralAI popup page
    if (tab.url && tab.url.includes(`chrome-extension://${extensionId}/popup.html`) && changeInfo.status === 'complete') {
      // Apply the fix to the popup page
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['popup-enhancer.js']
      }).then(() => {
        console.log('Fix applied to new popup page:', tabId);
      }).catch(error => {
        console.error('Error applying fix to new popup page:', error);
      });
    }
  });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'applyFix') {
    // Find the ViralAI extension
    findViralAIExtension().then(extensionId => {
      if (extensionId) {
        // Apply the fix
        applyFix(extensionId).then(() => {
          sendResponse({ success: true });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'ViralAI extension not found' });
      }
    });
    
    return true; // Keep the message channel open for the async response
  }
});
