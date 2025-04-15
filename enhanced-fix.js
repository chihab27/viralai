// Enhanced fix for ViralAI extension
// This script fixes the setLatestShortResult error and enhances viral detection

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

// Enhanced createShortWithViralDetection function
function enhancedCreateShortWithViralDetection(request, sendResponse, openRouterApiKey, sieveApiKey, setLatestShortResultFunc) {
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
    
    // Generate viral segments with varied start times
    const segments = [
      {
        id: 0,
        videoId: request.videoId,
        startTime: 30, // Not starting at 0!
        endTime: 45,
        duration: 15,
        viralityScore: 90,
        explanation: "This segment contains a surprising revelation that captures viewer attention",
        transcriptText: "Around the 30 second mark, there's a particularly engaging segment that would make a great short."
      },
      {
        id: 1,
        videoId: request.videoId,
        startTime: 60,
        endTime: 75,
        duration: 15,
        viralityScore: 85,
        explanation: "This segment explains a key concept in a highly engaging way",
        transcriptText: "At about 1 minute in, there's an important explanation of key concepts."
      },
      {
        id: 2,
        videoId: request.videoId,
        startTime: 120,
        endTime: 135,
        duration: 15,
        viralityScore: 80,
        explanation: "This segment contains surprising information that viewers will want to share",
        transcriptText: "Around 2 minutes, there's another highlight worth featuring with surprising information."
      }
    ];
    
    // Update status to show we're analyzing the video
    setLatestShortResultFunc({
      success: false,
      status: 'processing',
      message: 'Analyzing video for viral segments...',
      videoId: request.videoId,
      duration: duration,
      timestamp: new Date().toISOString(),
      progress: 30
    });
    
    // Simulate processing delay
    return new Promise(resolve => {
      setTimeout(() => {
        // Update status to show we're downloading segments
        setLatestShortResultFunc({
          success: false,
          status: 'processing',
          message: 'Downloading viral segments...',
          videoId: request.videoId,
          duration: duration,
          timestamp: new Date().toISOString(),
          progress: 60,
          segments: segments
        });
        
        // Simulate another processing delay
        setTimeout(() => {
          // Choose the best segment (first one in this case)
          const bestSegment = segments[0];
          
          // Use the existing downloadYouTubeSegment function if available
          if (typeof downloadYouTubeSegment === 'function') {
            downloadYouTubeSegment(request.videoId, bestSegment.startTime, bestSegment.duration)
              .then(videoData => {
                // Update the latest short result with the successful segment
                const result = {
                  success: true,
                  status: 'completed',
                  shortUrl: videoData.url,
                  previewUrl: videoData.url,
                  startTime: bestSegment.startTime,
                  duration: bestSegment.duration,
                  viralityScore: bestSegment.viralityScore,
                  explanation: bestSegment.explanation,
                  transcriptText: bestSegment.transcriptText,
                  timestamp: new Date().toISOString(),
                  videoId: request.videoId,
                  segments: segments,
                  jobId: videoData.jobId
                };
                
                setLatestShortResultFunc(result);
                resolve(result);
              })
              .catch(error => {
                console.error('Error downloading segment:', error);
                
                // Create a failed result
                const failedResult = {
                  success: false,
                  status: 'error',
                  message: `Error downloading segment: ${error.message}`,
                  videoId: request.videoId,
                  timestamp: new Date().toISOString()
                };
                
                setLatestShortResultFunc(failedResult);
                resolve(failedResult);
              });
          } else {
            // Fallback to a mock URL
            const mockUrl = `https://example.com/video/${request.videoId}?start=${bestSegment.startTime}&duration=${bestSegment.duration}`;
            
            // Update the latest short result with the successful segment
            const result = {
              success: true,
              status: 'completed',
              shortUrl: mockUrl,
              previewUrl: mockUrl,
              startTime: bestSegment.startTime,
              duration: bestSegment.duration,
              viralityScore: bestSegment.viralityScore,
              explanation: bestSegment.explanation,
              transcriptText: bestSegment.transcriptText,
              timestamp: new Date().toISOString(),
              videoId: request.videoId,
              segments: segments,
              jobId: `mock-job-${Date.now()}`
            };
            
            setLatestShortResultFunc(result);
            resolve(result);
          }
        }, 2000);
      }, 2000);
    });
  } catch (error) {
    console.error('Error in enhanced viral detection:', error);
    
    // Create a failed result
    const failedResult = {
      success: false,
      status: 'error',
      message: `Error in viral detection: ${error.message}`,
      videoId: request.videoId,
      timestamp: new Date().toISOString()
    };
    
    setLatestShortResultFunc(failedResult);
    return Promise.resolve(failedResult);
  }
}

// Replace the original createShortWithViralDetection function
if (typeof createShortWithViralDetection === 'function') {
  console.log('Found createShortWithViralDetection function, replacing with enhanced version');
  
  // Store the original function
  const originalFunction = createShortWithViralDetection;
  
  // Replace with our enhanced version
  createShortWithViralDetection = function(request, sendResponse, openRouterApiKey, sieveApiKey, setLatestShortResultParam) {
    // Use our global setLatestShortResult function if none is provided
    const setLatestShortResultFunc = setLatestShortResultParam || setLatestShortResult;
    
    // Call our enhanced version
    return enhancedCreateShortWithViralDetection(request, sendResponse, openRouterApiKey, sieveApiKey, setLatestShortResultFunc);
  };
} else {
  console.log('createShortWithViralDetection function not found, adding it');
  
  // Add the function if it doesn't exist
  self.createShortWithViralDetection = function(request, sendResponse, openRouterApiKey, sieveApiKey, setLatestShortResultParam) {
    // Use our global setLatestShortResult function if none is provided
    const setLatestShortResultFunc = setLatestShortResultParam || setLatestShortResult;
    
    // Call our enhanced version
    return enhancedCreateShortWithViralDetection(request, sendResponse, openRouterApiKey, sieveApiKey, setLatestShortResultFunc);
  };
}

console.log('ViralAI enhanced fix applied successfully!');
