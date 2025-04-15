// This script tests communication between the popup and background page

console.log('Ping script loaded');

// Function to test communication with the background page
function testBackgroundCommunication() {
  console.log('Testing communication with background page...');
  
  chrome.runtime.sendMessage({action: 'ping', message: 'Hello from popup!'}, function(response) {
    if (chrome.runtime.lastError) {
      console.error('Error communicating with background page:', chrome.runtime.lastError);
      document.getElementById('ping-result').textContent = 'Error: ' + chrome.runtime.lastError.message;
    } else {
      console.log('Received response from background page:', response);
      document.getElementById('ping-result').textContent = 'Success! Background page is running.';
    }
  });
}

// Add a ping button to the popup
function addPingButton() {
  console.log('Adding ping button to popup...');
  
  // Create the ping button
  const pingButton = document.createElement('button');
  pingButton.id = 'ping-button';
  pingButton.className = 'debug-btn';
  pingButton.innerHTML = '<i class="fas fa-exchange-alt"></i> Test Background Connection';
  
  // Create the result element
  const pingResult = document.createElement('div');
  pingResult.id = 'ping-result';
  pingResult.style.fontSize = '12px';
  pingResult.style.marginTop = '5px';
  pingResult.style.color = '#666';
  
  // Add click handler
  pingButton.addEventListener('click', testBackgroundCommunication);
  
  // Add to the debug actions section
  const debugActions = document.querySelector('.debug-actions');
  if (debugActions) {
    debugActions.appendChild(pingButton);
    debugActions.appendChild(pingResult);
  }
}

// Run when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Ping script DOM content loaded');
  addPingButton();
});
