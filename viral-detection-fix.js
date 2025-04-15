// Viral detection module for ViralAI extension
// This module analyzes YouTube videos to identify viral-worthy segments

/**
 * Analyzes a YouTube video to identify viral-worthy segments
 * @param {string} videoId - The YouTube video ID
 * @param {Object} options - Options for the analysis
 * @param {Function} updateStatus - Function to update the status of the analysis
 * @returns {Promise<Object>} - The analysis result
 */
async function analyzeVideoForViralSegments(videoId, options, updateStatus) {
  try {
    if (typeof updateStatus !== 'function') {
      // Create a default update function if none provided
      updateStatus = (status) => console.log('Viral detection status:', status);
    }
    
    updateStatus({
      status: 'analyzing',
      message: 'Analyzing video for viral segments...'
    });
    
    // Get video transcript if available
    let transcript = '';
    try {
      transcript = await getVideoTranscript(videoId);
    } catch (error) {
      console.warn('Failed to get transcript, continuing without it:', error);
    }
    
    // Prepare the prompt for AI analysis
    const prompt = createAnalysisPrompt(videoId, transcript, options);
    
    // Call AI service to analyze the video
    const analysisResult = await callAIService(prompt, options.apiKey);
    
    // Process the AI response
    const segments = processAIResponse(analysisResult, videoId);
    
    // Return the viral segments
    return {
      success: true,
      videoId,
      segments,
      transcript
    };
  } catch (error) {
    console.error('Error in viral segment detection:', error);
    
    // Return default segments as fallback
    return {
      success: false,
      videoId,
      error: error.message,
      segments: getDefaultSegments(videoId)
    };
  }
}

/**
 * Creates a prompt for the AI service
 */
function createAnalysisPrompt(videoId, transcript, options) {
  return `
    Analyze this YouTube video (ID: ${videoId}) and identify the most viral-worthy segments.
    
    ${transcript ? 'Transcript:\n' + transcript : 'No transcript available.'}
    
    Identify 3 segments that would make great viral shorts. For each segment:
    1. Provide the start time (in seconds)
    2. Provide the end time (in seconds)
    3. Create a catchy caption
    
    Format your response as JSON:
    {
      "segments": [
        {
          "startTime": 30,
          "endTime": 45,
          "caption": "This shocking revelation will blow your mind!"
        },
        ...
      ]
    }
  `;
}

/**
 * Calls the AI service to analyze the video
 */
async function callAIService(prompt, apiKey) {
  // This is a simplified implementation
  // In a real extension, this would call OpenRouter or another AI service
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock response
  return {
    segments: [
      {
        startTime: 30,
        endTime: 45,
        caption: "This shocking revelation will blow your mind!"
      },
      {
        startTime: 60,
        endTime: 75,
        caption: "Wait for it... The unexpected twist!"
      },
      {
        startTime: 120,
        endTime: 135,
        caption: "You won't believe what happens next!"
      }
    ]
  };
}

/**
 * Processes the AI response to extract viral segments
 */
function processAIResponse(response, videoId) {
  // If the response already has segments, use them
  if (response && response.segments && Array.isArray(response.segments)) {
    return response.segments.map((segment, index) => ({
      id: index,
      videoId,
      startTime: segment.startTime || 30 + (index * 30),
      endTime: segment.endTime || (segment.startTime + 15) || 45 + (index * 30),
      caption: segment.caption || `Viral moment #${index + 1}`,
      score: 0.9 - (index * 0.1)
    }));
  }
  
  // Fallback to default segments
  return getDefaultSegments(videoId);
}

/**
 * Gets default viral segments for a video
 */
function getDefaultSegments(videoId) {
  return [
    {
      id: 0,
      videoId,
      startTime: 30,
      endTime: 45,
      caption: "This shocking revelation will blow your mind!",
      score: 0.9
    },
    {
      id: 1,
      videoId,
      startTime: 60,
      endTime: 75,
      caption: "Wait for it... The unexpected twist!",
      score: 0.8
    },
    {
      id: 2,
      videoId,
      startTime: 120,
      endTime: 135,
      caption: "You won't believe what happens next!",
      score: 0.7
    }
  ];
}

/**
 * Gets the transcript for a YouTube video
 */
async function getVideoTranscript(videoId) {
  // This is a simplified implementation
  // In a real extension, this would call a transcript API
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Return mock transcript
  return `
    This is a sample transcript for video ${videoId}.
    The video contains several interesting segments that would make great viral shorts.
    Around the 30 second mark, there's a surprising revelation.
    At about 1 minute in, there's an unexpected twist in the content.
    Near the 2 minute mark, something incredible happens that viewers won't expect.
  `;
}

// Export the functions
export { 
  analyzeVideoForViralSegments,
  getDefaultSegments
};
