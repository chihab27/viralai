// Helper function to format time in MM:SS format
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup DOM content loaded');

  // Load and display credits
  loadCredits();

  // Force refresh job status when popup opens
  chrome.runtime.sendMessage({action: 'forceRefreshJobStatus'}, function(response) {
    console.log('Force refresh response on popup load:', response);

    // If we got a successful response with a URL, show it immediately
    if (response && response.shortUrl) {
      console.log('Found URL on popup load, displaying immediately');
      document.getElementById('processing').classList.add('hidden');
      document.getElementById('result').classList.remove('hidden');
      addShortToCarousel(response.shortUrl, response.previewUrl || response.shortUrl, {
        viralityScore: response.viralityScore,
        explanation: response.explanation,
        transcriptText: response.transcriptText
      });
    } else {
      // Otherwise, check for the latest short result
      checkForLatestShortResult();
    }
  });

  // Add a timeout to force check again after 3 seconds
  setTimeout(function() {
    chrome.runtime.sendMessage({action: 'getLatestShortResult'}, function(response) {
      if (response && response.shortUrl && document.getElementById('result').classList.contains('hidden')) {
        console.log('Found URL in delayed check, displaying now');
        document.getElementById('processing').classList.add('hidden');
        document.getElementById('result').classList.remove('hidden');
        addShortToCarousel(response.shortUrl, response.previewUrl || response.shortUrl, {
          viralityScore: response.viralityScore,
          explanation: response.explanation,
          transcriptText: response.transcriptText
        });
      }
    });
  }, 3000);

  // Set default schedule time to tomorrow at noon
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);
  document.getElementById('schedule-time').value = tomorrow.toISOString().slice(0, 16);

  // Check if we're on a YouTube video page
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    const url = currentTab.url;

    if (url && url.includes('youtube.com/watch')) {
      // We're on a YouTube video page
      document.getElementById('not-youtube').classList.add('hidden');
      document.getElementById('youtube-detected').classList.remove('hidden');

      // Get video information from the page
      chrome.tabs.sendMessage(currentTab.id, {action: 'getVideoInfo'}, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Error getting video info:', chrome.runtime.lastError);
        }

        if (response && response.title) {
          document.getElementById('video-title').textContent = response.title;
          document.getElementById('duration-value').textContent = response.duration || '0:00';
        }
      });
    } else {
      // Not on a YouTube video page
      document.getElementById('not-youtube').classList.remove('hidden');
      document.getElementById('youtube-detected').classList.add('hidden');
    }
  });

  // Create Short button click handler
  document.getElementById('create-short').addEventListener('click', function() {
    // Show processing UI
    document.getElementById('processing').classList.remove('hidden');

    // Get options
    const duration = document.getElementById('short-duration').value;
    const aiStyle = document.getElementById('ai-style').value;
    const captionStyle = document.getElementById('caption-style').value;
    const useViralDetection = document.getElementById('viral-detection').checked;

    console.log('Creating short with options:', {
      duration,
      aiStyle,
      captionStyle,
      useViralDetection
    });

    // Get the current tab URL
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      const url = currentTab.url;

      // Extract video ID from YouTube URL
      const videoId = new URL(url).searchParams.get('v');

      if (!videoId) {
        alert('Could not extract video ID from URL');
        document.getElementById('processing').classList.add('hidden');
        return;
      }

      // Check if user has enough credits
      if (!hasEnoughCredits(1)) {
        alert('Not enough credits. Please purchase more credits to continue.');
        document.getElementById('processing').classList.add('hidden');
        return;
      }

      // Send message to background script to create the short
      chrome.runtime.sendMessage({
        action: 'createShort',
        videoId: videoId,
        options: {
          duration: duration,
          aiStyle: aiStyle,
          captionStyle: captionStyle,
          useViralDetection: useViralDetection
        }
      }, function(response) {
        if (response && response.success) {
          if (response.status === 'processing') {
            // Update the processing message
            const processingMessage = document.getElementById('processing-message');
            if (processingMessage) {
              processingMessage.textContent = response.message || 'Processing your short...';
            }

            // Start polling for the result
            startPollingForShortResult();

            // Deduct credits
            deductCredits(1);
          } else {
            // Hide processing UI
            document.getElementById('processing').classList.add('hidden');

            // Show result UI
            document.getElementById('result').classList.remove('hidden');

            // Add the short to the carousel
            addShortToCarousel(response.shortUrl, response.previewUrl, {
              viralityScore: response.viralityScore,
              explanation: response.explanation,
              transcriptText: response.transcriptText
            });
          }
        } else {
          // Hide processing UI
          document.getElementById('processing').classList.add('hidden');

          alert('Error creating short: ' + (response ? response.error : 'Unknown error'));
        }
      });
    });
  });

  // Debug Job Status button click handler
  document.getElementById('debug-job-status').addEventListener('click', function() {
    console.log('Debug Job Status button clicked');

    // Get the latest short result
    chrome.runtime.sendMessage({action: 'getLatestShortResult'}, function(response) {
      if (chrome.runtime.lastError) {
        console.error('Error getting latest short result:', chrome.runtime.lastError);
        alert('Error: ' + chrome.runtime.lastError.message);
        return;
      }

      // Show the raw response
      console.log('Raw response:', response);

      // Format the response for display
      let formattedResponse = 'Current Job Status:\n\n';

      if (response) {
        formattedResponse += `Success: ${response.success}\n`;
        formattedResponse += `Status: ${response.status || 'N/A'}\n`;

        if (response.jobId) {
          formattedResponse += `Job ID: ${response.jobId}\n`;
        }

        if (response.shortUrl) {
          formattedResponse += `Short URL: ${response.shortUrl}\n`;
        }

        if (response.message) {
          formattedResponse += `Message: ${response.message}\n`;
        }

        if (response.error) {
          formattedResponse += `Error: ${response.error}\n`;
        }

        formattedResponse += `\nTimestamp: ${response.timestamp || 'N/A'}\n`;

        // Add a direct action to force display if URL exists
        if (response.shortUrl) {
          formattedResponse += '\n\nURL exists but UI not updating?\nClick OK to force display.\n';

          if (confirm(formattedResponse)) {
            // Force display the short
            document.getElementById('processing').classList.add('hidden');
            document.getElementById('result').classList.remove('hidden');
            addShortToCarousel(response.shortUrl, response.shortUrl, {
              viralityScore: response.viralityScore,
              explanation: response.explanation,
              transcriptText: response.transcriptText
            });
          }
        } else {
          alert(formattedResponse);
        }
      } else {
        alert('No response data available');
      }
    });
  });

  // Check Job Status button click handler
  document.getElementById('check-job-status').addEventListener('click', function() {
    console.log('Check Job Status button clicked');

    // Show a loading state on the button
    const button = document.getElementById('check-job-status');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-sync fa-spin"></i> Checking...';
    button.disabled = true;

    // Force a refresh of the job status
    chrome.runtime.sendMessage({action: 'forceRefreshJobStatus'}, function(response) {
      // Reset the button after a short delay
      setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
      }, 2000);

      if (chrome.runtime.lastError) {
        console.error('Error checking job status:', chrome.runtime.lastError);
        alert('Error checking job status: ' + chrome.runtime.lastError.message);
        return;
      }

      console.log('Job status check response:', response);

      if (response && response.success && response.shortUrl) {
        // We have a successful result
        console.log('Job completed successfully!');

        // Hide processing UI
        document.getElementById('processing').classList.add('hidden');

        // Show result UI
        document.getElementById('result').classList.remove('hidden');

        // Add the short to the carousel
        addShortToCarousel(response.shortUrl, response.previewUrl, {
          viralityScore: response.viralityScore,
          explanation: response.explanation,
          transcriptText: response.transcriptText
        });
      } else if (response && response.jobId) {
        // We have a job ID, show it to the user
        alert(`Job is still processing. Job ID: ${response.jobId}\n\nStatus: ${response.status || 'pending'}\n\n${response.message || 'Please check back later.'}`);
      } else {
        // No job information available
        alert('No job information available. Please try creating a short again.');
      }
    });
  });

  // We'll use this reference to store the polling interval
  window.shortPollInterval = null;

  // Download Short button click handler
  document.getElementById('download-short').addEventListener('click', function() {
    // Get the current active short
    const activeIndex = parseInt(document.querySelector('.indicator.active').dataset.index);
    const shortItems = document.querySelectorAll('.short-item');
    const activeShort = shortItems[activeIndex];
    const shortUrl = activeShort.dataset.url;

    // Check if user has enough credits
    if (!hasEnoughCredits(1)) {
      alert('Not enough credits. Please purchase more credits to continue.');
      return;
    }

    // Send message to background script to download the short
    chrome.runtime.sendMessage({action: 'downloadShort', url: shortUrl}, function(response) {
      if (response && response.success) {
        // Deduct credits
        deductCredits(1);
      } else {
        alert('Error downloading short: ' + (response ? response.error : 'Unknown error'));
      }
    });
  });

  // Share Short button click handler
  document.getElementById('share-short').addEventListener('click', function() {
    // Get the current active short
    const activeIndex = parseInt(document.querySelector('.indicator.active').dataset.index);
    const shortItems = document.querySelectorAll('.short-item');
    const activeShort = shortItems[activeIndex];
    const shortUrl = activeShort.dataset.url;

    // Send message to background script to share the short
    chrome.runtime.sendMessage({action: 'shareShort', url: shortUrl}, function(response) {
      if (response && response.success) {
        alert('Short URL copied to clipboard!');
      } else {
        alert('Error sharing short: ' + (response ? response.error : 'Unknown error'));
      }
    });
  });

  // Schedule TikTok button click handler
  document.getElementById('schedule-tiktok').addEventListener('click', function() {
    // Get the current active short
    const activeIndex = parseInt(document.querySelector('.indicator.active').dataset.index);
    const shortItems = document.querySelectorAll('.short-item');
    const activeShort = shortItems[activeIndex];
    const shortUrl = activeShort.dataset.url;

    // Get TikTok options
    const caption = document.getElementById('tiktok-caption').value;
    const scheduleTime = document.getElementById('schedule-time').value;

    // Check if user has enough credits
    if (!hasEnoughCredits(1)) {
      alert('Not enough credits. Please purchase more credits to continue.');
      return;
    }

    // Send message to background script to schedule the TikTok post
    chrome.runtime.sendMessage({
      action: 'scheduleTikTok',
      videoUrl: shortUrl,
      caption: caption,
      scheduleTime: scheduleTime
    }, function(response) {
      if (response && response.success) {
        // Deduct credits
        deductCredits(1);
        alert('Your video has been scheduled for posting on TikTok!');
      } else {
        alert('Error scheduling TikTok post: ' + (response ? response.error : 'Unknown error'));
      }
    });
  });

  // Download Full Video button click handler
  document.getElementById('download-full-video').addEventListener('click', function() {
    // Get the current tab URL to extract the video ID
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      const url = currentTab.url;

      // Extract video ID from YouTube URL
      const videoId = new URL(url).searchParams.get('v');

      if (!videoId) {
        alert('Could not extract video ID from URL');
        return;
      }

      // Check if user has enough credits
      if (!hasEnoughCredits(1)) {
        alert('Not enough credits. Please purchase more credits to continue.');
        return;
      }

      // Show a loading message
      const downloadButton = document.getElementById('download-full-video');
      const originalText = downloadButton.textContent;
      downloadButton.textContent = 'Downloading...';
      downloadButton.disabled = true;

      // Send message to background script to download the full video
      chrome.runtime.sendMessage({action: 'downloadFullVideo', videoId: videoId}, function(response) {
        // Reset button state
        downloadButton.textContent = originalText;
        downloadButton.disabled = false;

        if (response && response.success) {
          // Deduct credits
          deductCredits(1);
        } else {
          alert('Error downloading video: ' + (response ? response.error : 'Unknown error'));
        }
      });
    });
  });

  // Reset API Keys button click handler
  document.getElementById('reset-api-keys').addEventListener('click', function() {
    const resetButton = document.getElementById('reset-api-keys');
    const originalText = resetButton.textContent;
    resetButton.textContent = 'Resetting...';
    resetButton.disabled = true;

    // Send message to background script to reset API keys
    chrome.runtime.sendMessage({action: 'resetApiKeys'}, function(response) {
      // Reset button state
      resetButton.textContent = originalText;
      resetButton.disabled = false;

      if (response && response.success) {
        alert('API keys reset successfully. ' + (response.testResult ? response.testResult.message || '' : ''));
      } else {
        alert('Error resetting API keys: ' + (response ? response.error : 'Unknown error'));
      }
    });
  });

  // Test Sieve Connection button click handler
  document.getElementById('test-sieve-connection').addEventListener('click', function() {
    const testButton = document.getElementById('test-sieve-connection');
    const originalText = testButton.textContent;
    testButton.textContent = 'Testing...';
    testButton.disabled = true;

    // Send message to background script to test Sieve connection
    chrome.runtime.sendMessage({action: 'testSieveConnection'}, function(response) {
      // Reset button state
      testButton.textContent = originalText;
      testButton.disabled = false;

      if (response && response.success) {
        const successMessage = 'Sieve API connection test successful!\n\n' +
          'Status: ' + response.status + '\n' +
          'API Key: ' + response.apiKeyUsed + '\n' +
          'Key Length: ' + response.apiKeyLength + '\n' +
          'Timestamp: ' + response.timestamp + '\n' +
          'Endpoint: ' + response.endpoint + '\n' +
          'API Version: v2' + '\n' +
          'Function: sieve/youtube-downloader';

        alert(successMessage);
        console.log('Successful connection details:', response);
      } else {
        const errorMessage = 'Sieve API connection test failed:\n\n' +
          'Error: ' + (response ? response.error : 'Unknown error') + '\n' +
          'API Key: ' + (response ? response.apiKeyUsed || 'Unknown' : 'Unknown') + '\n' +
          'Timestamp: ' + (response ? response.timestamp || new Date().toISOString() : new Date().toISOString()) + '\n' +
          'Status: ' + (response ? response.status || 'Unknown' : 'Unknown') + '\n' +
          'Tested Endpoints: ' + (response && response.testedEndpoints ? response.testedEndpoints.join('\n') : 'Unknown');

        alert(errorMessage);
        console.error('Connection test failure details:', response);
      }
    });
  });

  // Reset and Test button click handler
  document.getElementById('reset-and-test').addEventListener('click', function() {
    const resetTestButton = document.getElementById('reset-and-test');
    const originalText = resetTestButton.textContent;
    resetTestButton.textContent = 'Resetting & Testing...';
    resetTestButton.disabled = true;

    // First reset the API keys
    chrome.runtime.sendMessage({action: 'resetApiKeys'}, function(resetResponse) {
      console.log('Reset API keys response:', resetResponse);

      // Then test the Sieve connection
      chrome.runtime.sendMessage({action: 'testSieveConnection'}, function(testResponse) {
        // Reset button state
        resetTestButton.textContent = originalText;
        resetTestButton.disabled = false;

        if (testResponse && testResponse.success) {
          const successMessage = 'Reset and Test successful!\n\n' +
            'Status: ' + testResponse.status + '\n' +
            'API Key: ' + testResponse.apiKeyUsed + '\n' +
            'Key Length: ' + testResponse.apiKeyLength + '\n' +
            'Timestamp: ' + testResponse.timestamp + '\n' +
            'Endpoint: ' + testResponse.endpoint + '\n' +
            'API Version: v2' + '\n' +
            'Function: sieve/youtube-downloader';

          alert(successMessage);
          console.log('Successful reset and test details:', testResponse);
        } else {
          const errorMessage = 'Reset and Test failed:\n\n' +
            'Error: ' + (testResponse ? testResponse.error : 'Unknown error') + '\n' +
            'API Key: ' + (testResponse ? testResponse.apiKeyUsed || 'Unknown' : 'Unknown') + '\n' +
            'Timestamp: ' + (testResponse ? testResponse.timestamp || new Date().toISOString() : new Date().toISOString()) + '\n' +
            'Status: ' + (testResponse ? testResponse.status || 'Unknown' : 'Unknown') + '\n' +
            'Tested Endpoints: ' + (testResponse && testResponse.testedEndpoints ? testResponse.testedEndpoints.join('\n') : 'Unknown');

          alert(errorMessage);
          console.error('Reset and test failure details:', testResponse);
        }
      });
    });
  });
});

// Function to load credits from storage
function loadCredits() {
  chrome.storage.sync.get(['credits'], function(result) {
    let credits = 1000; // Default starting credits

    if (result.credits !== undefined) {
      credits = result.credits;
    } else {
      // Initialize credits if not set
      chrome.storage.sync.set({credits: credits});
    }

    // Update the UI
    document.getElementById('credits-value').textContent = credits;
  });
}

// Function to deduct credits
function deductCredits(amount) {
  chrome.storage.sync.get(['credits'], function(result) {
    let credits = result.credits || 1000;
    credits -= amount;

    // Update storage
    chrome.storage.sync.set({credits: credits});

    // Update the UI
    document.getElementById('credits-value').textContent = credits;
  });
}

// Function to check if user has enough credits
function hasEnoughCredits(amount) {
  const credits = parseInt(document.getElementById('credits-value').textContent);
  return credits >= amount;
}

// Function to check if there's a latest short result available
function checkForLatestShortResult() {
  console.log('Checking for latest short result...');

  chrome.runtime.sendMessage({action: 'getLatestShortResult'}, function(response) {
    if (chrome.runtime.lastError) {
      console.error('Error checking for latest short result:', chrome.runtime.lastError);
      return;
    }

    console.log('Latest short result check response:', response);

    // If we have a successful result, show it
    if (response && ((response.success && response.shortUrl) || response.shortUrl)) {
      console.log('Found short result with URL:', response);

      // Show result UI
      document.getElementById('result').classList.remove('hidden');

      // Add the short to the carousel
      addShortToCarousel(response.shortUrl, response.previewUrl || response.shortUrl, {
        viralityScore: response.viralityScore,
        explanation: response.explanation,
        transcriptText: response.transcriptText
      });
    }
    // If we have a pending result, start polling
    else if (response && response.status === 'processing') {
      console.log('Found processing short result, starting polling...');

      // Show processing UI
      document.getElementById('processing').classList.remove('hidden');

      // Start polling for the result
      startPollingForShortResult();
    }
    else if (response && response.status === 'pending') {
      console.log('Found pending short result, starting polling...');

      // Show processing UI
      document.getElementById('processing').classList.remove('hidden');

      // Update the processing message
      const processingMessage = document.getElementById('processing-message');
      if (processingMessage) {
        processingMessage.textContent = response.message || 'Your short is still being processed...';
      }

      // Start polling for the result
      startPollingForShortResult();
    }
  });
}

// Function to poll for the latest short result
function startPollingForShortResult() {
  console.log('Starting to poll for short result...');

  // Clear any existing polling interval
  if (window.shortPollInterval) {
    clearInterval(window.shortPollInterval);
  }

  // Keep track of polling attempts
  let pollAttempts = 0;
  const maxPollAttempts = 120; // 10 minutes at 5-second intervals

  // Set up an interval to check for the result every 5 seconds
  window.shortPollInterval = setInterval(function() {
    pollAttempts++;
    console.log(`Polling for short result... (Attempt ${pollAttempts}/${maxPollAttempts})`);

    // Update the processing message with the attempt count
    const processingMessage = document.getElementById('processing-message');
    if (processingMessage) {
      const baseMessage = 'Creating your viral short';
      const dots = '.'.repeat(pollAttempts % 4 + 1); // 1-4 dots
      processingMessage.innerHTML = `<i class="fas fa-cog fa-spin"></i> ${baseMessage}${dots}`;
    }

    // Check if we've reached the maximum number of attempts
    if (pollAttempts >= maxPollAttempts) {
      clearInterval(window.shortPollInterval);
      window.shortPollInterval = null;

      // Check if we're still processing
      if (!document.getElementById('processing').classList.contains('hidden')) {
        // Hide processing UI
        document.getElementById('processing').classList.add('hidden');

        alert('Your short is taking longer than expected to process. Please try again later.');
      }
      return;
    }

    // Send message to background script to get the latest short result
    chrome.runtime.sendMessage({action: 'getLatestShortResult'}, function(response) {
      if (chrome.runtime.lastError) {
        console.error('Error polling for short result:', chrome.runtime.lastError);
        return;
      }

      console.log('Received short result:', response);

      if (response && response.success) {
        // We have a successful result, stop polling
        clearInterval(window.shortPollInterval);
        window.shortPollInterval = null;

        // Hide processing UI
        document.getElementById('processing').classList.add('hidden');

        // Show result UI
        document.getElementById('result').classList.remove('hidden');

        // Add the short to the carousel
        addShortToCarousel(response.shortUrl, response.previewUrl, {
          viralityScore: response.viralityScore,
          explanation: response.explanation,
          transcriptText: response.transcriptText
        });
      }
      // Check if we have a URL even if success is false
      else if (response && response.shortUrl) {
        console.log('Found URL even though success is false. Displaying anyway.');

        // Stop polling
        clearInterval(window.shortPollInterval);
        window.shortPollInterval = null;

        // Hide processing UI
        document.getElementById('processing').classList.add('hidden');

        // Show result UI
        document.getElementById('result').classList.remove('hidden');

        // Add the short to the carousel
        addShortToCarousel(response.shortUrl, response.shortUrl, {
          viralityScore: response.viralityScore,
          explanation: response.explanation,
          transcriptText: response.transcriptText
        });
      }
      // If we have a pending status, update the processing message
      else if (response && (response.status === 'pending' || response.status === 'processing')) {
        const processingMessage = document.getElementById('processing-message');
        if (processingMessage) {
          // Check if we have a specific message for the current processing step
          if (response.message) {
            processingMessage.innerHTML = `<i class="fas fa-cog fa-spin"></i> ${response.message}`;
          } else {
            processingMessage.innerHTML = `<i class="fas fa-cog fa-spin"></i> Your short is still being processed...`;
          }

          // Add more detailed information if available
          if (response.status === 'processing' && response.step) {
            const processingNote = document.querySelector('.processing-note');
            if (processingNote) {
              switch (response.step) {
                case 'transcript':
                  processingNote.textContent = 'Fetching and analyzing video transcript...';
                  break;
                case 'analysis':
                  processingNote.textContent = 'Using AI to identify viral content...';
                  break;
                case 'extraction':
                  processingNote.textContent = 'Extracting the viral segment from the video...';
                  break;
                default:
                  processingNote.textContent = 'This may take a few minutes. The result will appear in the carousel when ready.';
              }
            }
          }
        }
      }
      // If we have an error, show it and stop polling
      else if (response && response.error) {
        // Don't stop polling immediately on error - it might be temporary
        // Only stop if we've been polling for a while
        if (pollAttempts > 10) {
          clearInterval(window.shortPollInterval);
          window.shortPollInterval = null;

          // Hide processing UI
          document.getElementById('processing').classList.add('hidden');

          alert('Error creating short: ' + response.error);
        }
      }
    });
  }, 5000); // Poll every 5 seconds
}

// Function to add a short to the carousel
function addShortToCarousel(shortUrl, previewUrl, viralInfo) {
  // Get the container
  const container = document.getElementById('shorts-container');
  const indicators = document.getElementById('carousel-indicators');

  // Clear existing shorts
  container.innerHTML = '';
  indicators.innerHTML = '';

  // Create the short item
  const shortItem = document.createElement('div');
  shortItem.className = 'short-item';
  shortItem.dataset.url = shortUrl;

  // Create the video element
  const video = document.createElement('video');
  video.controls = true;
  video.autoplay = false;
  video.src = previewUrl;
  video.poster = 'assets/thumbnail.jpg'; // Fallback thumbnail

  // Create the caption
  const caption = document.createElement('div');
  caption.className = 'short-caption';
  caption.textContent = 'Your Viral Short';

  // Add elements to the short item
  shortItem.appendChild(video);
  shortItem.appendChild(caption);

  // If we have viral information, add it to the short item and update the viral info section
  if (viralInfo) {
    // Create a viral info container for the short item
    const viralInfoContainer = document.createElement('div');
    viralInfoContainer.className = 'viral-info-preview';

    // Add virality score if available
    if (viralInfo.viralityScore) {
      const scoreElement = document.createElement('div');
      scoreElement.className = 'virality-score';
      scoreElement.innerHTML = `<i class="fas fa-fire"></i> Virality Score: <span>${viralInfo.viralityScore}%</span>`;
      viralInfoContainer.appendChild(scoreElement);
    }

    // Add explanation if available
    if (viralInfo.explanation) {
      const explanationElement = document.createElement('div');
      explanationElement.className = 'viral-explanation';
      explanationElement.innerHTML = `<i class="fas fa-info-circle"></i> ${viralInfo.explanation}`;
      viralInfoContainer.appendChild(explanationElement);

      // Update the viral info section
      const viralInfoSection = document.getElementById('viral-info');
      const viralReason = document.getElementById('viral-reason');
      if (viralInfoSection && viralReason) {
        viralReason.textContent = viralInfo.explanation;
        viralInfoSection.classList.remove('hidden');
      }
    }

    // Add transcript text if available
    if (viralInfo.transcriptText) {
      const transcriptElement = document.createElement('div');
      transcriptElement.className = 'transcript-text-preview';
      transcriptElement.innerHTML = `<i class="fas fa-quote-left"></i> ${viralInfo.transcriptText}`;
      viralInfoContainer.appendChild(transcriptElement);

      // Update the viral info section
      const transcriptText = document.getElementById('transcript-text');
      if (transcriptText) {
        transcriptText.textContent = viralInfo.transcriptText;
        document.getElementById('viral-info').classList.remove('hidden');
      }
    }

    // Add the viral info container to the short item
    shortItem.appendChild(viralInfoContainer);
  }

  // Add the short item to the container
  container.appendChild(shortItem);

  // Create the indicator
  const indicator = document.createElement('div');
  indicator.className = 'indicator active';
  indicator.dataset.index = 0;

  // Add the indicator to the container
  indicators.appendChild(indicator);

  // Initialize carousel navigation
  initCarouselNavigation();
}

// Function to initialize carousel navigation
function initCarouselNavigation() {
  const container = document.getElementById('shorts-container');
  const indicators = document.querySelectorAll('.indicator');
  const prevBtn = document.getElementById('prev-short');
  const nextBtn = document.getElementById('next-short');

  // Set up indicator click handlers
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', function() {
      // Update active indicator
      document.querySelector('.indicator.active').classList.remove('active');
      this.classList.add('active');

      // Scroll to the corresponding short
      container.style.transform = `translateX(-${index * 100}%)`;
    });
  });

  // Set up previous button
  prevBtn.addEventListener('click', function() {
    const activeIndicator = document.querySelector('.indicator.active');
    const activeIndex = parseInt(activeIndicator.dataset.index);
    const prevIndex = Math.max(0, activeIndex - 1);

    // Update active indicator
    activeIndicator.classList.remove('active');
    indicators[prevIndex].classList.add('active');

    // Scroll to the previous short
    container.style.transform = `translateX(-${prevIndex * 100}%)`;
  });

  // Set up next button
  nextBtn.addEventListener('click', function() {
    const activeIndicator = document.querySelector('.indicator.active');
    const activeIndex = parseInt(activeIndicator.dataset.index);
    const nextIndex = Math.min(indicators.length - 1, activeIndex + 1);

    // Update active indicator
    activeIndicator.classList.remove('active');
    indicators[nextIndex].classList.add('active');

    // Scroll to the next short
    container.style.transform = `translateX(-${nextIndex * 100}%)`;
  });
}
