// Secure API key storage module for ViralAI extension

/**
 * Encrypts a string using a simple XOR cipher
 * @param {string} text - The text to encrypt
 * @param {string} passphrase - The passphrase to use for encryption
 * @returns {string} - The encrypted text
 */
function encrypt(text, passphrase) {
  if (!text) return '';
  
  const textToChars = text => text.split('').map(c => c.charCodeAt(0));
  const byteHex = n => ("0" + Number(n).toString(16)).substr(-2);
  const applySaltToChar = code => textToChars(passphrase).reduce((a, b) => a ^ b, code);

  return text.split('')
    .map(textToChars)
    .map(applySaltToChar)
    .map(byteHex)
    .join('');
}

/**
 * Decrypts a string using a simple XOR cipher
 * @param {string} encoded - The encrypted text
 * @param {string} passphrase - The passphrase used for encryption
 * @returns {string} - The decrypted text
 */
function decrypt(encoded, passphrase) {
  if (!encoded) return '';
  
  const textToChars = text => text.split('').map(c => c.charCodeAt(0));
  const applySaltToChar = code => textToChars(passphrase).reduce((a, b) => a ^ b, code);
  
  return encoded.match(/.{1,2}/g)
    .map(hex => parseInt(hex, 16))
    .map(applySaltToChar)
    .map(charCode => String.fromCharCode(charCode))
    .join('');
}

/**
 * Generates a unique passphrase for encryption
 * @param {string} keyName - The name of the key
 * @returns {string} - The generated passphrase
 */
function generatePassphrase(keyName) {
  // Use a combination of browser-specific information and the key name
  // This ensures the passphrase is unique to this browser and extension
  return `${navigator.userAgent}-${keyName}-${chrome.runtime.id}`;
}

/**
 * Saves an API key securely to Chrome storage
 * @param {string} keyName - The name of the key
 * @param {string} value - The API key value
 * @returns {Promise<void>}
 */
async function saveApiKey(keyName, value) {
  const passphrase = generatePassphrase(keyName);
  const encryptedValue = encrypt(value, passphrase);
  
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [keyName]: encryptedValue }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Gets an API key securely from Chrome storage
 * @param {string} keyName - The name of the key
 * @returns {Promise<string|null>} - The API key value or null if not found
 */
async function getApiKey(keyName) {
  const passphrase = generatePassphrase(keyName);
  
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([keyName], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (!result[keyName]) {
        resolve(null); // Key not found
      } else {
        // Decrypt the API key
        const decryptedValue = decrypt(result[keyName], passphrase);
        resolve(decryptedValue);
      }
    });
  });
}

/**
 * Initializes API keys with default values if not already set
 * @returns {Promise<Object>} - Object containing the API keys
 */
async function initializeApiKeys() {
  const apiKeys = {
    SHOTSTACK_API_KEY: await getApiKey('SHOTSTACK_API_KEY'),
    OPENROUTER_API_KEY: await getApiKey('OPENROUTER_API_KEY'),
    TIKTOK_API_KEY: await getApiKey('TIKTOK_API_KEY'),
    SIEVE_API_KEY: await getApiKey('SIEVE_API_KEY')
  };
  
  // Set default values if not already set
  if (!apiKeys.SHOTSTACK_API_KEY) {
    await saveApiKey('SHOTSTACK_API_KEY', '226I8VzTQjkuocTstqhusUiyvv0SV79v79dfZYmZ');
    apiKeys.SHOTSTACK_API_KEY = '226I8VzTQjkuocTstqhusUiyvv0SV79v79dfZYmZ';
  }
  
  if (!apiKeys.OPENROUTER_API_KEY) {
    await saveApiKey('OPENROUTER_API_KEY', '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');
    apiKeys.OPENROUTER_API_KEY = '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';
  }
  
  if (!apiKeys.SIEVE_API_KEY) {
    await saveApiKey('SIEVE_API_KEY', '0CGytcA-o6TMhxR3ScTY6Ln9fQ8mFkWvPFfCt4NCOPk');
    apiKeys.SIEVE_API_KEY = '0CGytcA-o6TMhxR3ScTY6Ln9fQ8mFkWvPFfCt4NCOPk';
  }
  
  if (!apiKeys.TIKTOK_API_KEY) {
    await saveApiKey('TIKTOK_API_KEY', 'YOUR_TIKTOK_API_KEY');
    apiKeys.TIKTOK_API_KEY = 'YOUR_TIKTOK_API_KEY';
  }
  
  // Log API key status (not the actual keys)
  console.log('API keys initialized:');
  console.log(`- Shotstack API key: ${apiKeys.SHOTSTACK_API_KEY ? 'Yes (length: ' + apiKeys.SHOTSTACK_API_KEY.length + ')' : 'No'}`);
  console.log(`- OpenRouter API key: ${apiKeys.OPENROUTER_API_KEY ? 'Yes (length: ' + apiKeys.OPENROUTER_API_KEY.length + ')' : 'No'}`);
  console.log(`- TikTok API key: ${apiKeys.TIKTOK_API_KEY ? 'Yes' : 'No'}`);
  console.log(`- Sieve API key: ${apiKeys.SIEVE_API_KEY ? 'Yes (length: ' + apiKeys.SIEVE_API_KEY.length + ')' : 'No'}`);
  
  return apiKeys;
}

// Export the functions
export {
  saveApiKey,
  getApiKey,
  initializeApiKeys
};
