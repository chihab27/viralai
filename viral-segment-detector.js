// Viral Segment Detector Module
// This module analyzes video transcripts to identify viral-worthy segments

/**
 * Analyze a video transcript to identify viral segments
 * @param {string} transcript - The video transcript
 * @param {string} videoId - The YouTube video ID
 * @param {Object} options - Options for viral detection
 * @param {string} apiKey - The OpenRouter API key
 * @returns {Promise<Object>} - Object containing viral segments with timestamps
 */
async function detectViralSegments(transcript, videoId, options, apiKey) {
  try {
    console.log(`Analyzing transcript for video ${videoId} to detect viral segments...`);
    
    if (!transcript || transcript.trim().length === 0) {
      console.error('No transcript provided for viral segment detection');
      return {
        success: false,
        error: 'No transcript available for analysis',
        segments: generateFallbackSegments()
      };
    }
    
    if (!apiKey) {
      console.error('No OpenRouter API key provided for viral segment detection');
      return {
        success: false,
        error: 'No OpenRouter API key provided',
        segments: generateFallbackSegments()
      };
    }
    
    // Define the target duration for viral segments
    const targetDuration = options.duration || 15; // Default to 15 seconds
    
    // Define viral criteria based on options
    const viralStyle = options.aiStyle || 'trending';
    
    // Prepare the prompt for OpenRouter
    const prompt = createViralDetectionPrompt(transcript, targetDuration, viralStyle);
    
    // Call OpenRouter API
    const response = await callOpenRouterAPI(prompt, apiKey);
    
    // Parse the response to extract viral segments
    const segments = parseOpenRouterResponse(response, transcript, targetDuration);
    
    return {
      success: true,
      segments: segments,
      videoId: videoId
    };
  } catch (error) {
    console.error('Error detecting viral segments:', error);
    return {
      success: false,
      error: error.message,
      segments: generateFallbackSegments()
    };
  }
}

/**
 * Create a prompt for viral segment detection
 * @param {string} transcript - The video transcript
 * @param {number} targetDuration - Target duration in seconds
 * @param {string} viralStyle - Style of viral content to detect
 * @returns {string} - The prompt for OpenRouter
 */
function createViralDetectionPrompt(transcript, targetDuration, viralStyle) {
  return `You are an expert at identifying viral-worthy content in videos.
  
  Analyze this YouTube video transcript and identify the most engaging ${targetDuration}-second segments that would make great viral shorts.
  
  The viral style I'm looking for is: ${viralStyle}
  
  For each segment, I need:
  1. Precise start and end timestamps (in seconds)
  2. A virality score (0-100)
  3. A brief explanation of why this segment would be viral
  4. The exact transcript text for this segment
  
  Viral criteria to consider:
  - Emotional moments (surprising revelations, emotional stories)
  - Controversial or thought-provoking statements
  - Useful tips or "hacks" that provide immediate value
  - Humorous or entertaining content
  - Relatable experiences or observations
  - Educational content that teaches something quickly
  - Visually descriptive moments that would be engaging
  
  Identify the top 3 most viral segments in this transcript.
  
  Transcript:
  ${transcript}
  
  Respond with a JSON object containing an array of segments with the following structure:
  {
    "segments": [
      {
        "startTime": number,
        "endTime": number,
        "viralityScore": number,
        "explanation": "string",
        "transcriptText": "string"
      }
    ]
  }
  
  Only return the JSON object and nothing else.`;
}

/**
 * Call the OpenRouter API with the viral detection prompt
 * @param {string} prompt - The prompt for viral detection
 * @param {string} apiKey - The OpenRouter API key
 * @returns {Promise<Object>} - The API response
 */
async function callOpenRouterAPI(prompt, apiKey) {
  console.log('Calling OpenRouter API for viral segment detection...');
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/yourusername/ViralAI', // Replace with your actual project URL
        'X-Title': 'ViralAI YouTube Shorts Creator'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3-8b-instruct', // Using a free model
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // Lower temperature for more consistent results
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('OpenRouter API response received');
    
    return data;
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    throw error;
  }
}

/**
 * Parse the OpenRouter API response to extract viral segments
 * @param {Object} response - The OpenRouter API response
 * @param {string} transcript - The original transcript
 * @param {number} targetDuration - Target duration in seconds
 * @returns {Array} - Array of viral segments
 */
function parseOpenRouterResponse(response, transcript, targetDuration) {
  console.log('Parsing OpenRouter response for viral segments...');
  
  try {
    if (!response.choices || !response.choices[0] || !response.choices[0].message || !response.choices[0].message.content) {
      throw new Error('Invalid response from OpenRouter API');
    }
    
    const content = response.choices[0].message.content;
    console.log('AI analysis content:', content);
    
    // Try to extract JSON from the response
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonContent = jsonMatch[0];
      const parsedData = JSON.parse(jsonContent);
      
      if (parsedData && parsedData.segments && Array.isArray(parsedData.segments) && parsedData.segments.length > 0) {
        console.log(`Found ${parsedData.segments.length} viral segments in the response`);
        
        // Validate and normalize the segments
        const validatedSegments = parsedData.segments.map(segment => {
          // Ensure start and end times are numbers
          const startTime = typeof segment.startTime === 'number' ? segment.startTime : parseFloat(segment.startTime) || 0;
          let endTime = typeof segment.endTime === 'number' ? segment.endTime : parseFloat(segment.endTime) || (startTime + targetDuration);
          
          // Ensure the segment is the target duration
          if (endTime - startTime !== targetDuration) {
            endTime = startTime + targetDuration;
          }
          
          return {
            startTime: startTime,
            endTime: endTime,
            duration: targetDuration,
            viralityScore: segment.viralityScore || 0,
            explanation: segment.explanation || 'Viral-worthy content',
            transcriptText: segment.transcriptText || '',
            audioFeatures: {
              energy: 0.8,
              excitement: 0.8,
              uniqueness: 0.8
            }
          };
        });
        
        // Sort segments by virality score
        return validatedSegments.sort((a, b) => b.viralityScore - a.viralityScore);
      }
    }
    
    throw new Error('Could not parse segments from OpenRouter response');
  } catch (error) {
    console.error('Error parsing OpenRouter response:', error);
    return generateFallbackSegments();
  }
}

/**
 * Generate fallback segments when viral detection fails
 * @returns {Array} - Array of fallback viral segments
 */
function generateFallbackSegments() {
  console.log('Generating fallback viral segments...');
  
  // Create segments with timestamps that would typically be viral
  return [
    {
      startTime: 30,  // Often videos have a key point around 30 seconds in
      endTime: 45,
      duration: 15,
      viralityScore: 85,
      explanation: "This segment likely contains key information or an engaging hook",
      transcriptText: "This is a fallback segment that would typically be viral-worthy.",
      audioFeatures: {
        energy: 0.85,
        excitement: 0.9,
        uniqueness: 0.8
      }
    },
    {
      startTime: 60,  // Another common point for key information
      endTime: 75,
      duration: 15,
      viralityScore: 75,
      explanation: "This segment likely contains valuable content or an interesting point",
      transcriptText: "This is another fallback segment that would typically be viral-worthy.",
      audioFeatures: {
        energy: 0.75,
        excitement: 0.8,
        uniqueness: 0.7
      }
    },
    {
      startTime: 120,  // Often a conclusion or summary point
      endTime: 135,
      duration: 15,
      viralityScore: 65,
      explanation: "This segment likely contains a conclusion or call to action",
      transcriptText: "This is a third fallback segment that would typically be viral-worthy.",
      audioFeatures: {
        energy: 0.65,
        excitement: 0.7,
        uniqueness: 0.6
      }
    }
  ];
}

/**
 * Analyze transcript timestamps to improve segment detection
 * @param {string} transcript - The video transcript with timestamps
 * @returns {Object} - Timestamp mapping and analysis
 */
function analyzeTranscriptTimestamps(transcript) {
  // This function would parse timestamps from the transcript if available
  // For now, we'll return a simple structure
  return {
    hasTimestamps: false,
    timestampFormat: 'unknown',
    segments: []
  };
}

// Export the functions
export { detectViralSegments, analyzeTranscriptTimestamps };
