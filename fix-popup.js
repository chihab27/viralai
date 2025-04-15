// Popup script for the ViralAI Fix extension

document.addEventListener('DOMContentLoaded', function() {
  // Get elements
  const applyFixButton = document.getElementById('apply-fix');
  const openViralAIButton = document.getElementById('open-viralaiai');
  const statusElement = document.getElementById('status');
  
  // Function to show status
  function showStatus(message, type) {
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    statusElement.style.display = 'block';
  }
  
  // Apply fix button click handler
  applyFixButton.addEventListener('click', function() {
    showStatus('Applying fix...', 'loading');
    
    // Send message to background script
    chrome.runtime.sendMessage({ action: 'applyFix' }, function(response) {
      if (response && response.success) {
        showStatus('Fix applied successfully! Please reload the ViralAI extension.', 'success');
      } else {
        showStatus(`Failed to apply fix: ${response ? response.error : 'Unknown error'}`, 'error');
      }
    });
    
    // Also try to apply the fix directly to the current page
    try {
      // Inject the direct fix script
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('direct-fix.js');
      document.head.appendChild(script);
      
      // Also try to apply the fix to the ViralAI popup if it's open
      chrome.tabs.query({}, function(tabs) {
        const viralAITabs = tabs.filter(tab => 
          tab.url && tab.url.includes('chrome-extension://') && 
          (tab.url.includes('/popup.html') || tab.url.includes('/background'))
        );
        
        if (viralAITabs.length > 0) {
          viralAITabs.forEach(tab => {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['direct-fix.js']
            }).then(() => {
              console.log('Successfully injected fix into ViralAI tab:', tab.id);
            }).catch(error => {
              console.error('Failed to inject fix into ViralAI tab:', error);
            });
          });
        }
      });
    } catch (error) {
      console.error('Error applying fix directly:', error);
    }
  });
  
  // Open ViralAI button click handler
  openViralAIButton.addEventListener('click', function() {
    // Get the ViralAI extension ID
    chrome.storage.local.get(['viralAIExtensionId'], function(result) {
      if (result.viralAIExtensionId) {
        // Open the ViralAI popup
        chrome.tabs.create({ url: `chrome-extension://${result.viralAIExtensionId}/popup.html` });
      } else {
        showStatus('ViralAI extension not found. Please make sure it is installed.', 'error');
        
        // Try to find it
        chrome.management.getAll(function(extensions) {
          const viralAIExtension = extensions.find(ext => 
            ext.name.includes('ViralAI') || 
            ext.description.includes('viral') || 
            ext.description.includes('YouTube') && ext.description.includes('shorts')
          );
          
          if (viralAIExtension) {
            chrome.storage.local.set({ viralAIExtensionId: viralAIExtension.id });
            chrome.tabs.create({ url: `chrome-extension://${viralAIExtension.id}/popup.html` });
          }
        });
      }
    });
  });
  
  // Check if the fix has been applied
  chrome.storage.local.get(['fixApplied'], function(result) {
    if (result.fixApplied) {
      showStatus('Fix has been applied. If you still experience issues, try applying it again.', 'success');
    }
  });
});
