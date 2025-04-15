// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Content script received message:', request);
  if (request.action === 'getVideoInfo') {
    // Extract video information from the page
    const videoTitle = document.querySelector('h1.title.style-scope.ytd-video-primary-info-renderer')?.textContent.trim();

    // Get video duration
    let videoDuration = '';
    const durationElement = document.querySelector('.ytp-time-duration');
    if (durationElement) {
      videoDuration = durationElement.textContent;
    }

    // Send response back to popup
    sendResponse({
      title: videoTitle,
      duration: videoDuration
    });
  }

  // Return true to indicate we will send a response asynchronously
  return true;
});

// Add "Create Viral Short" button to YouTube interface
function addCreateShortButton() {
  // Check if we're on a video page
  if (!window.location.href.includes('youtube.com/watch')) {
    return;
  }

  // Check if button already exists
  if (document.getElementById('viral-ai-button')) {
    return;
  }

  // Find the YouTube actions menu
  const actionsMenu = document.querySelector('#top-level-buttons-computed');
  if (!actionsMenu) {
    // Try again later if the menu isn't loaded yet
    setTimeout(addCreateShortButton, 1000);
    return;
  }

  // Create button
  const button = document.createElement('button');
  button.id = 'viral-ai-button';
  button.className = 'viral-ai-button';
  button.innerHTML = '<span>Create Viral Short</span>';
  button.style.cssText = `
    background-color: #ff0000;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 18px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    margin-left: 8px;
    display: flex;
    align-items: center;
  `;

  // Add click handler
  button.addEventListener('click', function() {
    // Get page metadata for viral features
    const pageTitle = document.title || '';

    // Try to get video description
    let pageDescription = '';
    const descriptionElement = document.querySelector('#description-text');
    if (descriptionElement) {
      pageDescription = descriptionElement.textContent || '';
    }

    // Try to get video tags
    let videoTags = [];
    const metaTags = document.querySelectorAll('meta[property="og:video:tag"]');
    if (metaTags && metaTags.length > 0) {
      videoTags = Array.from(metaTags).map(tag => tag.content);
    }

    // Open extension popup with metadata
    chrome.runtime.sendMessage({
      action: 'openPopup',
      pageTitle,
      pageDescription,
      videoTags
    });
  });

  // Add button to page
  actionsMenu.appendChild(button);
}

// Function to check if YouTube player is ready
function checkYouTubePlayerReady() {
  // Check for the YouTube player API
  if (typeof window.ytplayer !== 'undefined' && document.querySelector('.html5-video-player')) {
    console.log('YouTube player detected, adding ViralAI button');
    addCreateShortButton();
    return true;
  }
  return false;
}

// Wait for YouTube player to load with progressive backoff
function waitForYouTubePlayer(maxAttempts = 10, delay = 500) {
  let attempts = 0;

  function attemptToAddButton() {
    if (checkYouTubePlayerReady()) {
      return; // Success
    }

    attempts++;
    if (attempts < maxAttempts) {
      // Increase delay with each attempt (progressive backoff)
      setTimeout(attemptToAddButton, delay * Math.pow(1.2, attempts));
    } else {
      console.log('Reached maximum attempts to detect YouTube player, falling back to basic method');
      // Fallback to basic method
      setTimeout(addCreateShortButton, 2000);
    }
  }

  attemptToAddButton();
}

// Run when page loads
window.addEventListener('load', function() {
  waitForYouTubePlayer();
});

// Also run when URL changes (for YouTube's SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Only run on video pages
    if (url.includes('youtube.com/watch')) {
      waitForYouTubePlayer();
    }
  }
}).observe(document, {subtree: true, childList: true});
