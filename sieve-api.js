// Sieve API integration for YouTube video downloading
// This module handles all interactions with the Sieve YouTube Downloader API

/**
 * Download a complete YouTube video using Sieve API
 * @param {string} videoId - The YouTube video ID
 * @param {string} apiKey - The Sieve API key
 * @returns {Promise<Object>} - Object containing download URL and metadata
 */
async function downloadYouTubeVideo(videoId, apiKey) {
  try {
    console.log(`Downloading complete YouTube video ${videoId} using Sieve API...`);
    console.log('API Key provided:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');

    // Validate inputs
    if (!videoId) {
      console.error('No videoId provided to downloadYouTubeVideo');
      return { success: false, error: 'No video ID provided' };
    }

    if (!apiKey) {
      console.error('No API key provided to downloadYouTubeVideo');
      return { success: false, error: 'No Sieve API key provided' };
    }

    // Construct the API endpoint URL
    // Using the correct endpoint from the Sieve dashboard
    const apiUrl = 'https://mango.sievedata.com/v1/youtube_downloader';
    console.log('Using Sieve API endpoint:', apiUrl);

    // Prepare the request payload
    const payload = {
      video_url: `https://www.youtube.com/watch?v=${videoId}`,
      format: 'mp4',
      quality: 'highest'
    };
    console.log('Request payload:', JSON.stringify(payload));

    // Make the API request
    console.log('Sending request to Sieve API...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(payload)
    });

    console.log('Received response from Sieve API. Status:', response.status);

    // Check if the request was successful
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = `Sieve API error: ${errorData.message || errorData.error || response.statusText}`;
        console.error('Error response body:', errorData);
      } catch (jsonError) {
        console.error('Could not parse error response as JSON:', jsonError);
        errorMessage += ` (${response.statusText})`;
      }
      throw new Error(errorMessage);
    }

    // Parse the response
    console.log('Parsing response body...');
    const data = await response.json();
    console.log('Response data received:', data);

    // Return the download URL and metadata
    return {
      success: true,
      url: data.download_url,
      metadata: {
        title: data.title,
        duration: data.duration,
        format: data.format,
        resolution: data.resolution
      }
    };
  } catch (error) {
    console.error('Error downloading YouTube video with Sieve API:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Download a specific segment of a YouTube video using Sieve API
 * @param {string} videoId - The YouTube video ID
 * @param {number} startTime - Start time in seconds
 * @param {number} duration - Duration in seconds
 * @param {string} apiKey - The Sieve API key
 * @returns {Promise<Object>} - Object containing download URL and metadata
 */
async function downloadYouTubeSegment(videoId, startTime, duration, apiKey) {
  try {
    console.log(`Downloading segment of YouTube video ${videoId} from ${startTime}s for ${duration}s using Sieve API...`);
    console.log('API Key provided:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');

    // Validate inputs
    if (!videoId) {
      console.error('No videoId provided to downloadYouTubeSegment');
      return {
        success: false,
        error: 'No video ID provided',
        type: 'thumbnail',
        url: `https://img.youtube.com/vi/default/0.jpg`,
        startTime: startTime || 0,
        duration: duration || 15
      };
    }

    if (!apiKey) {
      console.error('No API key provided to downloadYouTubeSegment');
      return {
        success: false,
        error: 'No Sieve API key provided',
        type: 'thumbnail',
        url: `https://img.youtube.com/vi/${videoId}/0.jpg`,
        startTime: startTime || 0,
        duration: duration || 15
      };
    }

    // Construct the API endpoint URL
    // Using the correct endpoint from the Sieve dashboard
    const apiUrl = 'https://mango.sievedata.com/v1/youtube_downloader';
    console.log('Using Sieve API endpoint:', apiUrl);

    // Calculate end time
    const endTime = startTime + duration;

    // Prepare the request payload
    const payload = {
      video_url: `https://www.youtube.com/watch?v=${videoId}`,
      format: 'mp4',
      quality: 'highest',
      start_time: startTime,
      end_time: endTime
    };
    console.log('Request payload:', JSON.stringify(payload));

    // Make the API request
    console.log('Sending request to Sieve API...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(payload)
    });

    console.log('Received response from Sieve API. Status:', response.status);

    // Check if the request was successful
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = `Sieve API error: ${errorData.message || errorData.error || response.statusText}`;
        console.error('Error response body:', errorData);
      } catch (jsonError) {
        console.error('Could not parse error response as JSON:', jsonError);
        errorMessage += ` (${response.statusText})`;
      }
      throw new Error(errorMessage);
    }

    // Parse the response
    console.log('Parsing response body...');
    const data = await response.json();
    console.log('Response data received:', data);

    // Return the download URL and metadata
    return {
      success: true,
      url: data.download_url,
      type: 'video',
      startTime: startTime,
      duration: duration,
      metadata: {
        title: data.title,
        format: data.format,
        resolution: data.resolution
      }
    };
  } catch (error) {
    console.error('Error downloading YouTube segment with Sieve API:', error);

    // If the API call fails, fall back to the thumbnail approach
    console.log('Falling back to thumbnail approach...');

    // Get high-quality thumbnails from the video
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    // Check if the high-quality thumbnail exists
    const thumbnailExists = await checkImageExists(thumbnailUrl);

    // If high-quality thumbnail doesn't exist, fall back to standard quality
    const finalThumbnailUrl = thumbnailExists ?
      thumbnailUrl :
      `https://img.youtube.com/vi/${videoId}/0.jpg`;

    return {
      success: false,
      type: 'thumbnail',
      url: finalThumbnailUrl,
      startTime: startTime,
      duration: duration,
      error: error.message
    };
  }
}

/**
 * Check if an image exists by attempting to load it
 * @param {string} url - The image URL to check
 * @returns {Promise<boolean>} - Whether the image exists
 */
async function checkImageExists(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Get the transcript of a YouTube video using Sieve API
 * @param {string} videoId - The YouTube video ID
 * @param {string} apiKey - The Sieve API key
 * @param {boolean} withTimestamps - Whether to include timestamps in the response
 * @returns {Promise<Object>} - Object containing the transcript and metadata
 */
async function getVideoTranscript(videoId, apiKey, withTimestamps = true) {
  try {
    console.log(`Getting transcript for video ${videoId} using Sieve API...`);
    console.log('API Key provided:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');

    // Validate inputs
    if (!videoId) {
      console.error('No videoId provided to getVideoTranscript');
      return {
        success: false,
        error: 'No video ID provided',
        transcript: `No video ID provided for transcript generation.`,
        rawTranscript: null,
        segments: []
      };
    }

    if (!apiKey) {
      console.error('No API key provided to getVideoTranscript');
      return {
        success: false,
        error: 'No API key provided',
        transcript: `API key not available for transcript generation.`,
        rawTranscript: null,
        segments: []
      };
    }

    // Construct the API endpoint URL
    // Using the correct endpoint from the Sieve dashboard
    const apiUrl = 'https://mango.sievedata.com/v1/youtube_downloader/transcript';
    console.log('Using Sieve API endpoint for transcript:', apiUrl);

    // Prepare the request payload
    const payload = {
      video_url: `https://www.youtube.com/watch?v=${videoId}`,
      include_timestamps: withTimestamps
    };
    console.log('Transcript request payload:', JSON.stringify(payload));

    // Make the API request
    console.log('Sending transcript request to Sieve API...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(payload)
    });

    console.log('Received transcript response from Sieve API. Status:', response.status);

    // Check if the request was successful
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = `Sieve API error: ${errorData.message || errorData.error || response.statusText}`;
        console.error('Error response body for transcript:', errorData);
      } catch (jsonError) {
        console.error('Could not parse transcript error response as JSON:', jsonError);
        errorMessage += ` (${response.statusText})`;
      }
      throw new Error(errorMessage);
    }

    // Parse the response
    console.log('Parsing transcript response body...');
    const data = await response.json();
    console.log('Transcript data received, length:', data.transcript ? data.transcript.length : 'N/A');

    // Process the transcript data
    const processedData = processTranscriptData(data, videoId);

    return {
      success: true,
      transcript: processedData.transcript,
      rawTranscript: data,
      segments: processedData.segments,
      duration: processedData.duration,
      language: processedData.language || 'en'
    };
  } catch (error) {
    console.error('Error getting video transcript with Sieve API:', error);

    // If the API call fails, return a mock transcript
    console.log('Returning mock transcript...');
    const mockTranscript = `This is a mock transcript for video ${videoId}. The actual transcript could not be retrieved due to an error: ${error.message}`;

    return {
      success: false,
      error: error.message,
      transcript: mockTranscript,
      rawTranscript: null,
      segments: [],
      duration: 0,
      language: 'en'
    };
  }
}

/**
 * Process transcript data to extract segments and metadata
 * @param {Object} data - The raw transcript data from Sieve API
 * @param {string} videoId - The YouTube video ID
 * @returns {Object} - Processed transcript data
 */
function processTranscriptData(data, videoId) {
  try {
    console.log('Processing transcript data...');

    // Default values
    let transcript = data.transcript || `No transcript available for video ${videoId}.`;
    let segments = [];
    let duration = 0;
    let language = 'en';

    // Check if we have timestamp data
    if (data.segments && Array.isArray(data.segments) && data.segments.length > 0) {
      console.log(`Found ${data.segments.length} transcript segments with timestamps`);

      // Extract segments with timestamps
      segments = data.segments.map(segment => ({
        startTime: segment.start || 0,
        endTime: segment.end || 0,
        duration: (segment.end || 0) - (segment.start || 0),
        text: segment.text || ''
      }));

      // Calculate total duration from the last segment's end time
      if (segments.length > 0) {
        duration = segments[segments.length - 1].endTime;
      }

      // Reconstruct the full transcript with timestamps
      transcript = segments.map(segment =>
        `[${formatTimestamp(segment.startTime)} - ${formatTimestamp(segment.endTime)}] ${segment.text}`
      ).join('\n');
    }

    // Extract language if available
    if (data.language) {
      language = data.language;
    }

    return {
      transcript,
      segments,
      duration,
      language
    };
  } catch (error) {
    console.error('Error processing transcript data:', error);
    return {
      transcript: data.transcript || `No transcript available for video ${videoId}.`,
      segments: [],
      duration: 0,
      language: 'en'
    };
  }
}

/**
 * Format a timestamp in seconds to a readable format (MM:SS)
 * @param {number} seconds - The timestamp in seconds
 * @returns {string} - Formatted timestamp
 */
function formatTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Test the Sieve API connection
 * @param {string} apiKey - The Sieve API key
 * @returns {Promise<Object>} - Object containing connection status
 */
async function testSieveConnection(apiKey) {
  try {
    console.log('Testing Sieve API connection...');
    console.log('API Key provided:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');

    if (!apiKey) {
      return { success: false, error: 'No API key provided' };
    }

    // Use a simple endpoint to test the connection
    const apiUrl = 'https://mango.sievedata.com/v1/youtube_downloader/ping';
    console.log('Testing connection to:', apiUrl);

    // Make a simple request
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      }
    });

    console.log('Test response status:', response.status);

    // Check if the request was successful
    if (response.ok) {
      return {
        success: true,
        message: 'Successfully connected to Sieve API',
        status: response.status
      };
    } else {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || response.statusText;
      } catch (jsonError) {
        console.error('Could not parse error response as JSON:', jsonError);
      }

      return {
        success: false,
        error: errorMessage,
        status: response.status
      };
    }
  } catch (error) {
    console.error('Error testing Sieve API connection:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

// Export the functions
export { downloadYouTubeVideo, downloadYouTubeSegment, getVideoTranscript, testSieveConnection };
