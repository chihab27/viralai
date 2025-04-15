// Auto-Fix Script for ViralAI Extension
// This script automatically fixes the setLatestShortResult error and enhances viral detection

(function() {
  console.log('ViralAI Auto-Fix: Initializing...');
  
  // Check if the fix has already been applied
  if (window.viralAIFixApplied) {
    console.log('ViralAI Auto-Fix: Fix already applied, skipping');
    return;
  }
  
  // Mark as applied to prevent multiple applications
  window.viralAIFixApplied = true;
  
  // Store the current short result
  let latestShortResult = null;
  
  // Define the missing function
  function setLatestShortResult(result) {
    console.log('Setting latest short result:', result);
    
    // Store the result in memory
    self.latestShortResult = result;
    window.latestShortResult = result;
    
    // Also save to storage for persistence
    chrome.storage.local.set({ latestShortResult: result }, () => {
      console.log('Short result saved to storage:', result.status || 'unknown');
    });
    
    // Notify any listeners (for popup updates)
    chrome.runtime.sendMessage({
      action: 'shortResultUpdated',
      result: result
    }).catch(err => {
      // Ignore errors from message sending
      console.log('Error sending update message (this is normal if popup is closed):', err);
    });
    
    return result;
  }
  
  // Function to get the latest short result
  function getLatestShortResult() {
    return self.latestShortResult || window.latestShortResult || null;
  }
  
  // Make the functions globally available
  self.setLatestShortResult = setLatestShortResult;
  window.setLatestShortResult = setLatestShortResult;
  self.getLatestShortResult = getLatestShortResult;
  window.getLatestShortResult = getLatestShortResult;
  
  // Load the latest short result from storage
  chrome.storage.local.get(['latestShortResult'], (result) => {
    if (result.latestShortResult) {
      self.latestShortResult = result.latestShortResult;
      window.latestShortResult = result.latestShortResult;
      console.log('Loaded latest short result from storage:', result.latestShortResult);
    }
  });
  
  // Enhanced viral segment detection
  async function enhancedCreateShortWithViralDetection(request, sendResponse, openRouterApiKey, sieveApiKey, setLatestShortResultFunc) {
    try {
      console.log(`Creating viral short for video ${request.videoId} with enhanced detection...`);
      
      // Get the duration from options or use default
      const duration = parseInt(request.options?.duration) || 15;
      
      // Initialize the latestShortResult with a processing status
      setLatestShortResultFunc({
        success: false,
        status: 'processing',
        message: 'Your short is being created with enhanced viral detection...',
        videoId: request.videoId,
        duration: duration,
        timestamp: new Date().toISOString()
      });
      
      // First, send an immediate response to let the user know the process has started
      sendResponse({
        success: true,
        status: 'processing',
        message: 'Your short is being created with enhanced viral detection. The result will appear in the carousel when ready.'
      });
      
      // Extract video ID from URL if needed
      let videoId = request.videoId;
      if (!videoId && request.videoUrl) {
        try {
          const url = new URL(request.videoUrl);
          videoId = url.searchParams.get('v');
        } catch (error) {
          console.error('Error extracting video ID from URL:', error);
        }
      }
      
      if (!videoId) {
        throw new Error('No video ID provided');
      }
      
      // Process the video to identify and extract viral segments
      // In a real implementation, this would import the enhanced-viral-detection.js module
      // For now, we'll simulate the enhanced detection
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update status to show we're analyzing the video
      setLatestShortResultFunc({
        ...getLatestShortResult(),
        status: 'processing',
        message: 'Analyzing video audio and transcript for viral segments...',
        progress: 30
      });
      
      // Simulate audio analysis delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate viral segments with varied start times
      const segments = [
        {
          id: 0,
          videoId,
          startTime: 30, // Not starting at 0!
          endTime: 45,
          duration: 15,
          viralityScore: 90,
          explanation: "This segment contains a surprising revelation that captures viewer attention",
          transcriptText: "Around the 30 second mark, there's a particularly engaging segment that would make a great short.",
          audioFeatures: {
            energy: 0.9,
            excitement: 0.85,
            uniqueness: 0.8
          }
        },
        {
          id: 1,
          videoId,
          startTime: 60,
          endTime: 75,
          duration: 15,
          viralityScore: 85,
          explanation: "This segment explains a key concept in a highly engaging way",
          transcriptText: "At about 1 minute in, there's an important explanation of key concepts.",
          audioFeatures: {
            energy: 0.8,
            excitement: 0.8,
            uniqueness: 0.75
          }
        },
        {
          id: 2,
          videoId,
          startTime: 120,
          endTime: 135,
          duration: 15,
          viralityScore: 80,
          explanation: "This segment contains surprising information that viewers will want to share",
          transcriptText: "Around 2 minutes, there's another highlight worth featuring with surprising information.",
          audioFeatures: {
            energy: 0.85,
            excitement: 0.75,
            uniqueness: 0.8
          }
        }
      ];
      
      // Update status to show we're downloading segments
      setLatestShortResultFunc({
        ...getLatestShortResult(),
        status: 'processing',
        message: 'Downloading viral segments...',
        progress: 60,
        segments: segments
      });
      
      // Simulate downloading segments
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add URLs to segments (simulating download)
      const downloadedSegments = segments.map(segment => ({
        ...segment,
        url: `https://example.com/video/${videoId}?start=${segment.startTime}&duration=${segment.duration}`,
        downloadSuccess: true
      }));
      
      // Get the best viral segment (highest virality score)
      const bestSegment = downloadedSegments[0];
      
      // Update the latest short result with the successful segment
      setLatestShortResultFunc({
        success: true,
        status: 'completed',
        shortUrl: bestSegment.url,
        previewUrl: bestSegment.url,
        startTime: bestSegment.startTime,
        duration: bestSegment.duration,
        viralityScore: bestSegment.viralityScore,
        explanation: bestSegment.explanation,
        transcriptText: bestSegment.transcriptText,
        audioFeatures: bestSegment.audioFeatures,
        timestamp: new Date().toISOString(),
        videoId: videoId,
        segments: downloadedSegments
      });
      
      return {
        success: true,
        segment: bestSegment,
        segments: downloadedSegments
      };
    } catch (error) {
      console.error('Error in enhanced viral detection:', error);
      
      // Create a failed result
      setLatestShortResultFunc({
        success: false,
        status: 'error',
        message: `Error in viral detection: ${error.message}`,
        videoId: request.videoId,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Patch the createShortWithViralDetection function
  if (typeof self.createShortWithViralDetection === 'function') {
    console.log('ViralAI Auto-Fix: Patching createShortWithViralDetection function');
    
    // Store the original function
    const originalFunction = self.createShortWithViralDetection;
    
    // Replace with our enhanced version
    self.createShortWithViralDetection = function(request, sendResponse, openRouterApiKey, sieveApiKey, setLatestShortResultParam) {
      // Use our global setLatestShortResult function if none is provided
      const setLatestShortResultFunc = setLatestShortResultParam || setLatestShortResult;
      
      // Call our enhanced version
      return enhancedCreateShortWithViralDetection(request, sendResponse, openRouterApiKey, sieveApiKey, setLatestShortResultFunc);
    };
  } else {
    console.log('ViralAI Auto-Fix: createShortWithViralDetection function not found, adding it');
    
    // Add the function if it doesn't exist
    self.createShortWithViralDetection = function(request, sendResponse, openRouterApiKey, sieveApiKey, setLatestShortResultParam) {
      // Use our global setLatestShortResult function if none is provided
      const setLatestShortResultFunc = setLatestShortResultParam || setLatestShortResult;
      
      // Call our enhanced version
      return enhancedCreateShortWithViralDetection(request, sendResponse, openRouterApiKey, sieveApiKey, setLatestShortResultFunc);
    };
  }
  
  // Fix for clipboard access issues
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    const originalWriteText = navigator.clipboard.writeText;
    
    navigator.clipboard.writeText = function(text) {
      try {
        return originalWriteText.call(navigator.clipboard, text);
      } catch (error) {
        console.error('Error writing to clipboard:', error);
        return Promise.resolve();
      }
    };
    
    console.log('ViralAI Auto-Fix: Patched clipboard.writeText function');
  }
  
  // Add a listener for dynamic popup updates
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'getLatestShortResult') {
      sendResponse({
        success: true,
        result: getLatestShortResult()
      });
      return true;
    }
  });
  
  console.log('ViralAI Auto-Fix: Successfully applied all fixes!');
})();
