// Apply fixes to the ViralAI extension
// This script fixes the job retrieval issues and adds the missing setLatestShortResult function

(function() {
  console.log('ViralAI Fix: Applying fixes to the extension...');
  
  // 1. Add the missing setLatestShortResult function
  if (typeof self.setLatestShortResult !== 'function') {
    console.log('Adding missing setLatestShortResult function');
    
    self.setLatestShortResult = function(result) {
      console.log('Setting latest short result:', result);
      
      // Store the result in memory
      self.latestShortResult = result;
      
      // Also save to storage for persistence
      chrome.storage.local.set({ latestShortResult: result }, () => {
        console.log('Short result saved to storage:', result.status || 'unknown');
      });
      
      return result;
    };
  }
  
  // 2. Add the URL extraction function if it doesn't exist
  if (typeof self.extractUrlFromRawResponse !== 'function') {
    console.log('Adding extractUrlFromRawResponse function');
    
    self.extractUrlFromRawResponse = function(rawResponse) {
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
    };
  }
  
  // 3. Add the force refresh job status function
  if (typeof self.forceRefreshJobStatus !== 'function') {
    console.log('Adding forceRefreshJobStatus function');
    
    self.forceRefreshJobStatus = async function(jobId, apiKey) {
      console.log('Force refreshing job status for job ID:', jobId);
      
      // First, try to directly fetch the job status from the Sieve API
      const jobUrl = `https://mango.sievedata.com/v2/jobs/${jobId}`;
      
      try {
        const response = await fetch(jobUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Get the raw response text
        const rawResponseText = await response.text();
        console.log('Raw job data:', rawResponseText);
        
        // Try to extract URL from raw response
        const extractedUrl = self.extractUrlFromRawResponse(rawResponseText);
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
          self.setLatestShortResult(latestShortResult);
          
          return latestShortResult;
        }
        
        // Try to parse as JSON
        try {
          const jobData = JSON.parse(rawResponseText);
          
          // Use our enhanced poll job status function to get the result
          return await self.pollJobStatus(jobId, apiKey);
        } catch (error) {
          console.error('Error parsing job data:', error);
          return await self.pollJobStatus(jobId, apiKey);
        }
      } catch (error) {
        console.error('Error fetching job status:', error);
        return {
          success: false,
          error: error.message,
          jobId: jobId
        };
      }
    };
  }
  
  // 4. Enhance the pollJobStatus function to better extract URLs
  const originalPollJobStatus = self.pollJobStatus;
  
  self.pollJobStatus = async function(jobId, apiKey, maxAttempts = 120, delayMs = 5000) {
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
        lastRawResponse = rawResponseText;
        
        // Try to parse the response as JSON
        let jobData;
        try {
          jobData = JSON.parse(rawResponseText);
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
  
        // If the job is completed, check if we have the video URL
        if (jobData.status === 'completed') {
          // First, try to extract URL from the raw response
          let extractedUrl = self.extractUrlFromRawResponse(rawResponseText);
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
            let extractedUrl = self.extractUrlFromRawResponse(rawResponseText);
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
  };
  
  // 5. Enhance the downloadYouTubeSegmentWithSieve function to better handle job results
  const originalDownloadYouTubeSegmentWithSieve = self.downloadYouTubeSegmentWithSieve;
  
  if (typeof self.downloadYouTubeSegmentWithSieve === 'function') {
    console.log('Enhancing downloadYouTubeSegmentWithSieve function');
    
    self.downloadYouTubeSegmentWithSieve = async function(videoId, startTime, duration, apiKey) {
      console.log(`Enhanced downloading segment of YouTube video ${videoId} from ${startTime}s for ${duration}s using Sieve API...`);
      
      // Call the original function if it exists
      if (typeof originalDownloadYouTubeSegmentWithSieve === 'function') {
        try {
          const result = await originalDownloadYouTubeSegmentWithSieve(videoId, startTime, duration, apiKey);
          
          // If the result is successful, return it
          if (result.success && result.url) {
            return result;
          }
          
          // Otherwise, continue with our enhanced implementation
          console.log('Original function did not return a successful result, using enhanced implementation');
        } catch (error) {
          console.error('Error in original downloadYouTubeSegmentWithSieve:', error);
          console.log('Continuing with enhanced implementation');
        }
      }
      
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
      
      // Use the correct endpoint based on documentation
      const apiUrl = 'https://mango.sievedata.com/v2/push';
      console.log('Using Sieve API endpoint:', apiUrl);
      
      // Calculate end time
      const endTime = startTime + duration;
      
      // Prepare the request payload in the correct format
      const payload = {
        "function": "sieve/youtube-downloader",
        "inputs": {
          "url": `https://www.youtube.com/watch?v=${videoId}`,
          "download_type": "video",
          "resolution": "highest-available",
          "include_audio": true,
          "start_time": startTime,
          "end_time": endTime,
          "include_metadata": true,
          "video_format": "mp4"
        }
      };
      console.log('Request payload:', JSON.stringify(payload));
      
      try {
        // Make the API request to start the job
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
        
        // Parse the response to get the job ID
        console.log('Parsing response body...');
        const jobData = await response.json();
        console.log('Job created with ID:', jobData.id);
        
        // Poll for job completion
        const jobResult = await self.pollJobStatus(jobData.id, apiKey);
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
          // First, try to extract URL from the raw response
          if (jobResult.rawResponse) {
            const extractedUrl = self.extractUrlFromRawResponse(jobResult.rawResponse);
            if (extractedUrl) {
              console.log('Extracted URL from raw response:', extractedUrl);
              return {
                success: true,
                url: extractedUrl,
                type: 'video',
                startTime: startTime,
                duration: duration,
                metadata: {
                  title: 'YouTube Video Segment',
                  format: 'mp4',
                  resolution: 'original'
                },
                jobId: jobData.id
              };
            }
          }
          
          // Check if we have a URL in the job result
          if (jobResult.outputUrl) {
            console.log('Found video URL in outputs.data.url:', jobResult.outputUrl);
            return {
              success: true,
              url: jobResult.outputUrl,
              type: 'video',
              startTime: startTime,
              duration: duration,
              metadata: {
                title: 'YouTube Video Segment',
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
            
            // If we found a URL, return it
            if (videoUrl) {
              console.log('Found video URL:', videoUrl);
              
              // Return the download URL and metadata
              return {
                success: true,
                url: videoUrl,
                type: 'video',
                startTime: startTime,
                duration: duration,
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
                const extractedUrl = self.extractUrlFromRawResponse(jobResult.rawResponse);
                if (extractedUrl) {
                  console.log('Extracted URL from raw response as last resort:', extractedUrl);
                  return {
                    success: true,
                    url: extractedUrl,
                    type: 'video',
                    startTime: startTime,
                    duration: duration,
                    metadata: {
                      title: 'YouTube Video Segment',
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
                jobId: jobData.id,
                type: 'thumbnail',
                url: `https://img.youtube.com/vi/${videoId}/0.jpg`,
                startTime: startTime,
                duration: duration
              };
            }
          } else {
            console.log('Job completed but no outputs found:', jobResult);
            
            // Try to extract URL from raw response as a last resort
            if (jobResult.rawResponse) {
              const extractedUrl = self.extractUrlFromRawResponse(jobResult.rawResponse);
              if (extractedUrl) {
                console.log('Extracted URL from raw response when no outputs found:', extractedUrl);
                return {
                  success: true,
                  url: extractedUrl,
                  type: 'video',
                  startTime: startTime,
                  duration: duration,
                  metadata: {
                    title: 'YouTube Video Segment',
                    format: 'mp4',
                    resolution: 'original'
                  },
                  jobId: jobData.id
                };
              }
            }
            
            // Return a failure instead of throwing an error
            return {
              success: false,
              error: 'Job completed but no outputs found',
              jobId: jobData.id,
              type: 'thumbnail',
              url: `https://img.youtube.com/vi/${videoId}/0.jpg`,
              startTime: startTime,
              duration: duration
            };
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
          return {
            success: false,
            error: 'Unexpected job result: ' + JSON.stringify(jobResult),
            type: 'thumbnail',
            url: `https://img.youtube.com/vi/${videoId}/0.jpg`,
            startTime: startTime,
            duration: duration
          };
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
    };
  }
  
  // 6. Add a message listener for force refresh job status
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'forceRefreshJobStatus') {
      console.log('Received request to force refresh job status');
      
      // Check if we have a latest short result with a job ID
      if (self.latestShortResult && self.latestShortResult.jobId) {
        console.log('Found job ID in latest short result:', self.latestShortResult.jobId);
        
        // Get the job ID and refresh the status
        const jobId = self.latestShortResult.jobId;
        
        // Use our enhanced force refresh function
        self.forceRefreshJobStatus(jobId, self.SIEVE_API_KEY)
          .then(result => {
            console.log('Force refresh result:', result);
            
            // If we got a successful result with a URL, update the latest short result
            if (result.success && (result.url || result.shortUrl)) {
              const url = result.url || result.shortUrl;
              console.log('Found URL in force refresh result:', url);
              
              // Update the latest short result with the URL
              self.latestShortResult = {
                success: true,
                shortUrl: url,
                previewUrl: url,
                startTime: self.latestShortResult.startTime || 0,
                duration: self.latestShortResult.duration || 15,
                jobId: jobId,
                timestamp: new Date().toISOString(),
                status: 'completed'
              };
              
              // Save the updated result to storage
              self.setLatestShortResult(self.latestShortResult);
            }
            
            // Return the result
            sendResponse(result.success ? self.latestShortResult : result);
          })
          .catch(error => {
            console.error('Error in force refresh:', error);
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
      return true;
    }
  });
  
  console.log('ViralAI Fix: All fixes applied successfully!');
})();
