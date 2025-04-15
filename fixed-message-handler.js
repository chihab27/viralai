  // Handle force refresh job status request
  if (request.action === 'forceRefreshJobStatus') {
    console.log('Received request to force refresh job status');

    // Check if we have a latest short result with a job ID
    if (latestShortResult && latestShortResult.jobId) {
      console.log('Found job ID in latest short result:', latestShortResult.jobId);

      // Get the job ID and refresh the status
      const jobId = latestShortResult.jobId;
      
      // Use our enhanced force refresh function
      forceRefreshJobStatus(jobId, SIEVE_API_KEY)
        .then(result => {
          console.log('Force refresh result:', result);
          
          // If we got a successful result with a URL, update the latest short result
          if (result.success && (result.url || result.shortUrl)) {
            const url = result.url || result.shortUrl;
            console.log('Found URL in force refresh result:', url);
            
            // Update the latest short result with the URL
            latestShortResult = {
              success: true,
              shortUrl: url,
              previewUrl: url,
              startTime: latestShortResult.startTime || 0,
              duration: latestShortResult.duration || 15,
              jobId: jobId,
              timestamp: new Date().toISOString(),
              status: 'completed'
            };
            
            // Save the updated result to storage
            setLatestShortResult(latestShortResult);
          }
          
          // Return the result
          sendResponse(result.success ? latestShortResult : result);
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
