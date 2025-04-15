// Script to apply the fix to the ViralAI extension

// Function to find the ViralAI extension
async function findViralAIExtension() {
  return new Promise((resolve) => {
    chrome.management.getAll((extensions) => {
      const viralAIExtension = extensions.find(ext => 
        ext.name.includes('ViralAI') || 
        ext.description.includes('viral') || 
        ext.description.includes('YouTube') && ext.description.includes('shorts')
      );
      
      resolve(viralAIExtension);
    });
  });
}

// Function to inject the fix script into the background page
async function injectFixScript(extensionId) {
  try {
    await chrome.scripting.executeScript({
      target: { extensionId: extensionId },
      files: ['fix-viralaiai.js']
    });
    
    console.log('Successfully injected fix script into ViralAI extension');
    return true;
  } catch (error) {
    console.error('Failed to inject fix script:', error);
    return false;
  }
}

// Function to apply the fix to the extension
async function applyFix() {
  try {
    // Find the ViralAI extension
    const extension = await findViralAIExtension();
    
    if (!extension) {
      console.error('ViralAI extension not found');
      return { success: false, error: 'ViralAI extension not found' };
    }
    
    console.log('Found ViralAI extension:', extension.id);
    
    // Inject the fix script
    const injected = await injectFixScript(extension.id);
    
    if (!injected) {
      return { 
        success: false, 
        error: 'Failed to inject fix script',
        extensionId: extension.id
      };
    }
    
    // Store the extension ID for future use
    chrome.storage.local.set({ viralAIExtensionId: extension.id });
    
    return { 
      success: true, 
      extensionId: extension.id,
      message: 'Fix applied successfully'
    };
  } catch (error) {
    console.error('Error applying fix:', error);
    return { success: false, error: error.message };
  }
}

// Apply the fix when the script is loaded
applyFix().then(result => {
  console.log('Fix application result:', result);
  
  // Send a message to the popup with the result
  if (chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ action: 'fixApplied', result });
  }
});
