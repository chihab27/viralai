// Viral Segment Integration Module
// This module integrates the viral segment processor with the background worker

import { processVideoForViralSegments, getBestViralSegment } from './viral-segment-processor.js';

/**
 * Create a short video using viral segment detection
 * @param {Object} request - The request object from the popup
 * @param {Function} sendResponse - Function to send response back to popup
 * @param {string} openRouterApiKey - The OpenRouter API key
 * @param {string} sieveApiKey - The Sieve API key
 * @param {Function} setLatestShortResult - Function to set and save the latest short result
 * @returns {Promise<void>}
 */
async function createShortWithViralDetection(request, sendResponse, openRouterApiKey, sieveApiKey, setLatestShortResult) {
  try {
    console.log(`Creating viral short for video ${request.videoId} with options:`, request.options);
    
    // Get the duration from options or use default
    const duration = parseInt(request.options?.duration) || 15;
    
    // Initialize the latestShortResult with a processing status
    setLatestShortResult({
      success: false,
      status: 'processing',
      message: 'Your short is being created. This may take a few minutes.',
      videoId: request.videoId,
      duration: duration,
      timestamp: new Date().toISOString()
    });
    
    // First, send an immediate response to let the user know the process has started
    sendResponse({
      success: true,
      status: 'processing',
      message: 'Your short is being created. This may take a few minutes. The result will appear in the carousel when ready.'
    });
    
    // Process the video to identify and extract viral segments
    const result = await processVideoForViralSegments(
      request.videoId,
      request.options,
      openRouterApiKey,
      sieveApiKey
    );
    
    console.log('Viral segment processing result:', result);
    
    if (result.success && result.segments && result.segments.length > 0) {
      // Get the best viral segment
      const bestSegment = getBestViralSegment(result.segments);
      
      if (bestSegment && bestSegment.url) {
        console.log('Best viral segment:', bestSegment);
        
        // Update the latest short result with the successful segment
        setLatestShortResult({
          success: true,
          shortUrl: bestSegment.url,
          previewUrl: bestSegment.url,
          startTime: bestSegment.startTime,
          duration: bestSegment.duration,
          viralityScore: bestSegment.viralityScore,
          explanation: bestSegment.explanation,
          transcriptText: bestSegment.transcriptText,
          timestamp: new Date().toISOString(),
          videoId: request.videoId,
          jobId: bestSegment.jobId
        });
        
        return {
          success: true,
          segment: bestSegment
        };
      } else {
        // No URL found in the best segment
        console.error('No URL found in the best segment');
        
        setLatestShortResult({
          success: false,
          status: 'error',
          error: 'No URL found in the best segment',
          segments: result.segments,
          timestamp: new Date().toISOString(),
          videoId: request.videoId
        });
        
        return {
          success: false,
          error: 'No URL found in the best segment',
          segments: result.segments
        };
      }
    } else {
      // Failed to process viral segments
      console.error('Failed to process viral segments:', result.error);
      
      setLatestShortResult({
        success: false,
        status: 'error',
        error: result.error || 'Failed to process viral segments',
        timestamp: new Date().toISOString(),
        videoId: request.videoId
      });
      
      return {
        success: false,
        error: result.error || 'Failed to process viral segments'
      };
    }
  } catch (error) {
    console.error('Error creating short with viral detection:', error);
    
    setLatestShortResult({
      success: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
      videoId: request.videoId
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

export { createShortWithViralDetection };
