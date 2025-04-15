// Popup Enhancer for ViralAI Extension
// This script enhances the popup with dynamic updates and improved viral segment visualization

(function() {
  console.log('ViralAI Popup Enhancer: Initializing...');
  
  // Check if the enhancer has already been applied
  if (window.popupEnhancerApplied) {
    console.log('ViralAI Popup Enhancer: Already applied, skipping');
    return;
  }
  
  // Mark as applied to prevent multiple applications
  window.popupEnhancerApplied = true;
  
  // Wait for DOM content to be loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('ViralAI Popup Enhancer: DOM content loaded, applying enhancements');
    
    // Add enhanced viral detection UI elements
    addEnhancedUI();
    
    // Set up real-time updates for short results
    setupRealTimeUpdates();
    
    // Enhance the create short button
    enhanceCreateShortButton();
    
    // Add audio visualization for viral segments
    addAudioVisualization();
  });
  
  // Function to add enhanced UI elements
  function addEnhancedUI() {
    // Add a toggle for enhanced viral detection
    const viralDetectionToggle = document.getElementById('viral-detection');
    if (viralDetectionToggle) {
      // Create a new toggle for enhanced detection
      const optionGroup = viralDetectionToggle.closest('.option-group');
      if (optionGroup) {
        const enhancedToggleGroup = optionGroup.cloneNode(true);
        const enhancedToggle = enhancedToggleGroup.querySelector('input');
        const enhancedLabel = enhancedToggleGroup.querySelector('.toggle-label');
        
        if (enhancedToggle && enhancedLabel) {
          enhancedToggle.id = 'enhanced-detection';
          enhancedToggle.checked = true;
          enhancedLabel.textContent = 'Enhanced audio & visual analysis';
          
          // Add a label before the toggle
          const labelElement = enhancedToggleGroup.querySelector('label');
          if (labelElement) {
            labelElement.setAttribute('for', 'enhanced-detection');
            labelElement.innerHTML = '<i class="fas fa-brain"></i> Enhanced Detection:';
          }
          
          // Insert after the original toggle
          optionGroup.parentNode.insertBefore(enhancedToggleGroup, optionGroup.nextSibling);
        }
      }
    }
    
    // Add a viral info section if it doesn't exist
    if (!document.getElementById('viral-info')) {
      const resultSection = document.getElementById('result');
      if (resultSection) {
        const viralInfoSection = document.createElement('div');
        viralInfoSection.id = 'viral-info';
        viralInfoSection.className = 'viral-info hidden';
        viralInfoSection.innerHTML = `
          <h4><i class="fas fa-virus"></i> Why This Segment Is Viral</h4>
          <p id="viral-reason" class="viral-reason"></p>
          <div class="transcript-segment">
            <h5>Transcript Segment:</h5>
            <p id="transcript-text" class="transcript-text"></p>
          </div>
          <div class="audio-features">
            <h5>Audio Analysis:</h5>
            <div class="audio-visualization" id="audio-visualization"></div>
            <div class="audio-metrics">
              <span class="audio-metric"><i class="fas fa-volume-up"></i> Energy: <span id="audio-energy">0.8</span></span>
              <span class="audio-metric"><i class="fas fa-bolt"></i> Excitement: <span id="audio-excitement">0.8</span></span>
              <span class="audio-metric"><i class="fas fa-star"></i> Uniqueness: <span id="audio-uniqueness">0.8</span></span>
            </div>
          </div>
        `;
        
        // Add before the result actions
        const resultActions = resultSection.querySelector('.result-actions');
        if (resultActions) {
          resultSection.insertBefore(viralInfoSection, resultActions);
        } else {
          resultSection.appendChild(viralInfoSection);
        }
      }
    }
    
    // Add styles for the new elements
    addStyles();
  }
  
  // Function to set up real-time updates for short results
  function setupRealTimeUpdates() {
    // Listen for short result updates from the background script
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.action === 'shortResultUpdated' && request.result) {
        console.log('ViralAI Popup Enhancer: Received short result update:', request.result);
        updatePopupWithShortResult(request.result);
      }
    });
    
    // Poll for updates every 2 seconds
    setInterval(function() {
      chrome.runtime.sendMessage({action: 'getLatestShortResult'}, function(response) {
        if (response && response.success && response.result) {
          updatePopupWithShortResult(response.result);
        }
      });
    }, 2000);
  }
  
  // Function to update the popup with the latest short result
  function updatePopupWithShortResult(result) {
    // Update the processing message if we're still processing
    if (result.status === 'processing') {
      const processingText = document.querySelector('#processing p');
      if (processingText) {
        processingText.textContent = result.message || 'Processing your short...';
      }
      
      // Show progress if available
      if (result.progress) {
        let progressBar = document.getElementById('processing-progress');
        if (!progressBar) {
          // Create progress bar if it doesn't exist
          const processingDiv = document.getElementById('processing');
          if (processingDiv) {
            progressBar = document.createElement('div');
            progressBar.id = 'processing-progress';
            progressBar.className = 'progress-bar';
            progressBar.innerHTML = '<div class="progress-fill"></div>';
            processingDiv.appendChild(progressBar);
          }
        }
        
        // Update progress bar
        if (progressBar) {
          const progressFill = progressBar.querySelector('.progress-fill');
          if (progressFill) {
            progressFill.style.width = `${result.progress}%`;
          }
        }
      }
      
      // Show processing div and hide result
      const processingDiv = document.getElementById('processing');
      const resultDiv = document.getElementById('result');
      if (processingDiv && resultDiv) {
        processingDiv.classList.remove('hidden');
        resultDiv.classList.add('hidden');
      }
    }
    
    // If completed, update the result section
    if (result.status === 'completed' && result.success) {
      // Hide processing and show result
      const processingDiv = document.getElementById('processing');
      const resultDiv = document.getElementById('result');
      if (processingDiv && resultDiv) {
        processingDiv.classList.add('hidden');
        resultDiv.classList.remove('hidden');
      }
      
      // Update the shorts container if it exists
      updateShortsContainer(result);
      
      // Update the viral info section
      updateViralInfo(result);
    }
    
    // If there was an error, show it
    if (result.status === 'error') {
      const processingText = document.querySelector('#processing p');
      if (processingText) {
        processingText.textContent = result.message || 'Error creating short';
        processingText.style.color = '#e74c3c';
      }
    }
  }
  
  // Function to update the shorts container with the latest result
  function updateShortsContainer(result) {
    // Check if we have segments to display
    if (!result.segments || result.segments.length === 0) {
      // Just use the main result as a single segment
      const segments = [{
        id: 0,
        videoId: result.videoId,
        startTime: result.startTime || 0,
        endTime: (result.startTime || 0) + (result.duration || 15),
        duration: result.duration || 15,
        url: result.shortUrl || result.previewUrl,
        viralityScore: result.viralityScore || 80,
        explanation: result.explanation || 'Viral-worthy segment',
        transcriptText: result.transcriptText || 'No transcript available'
      }];
      
      createShortsCarousel(segments);
    } else {
      // Use the segments from the result
      createShortsCarousel(result.segments);
    }
  }
  
  // Function to create the shorts carousel
  function createShortsCarousel(segments) {
    const shortsContainer = document.getElementById('shorts-container');
    const carouselIndicators = document.getElementById('carousel-indicators');
    
    if (!shortsContainer || !carouselIndicators) {
      return;
    }
    
    // Clear existing content
    shortsContainer.innerHTML = '';
    carouselIndicators.innerHTML = '';
    
    // Add each segment to the carousel
    segments.forEach((segment, index) => {
      // Create short item
      const shortItem = document.createElement('div');
      shortItem.className = 'short-item';
      shortItem.dataset.index = index;
      
      // Create video element
      const video = document.createElement('video');
      video.controls = true;
      video.loop = true;
      video.src = segment.url;
      video.poster = `https://img.youtube.com/vi/${segment.videoId}/maxresdefault.jpg`;
      
      // Create caption
      const caption = document.createElement('div');
      caption.className = 'short-caption';
      caption.textContent = segment.explanation || `Viral segment #${index + 1}`;
      
      // Create timestamp
      const timestamp = document.createElement('div');
      timestamp.className = 'timestamp';
      const startTime = formatTime(segment.startTime);
      const endTime = formatTime(segment.endTime);
      timestamp.textContent = `Viral segment: ${startTime} - ${endTime}`;
      
      // Create virality score
      const viralityScore = document.createElement('div');
      viralityScore.className = 'virality-score';
      viralityScore.innerHTML = `<i class="fas fa-fire"></i> Virality Score: <span>${segment.viralityScore}%</span>`;
      
      // Add elements to short item
      shortItem.appendChild(video);
      shortItem.appendChild(timestamp);
      shortItem.appendChild(caption);
      shortItem.appendChild(viralityScore);
      
      // Add to container
      shortsContainer.appendChild(shortItem);
      
      // Add indicator
      const indicator = document.createElement('div');
      indicator.className = 'indicator' + (index === 0 ? ' active' : '');
      carouselIndicators.appendChild(indicator);
    });
    
    // Set up carousel navigation
    setupCarouselNavigation();
  }
  
  // Function to set up carousel navigation
  function setupCarouselNavigation() {
    const shortsContainer = document.getElementById('shorts-container');
    const prevButton = document.getElementById('prev-short');
    const nextButton = document.getElementById('next-short');
    const indicators = document.querySelectorAll('.indicator');
    
    if (!shortsContainer || !prevButton || !nextButton) {
      return;
    }
    
    // Current index
    let currentIndex = 0;
    
    // Function to go to a specific short
    function goToShort(index) {
      // Get total number of shorts
      const totalShorts = shortsContainer.querySelectorAll('.short-item').length;
      
      // Ensure index is within bounds
      if (index < 0) index = totalShorts - 1;
      if (index >= totalShorts) index = 0;
      
      // Update current index
      currentIndex = index;
      
      // Update transform
      shortsContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
      
      // Update indicators
      indicators.forEach((ind, i) => {
        if (i === currentIndex) {
          ind.classList.add('active');
        } else {
          ind.classList.remove('active');
        }
      });
      
      // Pause all videos except the current one
      shortsContainer.querySelectorAll('video').forEach((vid, i) => {
        if (i === currentIndex) {
          vid.play().catch(e => console.log('Auto-play prevented:', e));
        } else {
          vid.pause();
        }
      });
      
      // Update viral info section
      const shortItems = shortsContainer.querySelectorAll('.short-item');
      if (shortItems[currentIndex]) {
        const segment = shortItems[currentIndex].dataset;
        updateViralInfo({
          viralityScore: segment.viralityScore,
          explanation: segment.explanation,
          transcriptText: segment.transcriptText,
          audioFeatures: segment.audioFeatures ? JSON.parse(segment.audioFeatures) : null
        });
      }
    }
    
    // Set up button click handlers
    prevButton.addEventListener('click', () => goToShort(currentIndex - 1));
    nextButton.addEventListener('click', () => goToShort(currentIndex + 1));
    
    // Set up indicator click handlers
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => goToShort(index));
    });
    
    // Initialize the first short
    goToShort(0);
  }
  
  // Function to update the viral info section
  function updateViralInfo(result) {
    const viralInfoSection = document.getElementById('viral-info');
    const viralReason = document.getElementById('viral-reason');
    const transcriptText = document.getElementById('transcript-text');
    const audioEnergy = document.getElementById('audio-energy');
    const audioExcitement = document.getElementById('audio-excitement');
    const audioUniqueness = document.getElementById('audio-uniqueness');
    
    if (!viralInfoSection) {
      return;
    }
    
    // Show the section
    viralInfoSection.classList.remove('hidden');
    
    // Update reason if available
    if (viralReason && result.explanation) {
      viralReason.textContent = result.explanation;
    }
    
    // Update transcript if available
    if (transcriptText && result.transcriptText) {
      transcriptText.textContent = result.transcriptText;
    }
    
    // Update audio features if available
    if (result.audioFeatures) {
      if (audioEnergy) {
        audioEnergy.textContent = result.audioFeatures.energy.toFixed(2);
      }
      if (audioExcitement) {
        audioExcitement.textContent = result.audioFeatures.excitement.toFixed(2);
      }
      if (audioUniqueness) {
        audioUniqueness.textContent = result.audioFeatures.uniqueness.toFixed(2);
      }
      
      // Update audio visualization
      updateAudioVisualization(result.audioFeatures);
    }
  }
  
  // Function to enhance the create short button
  function enhanceCreateShortButton() {
    const createShortButton = document.getElementById('create-short');
    if (createShortButton) {
      // Add a pulsing animation class
      createShortButton.classList.add('pulse-animation');
      
      // Update the text to reflect enhanced detection
      createShortButton.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Create Viral Short with AI';
      
      // Add a click handler to ensure enhanced detection is used
      const originalClickHandler = createShortButton.onclick;
      createShortButton.onclick = function(event) {
        // Check if enhanced detection is enabled
        const enhancedDetection = document.getElementById('enhanced-detection');
        if (enhancedDetection && enhancedDetection.checked) {
          // Add enhanced detection to options
          const options = {
            useEnhancedDetection: true,
            analyzeAudio: true,
            analyzeVisual: true
          };
          
          // Store options in a data attribute
          createShortButton.dataset.enhancedOptions = JSON.stringify(options);
        }
        
        // Call the original handler
        if (originalClickHandler) {
          originalClickHandler.call(this, event);
        }
      };
    }
  }
  
  // Function to add audio visualization
  function addAudioVisualization() {
    const audioVisualization = document.getElementById('audio-visualization');
    if (!audioVisualization) {
      return;
    }
    
    // Create bars for visualization
    for (let i = 0; i < 20; i++) {
      const bar = document.createElement('div');
      bar.className = 'audio-bar';
      bar.style.height = `${Math.random() * 100}%`;
      audioVisualization.appendChild(bar);
    }
  }
  
  // Function to update audio visualization
  function updateAudioVisualization(audioFeatures) {
    const audioVisualization = document.getElementById('audio-visualization');
    if (!audioVisualization) {
      return;
    }
    
    // Get all bars
    const bars = audioVisualization.querySelectorAll('.audio-bar');
    
    // Update heights based on energy
    const energy = audioFeatures.energy || 0.8;
    const excitement = audioFeatures.excitement || 0.8;
    
    bars.forEach((bar, index) => {
      // Create a pattern based on index
      const height = 30 + (Math.sin(index * 0.5) + 1) * 35 * energy;
      bar.style.height = `${height}%`;
      
      // Color based on excitement
      const hue = 220 + (excitement * 60);
      bar.style.backgroundColor = `hsl(${hue}, 70%, 50%)`;
    });
  }
  
  // Function to format time in MM:SS format
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  // Function to add styles for new elements
  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Enhanced UI Styles */
      .pulse-animation {
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.4);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(255, 0, 0, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(255, 0, 0, 0);
        }
      }
      
      .progress-bar {
        width: 100%;
        height: 8px;
        background-color: #f0f0f0;
        border-radius: 4px;
        margin-top: 10px;
        overflow: hidden;
      }
      
      .progress-fill {
        height: 100%;
        background-color: #ff0000;
        width: 0%;
        transition: width 0.5s ease;
      }
      
      .audio-features {
        margin-top: 15px;
      }
      
      .audio-visualization {
        height: 60px;
        display: flex;
        align-items: flex-end;
        gap: 2px;
        margin: 10px 0;
        background-color: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
        padding: 5px;
      }
      
      .audio-bar {
        flex: 1;
        background-color: #3498db;
        min-height: 3px;
        transition: height 0.3s ease, background-color 0.3s ease;
      }
      
      .audio-metrics {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #555;
      }
      
      .audio-metric {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      
      .audio-metric i {
        color: #3498db;
      }
      
      .virality-score {
        background-color: rgba(231, 76, 60, 0.1);
        color: #e74c3c;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: bold;
        margin-top: 10px;
        display: inline-block;
      }
    `;
    
    document.head.appendChild(style);
  }
})();
