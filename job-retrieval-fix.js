// Job Retrieval Fix for ViralAI Extension
// This script fixes the issue with job results not being retrieved

(function() {
  console.log('ViralAI Job Retrieval Fix: Initializing...');
  
  // Check if the fix has already been applied
  if (window.jobRetrievalFixApplied) {
    console.log('ViralAI Job Retrieval Fix: Fix already applied, skipping');
    return;
  }
  
  // Mark as applied to prevent multiple applications
  window.jobRetrievalFixApplied = true;
  
  // Store the original pollJobStatus function if it exists
  const originalPollJobStatus = self.pollJobStatus;
  
  // Enhanced pollJobStatus function with improved URL extraction
  async function enhancedPollJobStatus(jobId, apiKey, maxAttempts = 120, delayMs = 5000) {
    console.log(`Enhanced polling job status for job ID: ${jobId}`);
  
    const jobUrl = `https://mango.sievedata.com/v2/jobs/${jobId}`;
  
    // Create a progress indicator for the console
    let progressIndicator = '';
    let lastStatus = '';
    let consecutiveCompletedWithoutUrl = 0;
    
    // Store the raw response for debugging
    let lastRawResponse = null;
  
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      progressIndicator = '.'.repeat(attempt % 10);
      console.log(`Polling attempt ${attempt + 1}/${maxAttempts} ${progressIndicator}`);
  
      try {
        const response = await fetch(jobUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          }
        });
  
        if (!response.ok) {
          console.error(`Error polling job status: HTTP ${response.status}`);
          // Increase delay for server errors to avoid rate limiting
          const errorDelay = response.status >= 500 ? delayMs * 2 : delayMs;
          await new Promise(resolve => setTimeout(resolve, errorDelay));
          continue;
        }
  
        // Store the raw response text for debugging
        const rawResponseText = await response.text();
        
        // Try to parse the response as JSON
        let jobData;
        try {
          jobData = JSON.parse(rawResponseText);
          lastRawResponse = rawResponseText;
        } catch (parseError) {
          console.error('Error parsing job status response:', parseError);
          console.log('Raw response:', rawResponseText);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        
        console.log(`Job status: ${jobData.status}`, jobData);
  
        // Check if the status has changed
        if (jobData.status !== lastStatus) {
          console.log(`Status changed from ${lastStatus || 'initial'} to ${jobData.status}`);
          lastStatus = jobData.status;
        }
  
        // Add the raw response to the job data for debugging
        jobData.rawResponse = rawResponseText;
  
        // If the job is completed, check if we have the video URL
        if (jobData.status === 'completed') {
          // First, try to extract URL from the raw response
          let extractedUrl = extractUrlFromRawResponse(rawResponseText);
          if (extractedUrl) {
            console.log('Extracted URL from raw response:', extractedUrl);
            jobData.URL = extractedUrl;
            jobData.outputUrl = extractedUrl;
            return jobData;
          }
          
          // Check if we have a URL in the outputs.data.url structure (as per documentation)
          if (jobData.outputUrl) {
            console.log('Found video URL in outputs.data.url:', jobData.outputUrl);
            return jobData;
          }
          
          // Check if we have outputs with a URL in the traditional structure
          if (jobData.outputs && jobData.outputs.output_0) {
            const outputData = jobData.outputs.output_0;
            
            // Check for direct URL properties
            if (outputData.url) {
              console.log('Found video URL in output_0.url:', outputData.url);
              jobData.URL = outputData.url;
              jobData.outputUrl = outputData.url;
              return jobData;
            } else if (outputData.video_url) {
              console.log('Found video URL in output_0.video_url:', outputData.video_url);
              jobData.URL = outputData.video_url;
              jobData.outputUrl = outputData.video_url;
              return jobData;
            }
            
            // Check for URL in data object
            if (outputData.data) {
              if (typeof outputData.data === 'string') {
                try {
                  const dataObj = JSON.parse(outputData.data);
                  if (dataObj.url) {
                    console.log('Found video URL in output_0.data.url:', dataObj.url);
                    jobData.URL = dataObj.url;
                    jobData.outputUrl = dataObj.url;
                    return jobData;
                  }
                } catch (e) {
                  // Not JSON, check if it's a URL itself
                  if (outputData.data.startsWith('http') && 
                      (outputData.data.includes('.mp4') || 
                       outputData.data.includes('storage.googleapis.com'))) {
                    console.log('Found video URL in output_0.data:', outputData.data);
                    jobData.URL = outputData.data;
                    jobData.outputUrl = outputData.data;
                    return jobData;
                  }
                }
              } else if (typeof outputData.data === 'object' && outputData.data !== null) {
                if (outputData.data.url) {
                  console.log('Found video URL in output_0.data.url:', outputData.data.url);
                  jobData.URL = outputData.data.url;
                  jobData.outputUrl = outputData.data.url;
                  return jobData;
                }
                
                // Check all properties of data object
                for (const key in outputData.data) {
                  if (typeof outputData.data[key] === 'string' && 
                      outputData.data[key].startsWith('http') && 
                      (outputData.data[key].includes('.mp4') || 
                       outputData.data[key].includes('storage.googleapis.com'))) {
                    console.log(`Found video URL in output_0.data.${key}:`, outputData.data[key]);
                    jobData.URL = outputData.data[key];
                    jobData.outputUrl = outputData.data[key];
                    return jobData;
                  }
                }
              }
            }
            
            // Check all string properties of output_0
            for (const key in outputData) {
              if (typeof outputData[key] === 'string') {
                const value = outputData[key];
                // Check if the string looks like a URL
                if (value.startsWith('http') &&
                    (value.includes('.mp4') ||
                     value.includes('storage.googleapis.com') ||
                     value.includes('sieve-prod-us-central1-persistent-bucket'))) {
                  console.log(`Found video URL in output_0.${key}:`, value);
                  jobData.URL = value;
                  jobData.outputUrl = value;
                  return jobData;
                }
              }
            }
          }
          
          // Check if we have a URL in the job data (from the raw response extraction)
          if (jobData.URL) {
            console.log('Using URL extracted from raw response');
            jobData.outputUrl = jobData.URL;
            return jobData;
          }
          
          // If the job is marked as completed but we don't have a URL yet,
          // continue polling a few more times
          console.log('Job marked as completed but no video URL found yet. Continuing to poll...');
          consecutiveCompletedWithoutUrl++;
  
          // If we've seen 'completed' status multiple times but still no URL,
          // it might be that the URL is in a different response or format
          if (consecutiveCompletedWithoutUrl >= 5) {
            console.log('Job has been completed for several polls but no URL found. Returning anyway.');
            
            // Try one more time to extract URL from raw response
            let extractedUrl = extractUrlFromRawResponse(rawResponseText);
            if (extractedUrl) {
              console.log('Last attempt: Extracted URL from raw response:', extractedUrl);
              jobData.URL = extractedUrl;
              jobData.outputUrl = extractedUrl;
            }
            
            return jobData;
          }
        } else if (jobData.status === 'failed') {
          throw new Error(`Job failed: ${jobData.error || 'Unknown error'}`);
        } else if (jobData.status === 'running' && jobData.progress) {
          // If we have progress information, log it
          console.log(`Job progress: ${jobData.progress * 100}%`);
        }
  
        // Adaptive delay based on status
        let adaptiveDelay = delayMs;
        if (jobData.status === 'queued') {
          adaptiveDelay = delayMs * 1.5; // Wait longer if queued
        } else if (jobData.status === 'completed') {
          adaptiveDelay = delayMs * 0.5; // Poll faster if completed but waiting for URL
        }
  
        // Wait before the next polling attempt
        await new Promise(resolve => setTimeout(resolve, adaptiveDelay));
      } catch (error) {
        console.error('Error polling job status:', error);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  
    // If we've reached the maximum attempts but the job might still be running,
    // return a special error that includes the job ID so we can check it later
    return {
      success: false,
      error: `Job is taking longer than expected. Job ID: ${jobId}`,
      jobId: jobId,
      status: 'timeout',
      message: 'The video is still processing. Please check back in a few minutes.',
      rawResponse: lastRawResponse
    };
  }
  
  // Function to extract URL from raw response
  function extractUrlFromRawResponse(rawResponse) {
    if (!rawResponse) return null;
    
    // Look for URLs in the raw response
    const urlRegex = /(https?:\/\/[^\s"]+\.mp4[^\s"]*)/g;
    const matches = rawResponse.match(urlRegex);
    
    if (matches && matches.length > 0) {
      // Filter for storage URLs
      const storageUrls = matches.filter(url => 
        url.includes('storage.googleapis.com') || 
        url.includes('sieve-prod-us-central1-persistent-bucket')
      );
      
      if (storageUrls.length > 0) {
        return storageUrls[0];
      }
      
      return matches[0];
    }
    
    return null;
  }
  
  // Enhanced downloadYouTubeSegment function with improved job result handling
  async function enhancedDownloadYouTubeSegment(videoId, startTime, duration, apiKey) {
    try {
      console.log(`Downloading YouTube segment for video ${videoId} from ${startTime}s for ${duration}s`);
      
      // Use the Sieve API to download the segment
      const apiUrl = 'https://mango.sievedata.com/v2/push';
      
      // Prepare the request body
      const requestBody = {
        function: 'sieve/youtube-downloader',
        inputs: {
          youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
          start_time: startTime,
          duration: duration
        }
      };
      
      console.log('Sending request to Sieve API:', requestBody);
      
      // Send the request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Parse the response to get the job ID
      console.log('Parsing response body...');
      const jobData = await response.json();
      console.log('Job created with ID:', jobData.id);
      
      // Poll for job completion
      const jobResult = await enhancedPollJobStatus(jobData.id, apiKey);
      console.log('Job status result:', jobResult);
      
      // Log the entire job result structure for debugging
      console.log('Full job result structure:');
      try {
        console.log(JSON.stringify(jobResult, null, 2));
      } catch (e) {
        console.log('Could not stringify job result:', e);
      }
      
      // Check if the job completed successfully
      if (jobResult && jobResult.status === 'completed') {
        // Check if we have a URL in the job result
        if (jobResult.outputUrl) {
          console.log('Found video URL in outputs.data.url:', jobResult.outputUrl);
          return {
            success: true,
            url: jobResult.outputUrl,
            metadata: {
              title: 'YouTube Video Segment',
              duration: duration,
              format: 'mp4',
              resolution: 'original'
            },
            jobId: jobData.id
          };
        }
        
        // Check if we have outputs with a URL
        if (jobResult.outputs && jobResult.outputs.output_0) {
          const outputData = jobResult.outputs.output_0;
          
          // Try to find the video URL in various formats
          let videoUrl = null;
          
          // Check for direct URL properties
          if (outputData.url) {
            videoUrl = outputData.url;
            console.log('Found video URL in url property:', videoUrl);
          } else if (outputData.video_url) {
            videoUrl = outputData.video_url;
            console.log('Found video URL in video_url property:', videoUrl);
          } else if (outputData.data && typeof outputData.data === 'object' && outputData.data.url) {
            videoUrl = outputData.data.url;
            console.log('Found video URL in data.url property:', videoUrl);
          } else if (outputData.data && typeof outputData.data === 'string') {
            // Try to parse data as JSON
            try {
              const dataObj = JSON.parse(outputData.data);
              if (dataObj.url) {
                videoUrl = dataObj.url;
                console.log('Found video URL in parsed data.url:', videoUrl);
              }
            } catch (e) {
              // Not JSON, check if it's a URL itself
              if (outputData.data.startsWith('http') && 
                  (outputData.data.includes('.mp4') || 
                   outputData.data.includes('storage.googleapis.com'))) {
                videoUrl = outputData.data;
                console.log('Found video URL in data string:', videoUrl);
              }
            }
          }
          
          // If still no URL, check all string properties
          if (!videoUrl) {
            for (const key in outputData) {
              if (typeof outputData[key] === 'string') {
                const value = outputData[key];
                // Check if the string looks like a URL
                if (value.startsWith('http') &&
                    (value.includes('.mp4') ||
                     value.includes('storage.googleapis.com') ||
                     value.includes('sieve-prod-us-central1-persistent-bucket'))) {
                  videoUrl = value;
                  console.log(`Found video URL in ${key} property:`, videoUrl);
                  break;
                }
              }
            }
          }
          
          // If we still don't have a URL, check if there's a URL field in the job result itself
          if (!videoUrl && jobResult.URL && typeof jobResult.URL === 'string') {
            videoUrl = jobResult.URL;
            console.log('Found video URL in job result URL field:', videoUrl);
          }
          
          // If we found a URL, return it
          if (videoUrl) {
            console.log('Found video URL:', videoUrl);
            
            // Return the download URL and metadata
            return {
              success: true,
              url: videoUrl,
              metadata: {
                title: outputData.title || 'YouTube Video',
                duration: outputData.duration || duration,
                format: 'mp4',
                resolution: outputData.resolution || 'unknown'
              },
              jobId: jobData.id
            };
          } else {
            console.log('Job completed but no URL found in output_0');
            
            // Try to extract URL from raw response as a last resort
            if (jobResult.rawResponse) {
              const extractedUrl = extractUrlFromRawResponse(jobResult.rawResponse);
              if (extractedUrl) {
                console.log('Extracted URL from raw response:', extractedUrl);
                return {
                  success: true,
                  url: extractedUrl,
                  metadata: {
                    title: 'YouTube Video Segment',
                    duration: duration,
                    format: 'mp4',
                    resolution: 'original'
                  },
                  jobId: jobData.id
                };
              }
            }
            
            // If we still can't find a URL, return a failure
            console.log('No URL found in any output');
            return {
              success: false,
              error: 'No URL found in job result',
              jobId: jobData.id
            };
          }
        } else {
          console.log('Job completed but no outputs found:', jobResult);
          throw new Error('Job completed but no outputs found');
        }
      }
      // Handle timeout case - job is still running but we've stopped polling
      else if (jobResult && jobResult.status === 'timeout') {
        return {
          success: false,
          error: jobResult.error,
          message: jobResult.message,
          jobId: jobResult.jobId,
          type: 'pending',
          startTime: startTime,
          duration: duration
        };
      }
      // Handle other error cases
      else {
        console.error('Unexpected job result:', jobResult);
        throw new Error('Unexpected job result: ' + JSON.stringify(jobResult));
      }
    } catch (error) {
      console.error('Error downloading YouTube segment:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        type: 'thumbnail',
        url: `https://img.youtube.com/vi/${videoId}/0.jpg`,
        startTime: startTime,
        duration: duration
      };
    }
  }
  
  // Replace the original functions with our enhanced versions
  if (typeof self.pollJobStatus === 'function') {
    console.log('Replacing pollJobStatus with enhanced version');
    self.pollJobStatus = enhancedPollJobStatus;
  } else {
    console.log('Adding pollJobStatus function');
    self.pollJobStatus = enhancedPollJobStatus;
  }
  
  if (typeof self.downloadYouTubeSegment === 'function') {
    console.log('Replacing downloadYouTubeSegment with enhanced version');
    self.downloadYouTubeSegment = enhancedDownloadYouTubeSegment;
  } else if (typeof self.downloadYouTubeSegmentWithSieve === 'function') {
    console.log('Replacing downloadYouTubeSegmentWithSieve with enhanced version');
    self.downloadYouTubeSegmentWithSieve = enhancedDownloadYouTubeSegment;
  } else {
    console.log('Adding downloadYouTubeSegment function');
    self.downloadYouTubeSegment = enhancedDownloadYouTubeSegment;
  }
  
  // Enhanced force refresh job status function
  function enhancedForceRefreshJobStatus(jobId, apiKey) {
    console.log('Enhanced force refresh job status for job ID:', jobId);
    
    // First, try to directly fetch the job status from the Sieve API
    const jobUrl = `https://mango.sievedata.com/v2/jobs/${jobId}`;
    
    return fetch(jobUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      }
    })
      .then(response => response.text())
      .then(rawResponseText => {
        console.log('Raw job data:', rawResponseText);
        
        // Try to extract URL from raw response
        const extractedUrl = extractUrlFromRawResponse(rawResponseText);
        if (extractedUrl) {
          console.log('Extracted URL from raw response:', extractedUrl);
          
          // Update the latest short result with the URL
          const latestShortResult = self.latestShortResult || {};
          latestShortResult.shortUrl = extractedUrl;
          latestShortResult.previewUrl = extractedUrl;
          latestShortResult.success = true;
          latestShortResult.status = 'completed';
          latestShortResult.rawExtracted = true;
          latestShortResult.timestamp = new Date().toISOString();
          
          // Save the updated result
          if (typeof self.setLatestShortResult === 'function') {
            self.setLatestShortResult(latestShortResult);
          } else {
            self.latestShortResult = latestShortResult;
            chrome.storage.local.set({ latestShortResult });
          }
          
          return latestShortResult;
        }
        
        // Try to parse as JSON
        try {
          const jobData = JSON.parse(rawResponseText);
          
          // Use our enhanced poll job status function to get the result
          return enhancedPollJobStatus(jobId, apiKey);
        } catch (error) {
          console.error('Error parsing job data:', error);
          return enhancedPollJobStatus(jobId, apiKey);
        }
      })
      .catch(error => {
        console.error('Error fetching job status:', error);
        return enhancedPollJobStatus(jobId, apiKey);
      });
  }
  
  // Add a message listener for force refresh job status
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'forceRefreshJobStatus') {
      console.log('Received request to force refresh job status');
      
      // Check if we have a latest short result with a job ID
      if (self.latestShortResult && self.latestShortResult.jobId) {
        console.log('Found job ID in latest short result:', self.latestShortResult.jobId);
        
        // Get the job ID and refresh the status
        const jobId = self.latestShortResult.jobId;
        
        // Use our enhanced force refresh function
        enhancedForceRefreshJobStatus(jobId, self.SIEVE_API_KEY)
          .then(result => {
            console.log('Enhanced force refresh result:', result);
            sendResponse(result);
          })
          .catch(error => {
            console.error('Error in enhanced force refresh:', error);
            sendResponse({
              success: false,
              error: error.message,
              jobId: jobId
            });
          });
        
        return true; // Keep the message channel open for the async response
      } else {
        console.log('No job ID found in latest short result');
        sendResponse({
          success: false,
          error: 'No job ID found in latest short result'
        });
      }
    }
  });
  
  console.log('ViralAI Job Retrieval Fix: Successfully applied!');
})();
