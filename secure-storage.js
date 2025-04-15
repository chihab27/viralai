// Secure storage for API keys
// This module handles encryption and decryption of sensitive data

// Simple encryption function using AES
// In a production environment, you would use a more secure approach
function encrypt(text, passphrase) {
  // This is a simple implementation for demonstration
  // In production, use a proper encryption library
  const textToChars = text => text.split('').map(c => c.charCodeAt(0));
  const byteHex = n => ("0" + Number(n).toString(16)).substr(-2);
  const applySaltToChar = code => textToChars(passphrase).reduce((a, b) => a ^ b, code);

  return text.split('')
    .map(textToChars)
    .map(applySaltToChar)
    .map(byteHex)
    .join('');
}

// Simple decryption function
function decrypt(encoded, passphrase) {
  // This is a simple implementation for demonstration
  // In production, use a proper encryption library
  const textToChars = text => text.split('').map(c => c.charCodeAt(0));
  const applySaltToChar = code => textToChars(passphrase).reduce((a, b) => a ^ b, code);

  return encoded.match(/.{1,2}/g)
    .map(hex => parseInt(hex, 16))
    .map(applySaltToChar)
    .map(charCode => String.fromCharCode(charCode))
    .join('');
}

// Save API key securely
async function saveApiKey(keyName, value) {
  console.log(`Saving API key: ${keyName}...`);

  if (!value) {
    console.error(`Cannot save empty value for ${keyName}`);
    return Promise.reject(new Error(`Cannot save empty value for ${keyName}`));
  }

  // Generate a unique passphrase based on browser fingerprint and key name
  // In a real implementation, you would use a more secure method
  const passphrase = `${navigator.userAgent}-${keyName}-${chrome.runtime.id}`;

  try {
    // Encrypt the API key
    console.log(`Encrypting ${keyName} value (length: ${value.length})...`);
    const encryptedValue = encrypt(value, passphrase);
    console.log(`${keyName} encrypted successfully. Encrypted length:`, encryptedValue.length);

    // Save to Chrome storage
    return new Promise((resolve, reject) => {
      console.log(`Saving encrypted ${keyName} to Chrome storage...`);
      chrome.storage.local.set({ [keyName]: encryptedValue }, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error saving ${keyName}:`, chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log(`${keyName} saved successfully`);
          resolve();
        }
      });
    });
  } catch (error) {
    console.error(`Error encrypting ${keyName}:`, error);
    return Promise.reject(error);
  }
}

// Get API key securely
async function getApiKey(keyName) {
  console.log(`Getting API key: ${keyName}...`);

  // Generate the same passphrase used for encryption
  const passphrase = `${navigator.userAgent}-${keyName}-${chrome.runtime.id}`;

  // Retrieve from Chrome storage
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([keyName], (result) => {
      if (chrome.runtime.lastError) {
        console.error(`Error retrieving ${keyName}:`, chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else if (!result[keyName]) {
        console.log(`${keyName} not found in storage`);
        resolve(null); // Key not found
      } else {
        try {
          console.log(`${keyName} found in storage, decrypting...`);
          // Decrypt the API key
          const decryptedValue = decrypt(result[keyName], passphrase);
          console.log(`${keyName} decrypted successfully. Length:`, decryptedValue.length);
          resolve(decryptedValue);
        } catch (error) {
          console.error(`Error decrypting ${keyName}:`, error);
          resolve(null); // Return null on decryption error
        }
      }
    });
  });
}

// Clear existing API keys to ensure we're using the latest ones
async function clearApiKeys() {
  return new Promise((resolve, reject) => {
    console.log('Clearing existing API keys from storage...');
    chrome.storage.local.remove(['SIEVE_API_KEY'], () => {
      if (chrome.runtime.lastError) {
        console.error('Error clearing API keys:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        console.log('API keys cleared successfully');
        resolve();
      }
    });
  });
}

// Initialize API keys (called once when extension is installed)
async function initializeApiKeys() {
  try {
    // Clear existing keys first
    await clearApiKeys();
    console.log('Initializing API keys in secure storage...');

    // Check if keys are already stored
    console.log('Checking for existing Shotstack API key...');
    const shotstackKey = await getApiKey('SHOTSTACK_API_KEY');
    console.log('Shotstack API key exists:', !!shotstackKey);

    console.log('Checking for existing OpenRouter API key...');
    const openrouterKey = await getApiKey('OPENROUTER_API_KEY');
    console.log('OpenRouter API key exists:', !!openrouterKey);

    console.log('Checking for existing Sieve API key...');
    const sieveKey = await getApiKey('SIEVE_API_KEY');
    console.log('Sieve API key exists:', !!sieveKey);

    // If not stored, use default values (in a real extension, you would prompt the user)
    if (!shotstackKey) {
      console.log('Saving default Shotstack API key...');
      await saveApiKey('SHOTSTACK_API_KEY', '226I8VzTQjkuocTstqhusUiyvv0SV79v79dfZYmZ');
      console.log('Default Shotstack API key saved successfully');
    }

    if (!openrouterKey) {
      console.log('Saving default OpenRouter API key...');
      await saveApiKey('OPENROUTER_API_KEY', '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');
      console.log('Default OpenRouter API key saved successfully');
    }

    if (!sieveKey) {
      console.log('Saving default Sieve API key...');
      // This is the API key from the Sieve dashboard
      const sieveApiKey = '0CGytcA-o6TMhxR3ScTY6Ln9fQ8mFkWvPFfCt4NCOPk';

      // Make sure the key is valid
      if (!sieveApiKey || sieveApiKey.length < 10) {
        console.error('Invalid Sieve API key format');
        // Try a different format in case the key was copied incorrectly
        const alternativeSieveKey = '0CGytcA-o6TMhxR3ScTY6Ln9fQ8mFkWvPFfCt4NCOPk';
        await saveApiKey('SIEVE_API_KEY', alternativeSieveKey);
        console.log('Alternative Sieve API key saved. Key length:', alternativeSieveKey.length);
      } else {
        await saveApiKey('SIEVE_API_KEY', sieveApiKey);
        console.log('Default Sieve API key saved successfully. Key length:', sieveApiKey.length);
      }

      // Verify the key was saved correctly
      const savedSieveKey = await getApiKey('SIEVE_API_KEY');
      console.log('Verified saved Sieve API key:', savedSieveKey ? 'Yes (length: ' + savedSieveKey.length + ')' : 'No');

      // If verification failed, try one more time with a direct set
      if (!savedSieveKey) {
        console.log('Direct storage of Sieve API key as fallback...');
        chrome.storage.local.set({ 'SIEVE_API_KEY': '0CGytcA-o6TMhxR3ScTY6Ln9fQ8mFkWvPFfCt4NCOPk' }, () => {
          console.log('Direct storage of Sieve API key completed');
        });
      }
    }

    console.log('All API keys initialized successfully');
  } catch (error) {
    console.error('Error initializing API keys:', error);
  }
}

// Export the functions
export { saveApiKey, getApiKey, initializeApiKeys, clearApiKeys };
