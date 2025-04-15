// Installation script for ViralAI extension fixes

/**
 * Applies the fixes to the background-worker.js file
 */
async function applyBackgroundWorkerFix() {
  try {
    // Get the current background-worker.js content
    const response = await fetch(chrome.runtime.getURL('background-worker.js'));
    const content = await response.text();
    
    // Check if the fix is already applied
    if (content.includes('// ViralAI Fix Applied')) {
      console.log('Background worker fix already applied');
      return true;
    }
    
    // Load the patch content
    const patchResponse = await fetch(chrome.runtime.getURL('background-worker-patch.js'));
    const patchContent = await patchResponse.text();
    
    // Create the fixed content
    const fixedContent = `
// ViralAI Fix Applied
${patchContent}

${content}
    `;
    
    // Save the fixed content
    const blob = new Blob([fixedContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    
    // Download the fixed file
    chrome.downloads.download({
      url: url,
      filename: 'background-worker.js',
      saveAs: true
    });
    
    return true;
  } catch (error) {
    console.error('Error applying background worker fix:', error);
    return false;
  }
}

/**
 * Applies the viral detection fix
 */
async function applyViralDetectionFix() {
  try {
    // Load the viral detection fix
    const response = await fetch(chrome.runtime.getURL('viral-detection-fix.js'));
    const content = await response.text();
    
    // Save the file
    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    
    // Download the file
    chrome.downloads.download({
      url: url,
      filename: 'viral-detection-fix.js',
      saveAs: true
    });
    
    return true;
  } catch (error) {
    console.error('Error applying viral detection fix:', error);
    return false;
  }
}

/**
 * Applies the secure API storage fix
 */
async function applySecureApiStorageFix() {
  try {
    // Load the secure API storage fix
    const response = await fetch(chrome.runtime.getURL('secure-api-storage.js'));
    const content = await response.text();
    
    // Save the file
    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    
    // Download the file
    chrome.downloads.download({
      url: url,
      filename: 'secure-api-storage.js',
      saveAs: true
    });
    
    return true;
  } catch (error) {
    console.error('Error applying secure API storage fix:', error);
    return false;
  }
}

/**
 * Applies all fixes
 */
async function applyAllFixes() {
  const results = await Promise.all([
    applyBackgroundWorkerFix(),
    applyViralDetectionFix(),
    applySecureApiStorageFix()
  ]);
  
  return results.every(result => result);
}

// Export the functions
export {
  applyBackgroundWorkerFix,
  applyViralDetectionFix,
  applySecureApiStorageFix,
  applyAllFixes
};
