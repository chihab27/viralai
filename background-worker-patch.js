// Patch for background-worker.js to fix the viral detection feature

// Store the current short result
let latestShortResult = null;

// Function to set the latest short result
function setLatestShortResult(result) {
  latestShortResult = result;
  
  // Also save to storage for persistence
  chrome.storage.local.set({ latestShortResult: result }, () => {
    console.log('Short result saved to storage:', result.status || 'unknown');
  });
  
  return result;
}

// Function to get the latest short result
function getLatestShortResult() {
  return latestShortResult;
}

// Function to load the latest short result from storage
async function loadLatestShortResult() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['latestShortResult'], (result) => {
      latestShortResult = result.latestShortResult || null;
      console.log('Loaded latest short result from storage:', latestShortResult);
      resolve(latestShortResult);
    });
  });
}

// Fixed function to create a short with viral detection
async function createShortWithViralDetection(videoId, options) {
  try {
    console.log('Using viral segment detection to create short');
    
    // Update status to processing
    setLatestShortResult({
      success: false,
      status: 'processing',
      message: 'Your short is being created. This may take a few minutes.',
      videoId,
      startTime: 0,
      duration: options.duration || 15
    });
    
    // Import the viral detection module
    const { analyzeVideoForViralSegments } = await import('./viral-detection-fix.js');
    
    // Analyze the video for viral segments
    const analysisResult = await analyzeVideoForViralSegments(videoId, options, (status) => {
      // Update status during analysis
      setLatestShortResult({
        ...getLatestShortResult(),
        ...status
      });
    });
    
    // If analysis failed, throw an error
    if (!analysisResult.success) {
      throw new Error(analysisResult.error || 'Failed to analyze video');
    }
    
    // Get the best segment
    const bestSegment = analysisResult.segments[0];
    
    // Download the segment using Sieve API
    const videoUrl = await downloadVideoSegment(
      videoId, 
      bestSegment.startTime, 
      bestSegment.endTime - bestSegment.startTime
    );
    
    // Update the result with the video URL
    const result = {
      success: true,
      status: 'completed',
      videoId,
      url: videoUrl,
      startTime: bestSegment.startTime,
      endTime: bestSegment.endTime,
      duration: bestSegment.endTime - bestSegment.startTime,
      caption: bestSegment.caption,
      segments: analysisResult.segments
    };
    
    // Save and return the result
    return setLatestShortResult(result);
  } catch (error) {
    console.error('Error in viral detection:', error);
    
    // Update status to error
    setLatestShortResult({
      ...getLatestShortResult(),
      success: false,
      status: 'error',
      message: `Error: ${error.message}`
    });
    
    // Re-throw the error for the caller to handle
    throw error;
  }
}

// Helper function to download a video segment
async function downloadVideoSegment(videoId, startTime, duration) {
  // This would call the Sieve API to download the segment
  // For now, just return a mock URL
  return `https://example.com/video/${videoId}?start=${startTime}&duration=${duration}`;
}

// Export the functions
export {
  setLatestShortResult,
  getLatestShortResult,
  loadLatestShortResult,
  createShortWithViralDetection
};
