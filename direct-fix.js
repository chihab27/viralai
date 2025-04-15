// Direct fix for ViralAI extension errors

// Fix for the setLatestShortResult function
function fixViralDetection() {
  // Define the missing function
  window.setLatestShortResult = function(result) {
    console.log('Setting latest short result:', result);
    
    // Store the result in memory
    window.latestShortResult = result;
    
    // Also save to storage for persistence
    chrome.storage.local.set({ latestShortResult: result }, () => {
      console.log('Short result saved to storage:', result.status || 'unknown');
    });
    
    return result;
  };
  
  // Define a getter function if it doesn't exist
  if (!window.getLatestShortResult) {
    window.getLatestShortResult = function() {
      return window.latestShortResult || null;
    };
  }
  
  console.log('Viral detection fix applied');
  return true;
}

// Fix for the clipboard writeText error
function fixClipboardAccess() {
  // Create a safe wrapper for clipboard operations
  window.safeClipboardWrite = function(text) {
    try {
      // Try the standard clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      
      // Fallback method using document.execCommand
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return Promise.resolve(success);
    } catch (error) {
      console.error('Error writing to clipboard:', error);
      return Promise.reject(error);
    }
  };
  
  // Patch any existing clipboard functions
  if (typeof copyToClipboard === 'function') {
    const originalCopyToClipboard = copyToClipboard;
    window.copyToClipboard = function(text) {
      return safeClipboardWrite(text).catch(error => {
        console.error('Failed to copy using safe method, trying original:', error);
        return originalCopyToClipboard(text);
      });
    };
  }
  
  console.log('Clipboard access fix applied');
  return true;
}

// Fix for message port closed error
function fixMessagePortCommunication() {
  // Create a more robust message sending function
  window.sendRobustMessage = function(message, callback) {
    try {
      // Add a timeout to ensure callback is always called
      let callbackCalled = false;
      
      const timeoutId = setTimeout(() => {
        if (!callbackCalled) {
          callbackCalled = true;
          console.log('Message response timed out, calling callback with default response');
          callback({ success: false, error: 'Response timed out' });
        }
      }, 5000); // 5 second timeout
      
      chrome.runtime.sendMessage(message, response => {
        clearTimeout(timeoutId);
        
        if (!callbackCalled) {
          callbackCalled = true;
          
          if (chrome.runtime.lastError) {
            console.warn('Runtime error in message response:', chrome.runtime.lastError);
            callback({ success: false, error: chrome.runtime.lastError.message });
          } else {
            callback(response || { success: false, error: 'No response received' });
          }
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      callback({ success: false, error: error.message });
    }
  };
  
  // Patch the existing message handlers if possible
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    const originalSendMessage = chrome.runtime.sendMessage;
    chrome.runtime.sendMessage = function(message, responseCallback) {
      if (responseCallback && typeof responseCallback === 'function') {
        return sendRobustMessage(message, responseCallback);
      } else {
        return originalSendMessage.apply(chrome.runtime, arguments);
      }
    };
  }
  
  console.log('Message port communication fix applied');
  return true;
}

// Fix for video info error
function fixVideoInfoRetrieval() {
  // Create a more robust video info retrieval function
  window.getVideoInfoSafely = function(videoId, callback) {
    try {
      // Try multiple methods to get video info
      
      // Method 1: Use the YouTube API if available
      if (typeof YT !== 'undefined' && YT.Player) {
        try {
          const player = new YT.Player('player', {
            videoId: videoId,
            events: {
              'onReady': event => {
                const videoData = event.target.getVideoData();
                callback({
                  success: true,
                  title: videoData.title,
                  duration: event.target.getDuration(),
                  author: videoData.author
                });
              },
              'onError': event => {
                console.error('YouTube player error:', event);
                tryAlternativeMethods();
              }
            }
          });
          return;
        } catch (error) {
          console.warn('Failed to get video info using YouTube API:', error);
        }
      }
      
      // Method 2: Try to extract from the page
      function tryAlternativeMethods() {
        try {
          // Extract from page title
          const title = document.title.replace(' - YouTube', '');
          
          // Try to get duration from the player
          let duration = '0:00';
          const durationElement = document.querySelector('.ytp-time-duration');
          if (durationElement) {
            duration = durationElement.textContent;
          }
          
          callback({
            success: true,
            title: title,
            duration: duration,
            videoId: videoId
          });
        } catch (error) {
          console.error('Failed to extract video info from page:', error);
          
          // Method 3: Fallback to a minimal response
          callback({
            success: false,
            title: 'Unknown Video',
            duration: '0:00',
            videoId: videoId,
            error: error.message
          });
        }
      }
      
      tryAlternativeMethods();
    } catch (error) {
      console.error('Error in getVideoInfoSafely:', error);
      callback({
        success: false,
        error: error.message
      });
    }
  };
  
  console.log('Video info retrieval fix applied');
  return true;
}

// Apply all fixes
function applyAllFixes() {
  const results = {
    viralDetection: fixViralDetection(),
    clipboardAccess: fixClipboardAccess(),
    messagePortCommunication: fixMessagePortCommunication(),
    videoInfoRetrieval: fixVideoInfoRetrieval()
  };
  
  console.log('All fixes applied:', results);
  return results;
}

// Export the functions
window.ViralAIFixes = {
  fixViralDetection,
  fixClipboardAccess,
  fixMessagePortCommunication,
  fixVideoInfoRetrieval,
  applyAllFixes
};

// Auto-apply fixes if in extension context
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
  console.log('Detected extension context, auto-applying fixes...');
  applyAllFixes();
}
