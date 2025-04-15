// Viral Segment Processor Module
// This module integrates viral segment detection with Sieve API for video processing

import { getVideoTranscript, downloadYouTubeSegment } from './sieve-api.js';
import { detectViralSegments } from './viral-segment-detector.js';

/**
 * Process a YouTube video to identify and extract viral segments
 * @param {string} videoId - The YouTube video ID
 * @param {Object} options - Options for viral segment processing
 * @param {string} openRouterApiKey - The OpenRouter API key
 * @param {string} sieveApiKey - The Sieve API key
 * @returns {Promise<Object>} - Object containing viral segments and video data
 */
async function processVideoForViralSegments(videoId, options, openRouterApiKey, sieveApiKey) {
  try {
    console.log(`Processing video ${videoId} for viral segments...`);
    
    // Step 1: Get the video transcript with timestamps
    console.log('Step 1: Getting video transcript...');
    const transcriptResult = await getVideoTranscript(videoId, sieveApiKey, true);
    
    if (!transcriptResult.success) {
      console.error('Failed to get transcript:', transcriptResult.error);
      return {
        success: false,
        error: `Failed to get transcript: ${transcriptResult.error}`,
        segments: [],
        videoId: videoId
      };
    }
    
    console.log('Successfully retrieved transcript with', 
      transcriptResult.segments.length, 'segments and duration', 
      transcriptResult.duration, 'seconds');
    
    // Step 2: Analyze the transcript to identify viral segments
    console.log('Step 2: Analyzing transcript for viral segments...');
    const viralSegmentsResult = await detectViralSegments(
      transcriptResult.transcript,
      videoId,
      options,
      openRouterApiKey
    );
    
    if (!viralSegmentsResult.success) {
      console.error('Failed to detect viral segments:', viralSegmentsResult.error);
      // Continue with fallback segments
    }
    
    const viralSegments = viralSegmentsResult.segments;
    console.log('Identified', viralSegments.length, 'viral segments');
    
    // Step 3: Enhance viral segments with transcript data
    console.log('Step 3: Enhancing viral segments with transcript data...');
    const enhancedSegments = enhanceSegmentsWithTranscriptData(
      viralSegments,
      transcriptResult.segments,
      options.duration || 15
    );
    
    // Step 4: Download the top viral segments
    console.log('Step 4: Downloading viral segments...');
    const downloadedSegments = await downloadViralSegments(
      videoId,
      enhancedSegments,
      sieveApiKey
    );
    
    return {
      success: true,
      segments: downloadedSegments,
      videoId: videoId,
      transcript: transcriptResult.transcript,
      duration: transcriptResult.duration
    };
  } catch (error) {
    console.error('Error processing video for viral segments:', error);
    return {
      success: false,
      error: error.message,
      segments: [],
      videoId: videoId
    };
  }
}

/**
 * Enhance viral segments with transcript data
 * @param {Array} viralSegments - The viral segments identified by AI
 * @param {Array} transcriptSegments - The transcript segments with timestamps
 * @param {number} targetDuration - Target duration in seconds
 * @returns {Array} - Enhanced viral segments
 */
function enhanceSegmentsWithTranscriptData(viralSegments, transcriptSegments, targetDuration) {
  console.log('Enhancing viral segments with transcript data...');
  
  if (!transcriptSegments || transcriptSegments.length === 0) {
    console.log('No transcript segments available for enhancement');
    return viralSegments;
  }
  
  return viralSegments.map(segment => {
    // Find transcript segments that overlap with this viral segment
    const overlappingSegments = transcriptSegments.filter(ts => 
      (ts.startTime >= segment.startTime && ts.startTime < segment.endTime) ||
      (ts.endTime > segment.startTime && ts.endTime <= segment.endTime) ||
      (ts.startTime <= segment.startTime && ts.endTime >= segment.endTime)
    );
    
    // Extract text from overlapping segments
    const transcriptText = overlappingSegments.map(ts => ts.text).join(' ');
    
    // Adjust segment boundaries if needed to align with transcript
    let adjustedStartTime = segment.startTime;
    let adjustedEndTime = segment.endTime;
    
    if (overlappingSegments.length > 0) {
      // Align with transcript segment boundaries if possible
      adjustedStartTime = Math.min(
        segment.startTime,
        ...overlappingSegments.map(ts => ts.startTime)
      );
      
      // Ensure the segment is exactly the target duration
      adjustedEndTime = adjustedStartTime + targetDuration;
    }
    
    return {
      ...segment,
      startTime: adjustedStartTime,
      endTime: adjustedEndTime,
      duration: targetDuration,
      transcriptText: transcriptText || segment.transcriptText || '',
      overlappingSegments: overlappingSegments.length
    };
  });
}

/**
 * Download viral segments using Sieve API
 * @param {string} videoId - The YouTube video ID
 * @param {Array} segments - The viral segments to download
 * @param {string} apiKey - The Sieve API key
 * @returns {Promise<Array>} - Downloaded viral segments
 */
async function downloadViralSegments(videoId, segments, apiKey) {
  console.log(`Downloading ${segments.length} viral segments for video ${videoId}...`);
  
  const downloadedSegments = [];
  
  // Process segments sequentially to avoid overwhelming the API
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    console.log(`Downloading segment ${i+1}/${segments.length} (${segment.startTime}s - ${segment.endTime}s)...`);
    
    try {
      const downloadResult = await downloadYouTubeSegment(
        videoId,
        segment.startTime,
        segment.duration,
        apiKey
      );
      
      if (downloadResult.success) {
        console.log(`Successfully downloaded segment ${i+1}`);
        downloadedSegments.push({
          ...segment,
          downloadSuccess: true,
          url: downloadResult.url,
          type: downloadResult.type || 'video'
        });
      } else {
        console.error(`Failed to download segment ${i+1}:`, downloadResult.error);
        downloadedSegments.push({
          ...segment,
          downloadSuccess: false,
          error: downloadResult.error,
          url: downloadResult.url, // This might be a thumbnail fallback
          type: downloadResult.type || 'error'
        });
      }
    } catch (error) {
      console.error(`Error downloading segment ${i+1}:`, error);
      downloadedSegments.push({
        ...segment,
        downloadSuccess: false,
        error: error.message,
        type: 'error'
      });
    }
    
    // Add a small delay between requests to avoid rate limiting
    if (i < segments.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return downloadedSegments;
}

/**
 * Get the best viral segment from a list of segments
 * @param {Array} segments - The viral segments
 * @returns {Object} - The best viral segment
 */
function getBestViralSegment(segments) {
  if (!segments || segments.length === 0) {
    return null;
  }
  
  // Sort by download success first, then by virality score
  const sortedSegments = [...segments].sort((a, b) => {
    if (a.downloadSuccess && !b.downloadSuccess) return -1;
    if (!a.downloadSuccess && b.downloadSuccess) return 1;
    return (b.viralityScore || 0) - (a.viralityScore || 0);
  });
  
  return sortedSegments[0];
}

// Export the functions
export { processVideoForViralSegments, getBestViralSegment };
