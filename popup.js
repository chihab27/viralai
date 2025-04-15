// Helper function to format time in MM:SS format
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Initialize Stripe
const stripe = Stripe('pk_test_51RDWvuQMC8Vx2Nom4SW8L07HjBGoZxPI8pEInup3CR7FaMXKu7VZMwzFJwj3CZ12I6kNlqmA8MoTweQQE0Kf5nKy00fk1QpFRn');

// Placeholder Price IDs - Replace these with your actual Price IDs from Stripe Dashboard
const priceIds = {
  basic: 'price_basic_placeholder', // Replace with actual Price ID for Basic package
  standard: 'price_standard_placeholder', // Replace with actual Price ID for Standard package
  premium: 'price_premium_placeholder' // Replace with actual Price ID for Premium package
};

document.addEventListener('DOMContentLoaded', function() {
  // Load and display credits
  loadCredits();

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
    // Check if user has enough credits
    if (!hasEnoughCredits(50)) {
      alert('Not enough credits. Please purchase more credits to continue.');
      return;
    }

    // Show processing UI
    document.getElementById('processing').classList.remove('hidden');

    // Get options
    const duration = document.getElementById('short-duration').value;
    const aiStyle = document.getElementById('ai-style').value;
    const captionStyle = document.getElementById('caption-style').value;

    // Get current tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];

      // Show a message about what's happening
      const processingText = document.querySelector('#processing p');
      processingText.textContent = 'Analyzing video with AI...';

      // Get metadata from tab (passed from content script)
      const pageTitle = currentTab.title || '';
      const pageDescription = '';
      const videoTags = [];

      // Send message to background script to start processing
      chrome.runtime.sendMessage({
        action: 'createShort',
        videoUrl: currentTab.url,
        options: {
          duration: duration,
          aiStyle: aiStyle,
          captionStyle: captionStyle,
          pageTitle: pageTitle,
          pageDescription: pageDescription,
          videoTags: videoTags
        }
      }, function(response) {
        // Hide processing UI
        document.getElementById('processing').classList.add('hidden');

        if (response && response.success) {
          // Show result UI
          document.getElementById('result').classList.remove('hidden');

          // Get shorts from response
          const shorts = response.shorts || [{ url: response.videoUrl, caption: 'Your Short', isFallback: response.isFallback }];

          // Reference to container
          const shortsContainer = document.getElementById('shorts-container');
          const indicatorsContainer = document.getElementById('carousel-indicators');

          // Clear any existing content
          shortsContainer.innerHTML = '';
          indicatorsContainer.innerHTML = '';

          // Current short index
          let currentIndex = 0;

          // Create shorts and indicators
          shorts.forEach((short, index) => {
            // Create short item
            const shortItem = document.createElement('div');
            shortItem.className = 'short-item';

            // Create video element - either a standard video or an iframe for YouTube
            let video;

            if (short.isYoutubeEmbed) {
              // Create an iframe for YouTube embeds
              video = document.createElement('iframe');
              video.className = 'youtube-embed';
              video.src = short.url;
              video.frameBorder = '0';
              video.allowFullscreen = true;
              video.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            } else {
              // Create a standard video element for other videos
              video = document.createElement('video'); // Need to create the element here
              video.controls = true;
              video.src = short.url;
            }

            // Create caption
            const caption = document.createElement('div');
            caption.className = 'short-caption';
            caption.textContent = short.caption;

            // Timestamp will be added after the video element

            // Add fallback message if needed
            if (short.isFallback) {
              const fallbackMessage = document.createElement('div');
              fallbackMessage.className = 'fallback-message';
              fallbackMessage.textContent = 'Playing the viral segment directly from YouTube.';
              shortItem.appendChild(fallbackMessage);
            }

            // Add error handler for video (only for standard video elements, not iframes)
            if (!short.isYoutubeEmbed) {
              video.onerror = function() {
                console.log('Video error:', video.error);

                // For YouTube videos, create a direct link to the timestamp
                if (short.youtubeId) {
                  const videoLink = document.createElement('a');
                  videoLink.href = `https://www.youtube.com/watch?v=${short.youtubeId}&t=${short.startTime}s`;
                  videoLink.target = '_blank';
                  videoLink.textContent = 'Watch on YouTube';
                  videoLink.className = 'video-fallback-link';
                  shortItem.appendChild(videoLink);
                } else {
                  // For other videos
                  const videoLink = document.createElement('a');
                  videoLink.href = short.url;
                  videoLink.target = '_blank';
                  videoLink.textContent = 'Click to view video';
                  videoLink.className = 'video-fallback-link';
                  shortItem.appendChild(videoLink);
                }
              };
            }

            // Append elements in the correct order
            shortItem.appendChild(video);

            // Add timestamp info if available
            if (short.startTime !== undefined) {
              const timestamp = document.createElement('div');
              timestamp.className = 'timestamp';
              const startTime = formatTime(short.startTime);
              const endTime = short.endTime ? formatTime(short.endTime) : formatTime(short.startTime + 15);
              timestamp.textContent = `Viral segment: ${startTime} - ${endTime}`;
              shortItem.appendChild(timestamp);
            }

            shortItem.appendChild(caption);
            shortsContainer.appendChild(shortItem);

            // Create indicator
            const indicator = document.createElement('div');
            indicator.className = index === 0 ? 'indicator active' : 'indicator';
            indicator.dataset.index = index;
            indicatorsContainer.appendChild(indicator);

            // Add click event to indicator
            indicator.addEventListener('click', function() {
              goToShort(parseInt(this.dataset.index));
            });
          });

          // Add event listeners for carousel navigation
          document.getElementById('prev-short').addEventListener('click', function() {
            goToShort(currentIndex - 1);
          });

          document.getElementById('next-short').addEventListener('click', function() {
            goToShort(currentIndex + 1);
          });

          // Function to navigate to a specific short
          function goToShort(index) {
            // Ensure index is within bounds
            if (index < 0) index = shorts.length - 1;
            if (index >= shorts.length) index = 0;

            // Update current index
            currentIndex = index;

            // Update transform
            shortsContainer.style.transform = `translateX(-${currentIndex * 100}%)`;

            // Update indicators
            document.querySelectorAll('.indicator').forEach((ind, i) => {
              if (i === currentIndex) {
                ind.classList.add('active');
              } else {
                ind.classList.remove('active');
              }
            });

            // Pause all videos except the current one
            document.querySelectorAll('.short-item video').forEach((vid, i) => {
              if (i === currentIndex) {
                vid.play().catch(e => console.log('Auto-play prevented:', e));
              } else {
                vid.pause();
              }
            });
          }
        } else {
          // Show error
          const errorMsg = response ? response.error : 'Unknown error';
          console.error('Error creating short:', errorMsg);
          alert('Error creating short: ' + errorMsg);
        }
      });

      // Deduct credits after a delay
      setTimeout(() => {
        deductCredits(50);
      }, 1000);

      // Update processing message after a delay
      setTimeout(() => {
        processingText.textContent = 'Creating your short video...';
      }, 3000);
    });
  });

  // Download button click handler
  document.getElementById('download-short').addEventListener('click', function() {
    // Check if user has enough credits
    if (!hasEnoughCredits(10)) {
      alert('Not enough credits. Please purchase more credits to continue.');
      return;
    }

    // Get the current short URL from the active carousel item
    const currentShortIndex = getCurrentShortIndex();
    const currentShortUrl = getShortUrlByIndex(currentShortIndex);

    if (!currentShortUrl) {
      alert('No short available to download');
      return;
    }

    chrome.runtime.sendMessage({action: 'downloadShort', url: currentShortUrl}, function(response) {
      if (response && response.success) {
        // Deduct credits
        deductCredits(10);
      } else {
        alert('Error downloading short: ' + (response ? response.error : 'Unknown error'));
      }
    });
  });

  // Share button click handler
  document.getElementById('share-short').addEventListener('click', function() {
    // Get the current short URL from the active carousel item
    const currentShortIndex = getCurrentShortIndex();
    const currentShortUrl = getShortUrlByIndex(currentShortIndex);

    if (!currentShortUrl) {
      alert('No short available to share');
      return;
    }

    chrome.runtime.sendMessage({action: 'shareShort', url: currentShortUrl}, function(response) {
      if (!response || !response.success) {
        alert('Error sharing short: ' + (response ? response.error : 'Unknown error'));
      }
    });
  });

  // Helper function to get current short index
  function getCurrentShortIndex() {
    const activeIndicator = document.querySelector('.indicator.active');
    return activeIndicator ? parseInt(activeIndicator.dataset.index) : 0;
  }

  // Helper function to get short URL by index
  function getShortUrlByIndex(index) {
    const videos = document.querySelectorAll('.short-item video');
    if (videos.length > index) {
      return videos[index].src;
    }
    return null;
  }

  // Schedule on TikTok button click handler
  document.getElementById('schedule-tiktok').addEventListener('click', function() {
    // Check if user has enough credits
    if (!hasEnoughCredits(20)) {
      alert('Not enough credits. Please purchase more credits to continue.');
      return;
    }

    // Get the current short URL from the active carousel item
    const currentShortIndex = getCurrentShortIndex();
    const currentShortUrl = getShortUrlByIndex(currentShortIndex);

    if (!currentShortUrl) {
      alert('No short available to schedule');
      return;
    }

    const tiktokCaption = document.getElementById('tiktok-caption').value;
    const scheduleTime = document.getElementById('schedule-time').value;

    if (!tiktokCaption) {
      alert('Please enter a caption for your TikTok post.');
      return;
    }

    if (!scheduleTime) {
      alert('Please select a schedule time for your TikTok post.');
      return;
    }

    chrome.runtime.sendMessage({
      action: 'scheduleTikTok',
      caption: tiktokCaption,
      scheduleTime: scheduleTime,
      videoUrl: currentShortUrl
    }, function(response) {
      if (response && response.success) {
        // Deduct credits
        deductCredits(20);
        alert('Your video has been scheduled for posting on TikTok!');
      } else {
        alert('Error scheduling TikTok post: ' + (response ? response.error : 'Unknown error'));
      }
    });
  });

  // Download Full Video button click handler
  document.getElementById('download-full-video').addEventListener('click', function() {
    // Check if user has enough credits
    if (!hasEnoughCredits(30)) {
      alert('Not enough credits. Please purchase more credits to continue.');
      return;
    }

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

      // Define downloadButton and originalText here
      const downloadButton = document.getElementById('download-full-video');
      const originalText = downloadButton.textContent;

      // Send message to background script to download the full video
      chrome.runtime.sendMessage({action: 'downloadFullVideo', videoId: videoId}, function(response) {
        // Reset button state
        downloadButton.textContent = originalText;
        downloadButton.disabled = false;

        if (response && response.success) {
          // Deduct credits
          deductCredits(30);
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
    const resetButton = document.getElementById('reset-api-keys'); // Need reference to resetButton for originalText
    const originalText = testButton.textContent; // Use testButton's text content
    testButton.textContent = 'Testing...';
    testButton.disabled = true;

    // Send message to background script to test Sieve connection
    chrome.runtime.sendMessage({action: 'testSieveConnection'}, function(response) {
      // Reset button state
      testButton.textContent = originalText;
      testButton.disabled = false;

      if (response && response.success) {
        alert('Sieve API connection test successful! Status: ' + response.status);
      } else {
        alert('Sieve API connection test failed: ' + (response ? response.error : 'Unknown error'));
      }
    });
  });

  // Purchase button click handler
  document.querySelectorAll('.purchase-btn').forEach(button => {
    button.addEventListener('click', function() {
      const priceId = this.dataset.priceId;

      if (!priceId || priceId.includes('_placeholder')) {
        alert('Stripe Price ID is not configured for this package. Please contact support or replace the placeholder in the code.');
        return;
      }

      // Redirect to Stripe Checkout
      stripe.redirectToCheckout({
        lineItems: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        // Define success and cancel URLs. These should be actual URLs.
        // For extensions, handling this might require a dedicated web page or
        // listening for specific navigation events in the background script.
        successUrl: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}', // Replace with your success URL
        cancelUrl: 'https://example.com/cancel', // Replace with your cancel URL
      }).then(function (result) {
        if (result.error) {
          // If redirectToCheckout fails due to a browser or network
          // error, display the localized error message to your customer.
          alert(result.error.message);
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
      // First time using the extension, set default credits
      chrome.storage.sync.set({credits: credits});
    }

    // Update the UI
    document.getElementById('credits-value').textContent = credits;
  });
}

// Function to check if user has enough credits
function hasEnoughCredits(cost) {
  const creditsElement = document.getElementById('credits-value');
  const currentCredits = parseInt(creditsElement.textContent);
  return currentCredits >= cost;
}

// Function to deduct credits
function deductCredits(amount) {
  chrome.storage.sync.get(['credits'], function(result) {
    let credits = result.credits !== undefined ? result.credits : 1000;
    credits -= amount;

    // Update storage
    chrome.storage.sync.set({credits: credits});

    // Update the UI
    document.getElementById('credits-value').textContent = credits;
  });
}
