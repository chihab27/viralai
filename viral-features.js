// Viral optimization features for ViralAI

// Function to generate hashtags based on YouTube metadata
async function generateHashtags(videoTitle, videoDescription, videoTags = []) {
  // Combine all metadata
  const combinedText = `${videoTitle} ${videoDescription} ${videoTags.join(' ')}`;
  
  // Extract potential keywords
  const words = combinedText.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/) // Split by whitespace
    .filter(word => word.length > 3) // Only words longer than 3 characters
    .filter(word => !['this', 'that', 'with', 'from', 'have', 'what', 'when', 'where', 'which', 'there', 'their'].includes(word)); // Remove common words
  
  // Count word frequency
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Sort by frequency
  const sortedWords = Object.keys(wordCount).sort((a, b) => wordCount[b] - wordCount[a]);
  
  // Get top 10 words
  const topWords = sortedWords.slice(0, 10);
  
  // Add trending hashtags based on category
  const trendingHashtags = {
    gaming: ['#gaming', '#gamer', '#videogames', '#streamer', '#gaminglife'],
    music: ['#music', '#musician', '#newmusic', '#song', '#musicvideo'],
    education: ['#learning', '#education', '#study', '#student', '#knowledge'],
    entertainment: ['#entertainment', '#funny', '#comedy', '#fun', '#laugh'],
    sports: ['#sports', '#fitness', '#workout', '#athlete', '#training'],
    technology: ['#tech', '#technology', '#gadgets', '#innovation', '#coding'],
    travel: ['#travel', '#adventure', '#explore', '#wanderlust', '#travelblogger']
  };
  
  // Detect category from the content
  let detectedCategory = 'entertainment'; // Default
  const categoryKeywords = {
    gaming: ['game', 'gaming', 'play', 'player', 'xbox', 'playstation', 'nintendo', 'steam', 'fortnite', 'minecraft'],
    music: ['music', 'song', 'artist', 'band', 'concert', 'album', 'guitar', 'piano', 'singer', 'rap'],
    education: ['learn', 'education', 'school', 'college', 'university', 'student', 'teacher', 'course', 'lesson', 'tutorial'],
    sports: ['sport', 'fitness', 'workout', 'gym', 'exercise', 'training', 'athlete', 'football', 'basketball', 'soccer'],
    technology: ['tech', 'technology', 'computer', 'software', 'hardware', 'programming', 'code', 'developer', 'app', 'digital'],
    travel: ['travel', 'trip', 'vacation', 'adventure', 'explore', 'destination', 'journey', 'tourist', 'hotel', 'flight']
  };
  
  // Find the category with the most matching keywords
  let maxMatches = 0;
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    const matches = keywords.filter(keyword => combinedText.toLowerCase().includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedCategory = category;
    }
  }
  
  // Combine custom hashtags with trending ones
  const customHashtags = topWords.map(word => `#${word}`);
  const categoryHashtags = trendingHashtags[detectedCategory] || trendingHashtags.entertainment;
  
  // Add viral hashtags that work well across categories
  const viralHashtags = ['#viral', '#trending', '#fyp', '#foryou', '#foryoupage'];
  
  // Combine all hashtags and remove duplicates
  const allHashtags = [...customHashtags, ...categoryHashtags, ...viralHashtags];
  const uniqueHashtags = [...new Set(allHashtags)];
  
  // Return the top 15 hashtags
  return uniqueHashtags.slice(0, 15);
}

// Function to get trending audio options from TikTok
async function getTrendingAudio() {
  // In a real implementation, this would call the TikTok API
  // For now, we'll return a curated list of trending sounds
  
  return [
    {
      id: 'trending_sound_1',
      name: 'Oh No - Kreepa',
      description: 'Popular for fails and surprising moments',
      duration: 15,
      category: 'comedy'
    },
    {
      id: 'trending_sound_2',
      name: 'Monkeys Spinning Monkeys - Kevin MacLeod',
      description: 'Upbeat tune for funny/lighthearted content',
      duration: 30,
      category: 'comedy'
    },
    {
      id: 'trending_sound_3',
      name: 'original sound - Dramatic music',
      description: 'Perfect for revelations and dramatic moments',
      duration: 15,
      category: 'drama'
    },
    {
      id: 'trending_sound_4',
      name: 'STAY - The Kid LAROI & Justin Bieber',
      description: 'Popular for transitions and emotional content',
      duration: 20,
      category: 'music'
    },
    {
      id: 'trending_sound_5',
      name: 'Into The Thick Of It - The Backyardigans',
      description: 'Nostalgic sound for challenges and transitions',
      duration: 15,
      category: 'nostalgia'
    }
  ];
}

// Function to generate hook text for the first 3 seconds
async function generateHookText(videoTitle, transcript, segment) {
  // Extract key phrases from the title
  const titleWords = videoTitle.split(' ');
  const keyPhrases = [];
  
  // Look for phrases in quotes
  const quoteMatches = videoTitle.match(/"([^"]*)"/g);
  if (quoteMatches) {
    keyPhrases.push(...quoteMatches.map(match => match.replace(/"/g, '')));
  }
  
  // Look for phrases with special characters
  const specialCharMatches = videoTitle.match(/[!?]([^!?]*)[!?]/g);
  if (specialCharMatches) {
    keyPhrases.push(...specialCharMatches);
  }
  
  // If no special phrases found, use the first 3-5 words
  if (keyPhrases.length === 0) {
    keyPhrases.push(titleWords.slice(0, Math.min(5, titleWords.length)).join(' '));
  }
  
  // Generate hook templates
  const hookTemplates = [
    'WAIT FOR IT... 😱',
    'YOU WON\'T BELIEVE THIS 🤯',
    'WATCH UNTIL THE END 👀',
    'THIS CHANGES EVERYTHING ⚠️',
    `${keyPhrases[0].toUpperCase()} 🔥`,
    'POV: When you discover...',
    'The secret they don\'t want you to know:',
    'I was today years old when I learned...',
    'This will blow your mind:',
    'Only 1% of people know this:'
  ];
  
  // Select a hook based on the segment caption
  let selectedHook = hookTemplates[0];
  
  // If the segment caption contains certain keywords, choose a specific hook
  const caption = segment.caption.toLowerCase();
  if (caption.includes('reveal') || caption.includes('shock') || caption.includes('surprise')) {
    selectedHook = hookTemplates[1]; // YOU WON'T BELIEVE THIS
  } else if (caption.includes('end') || caption.includes('final') || caption.includes('last')) {
    selectedHook = hookTemplates[2]; // WATCH UNTIL THE END
  } else if (caption.includes('change') || caption.includes('transform') || caption.includes('different')) {
    selectedHook = hookTemplates[3]; // THIS CHANGES EVERYTHING
  } else if (caption.includes('secret') || caption.includes('hidden') || caption.includes('unknown')) {
    selectedHook = hookTemplates[8]; // This will blow your mind
  } else if (caption.includes('rare') || caption.includes('few') || caption.includes('percent')) {
    selectedHook = hookTemplates[9]; // Only 1% of people know this
  } else {
    // Use the key phrase if available, otherwise use a random hook
    selectedHook = keyPhrases.length > 0 ? 
      `${keyPhrases[0].toUpperCase()} 🔥` : 
      hookTemplates[Math.floor(Math.random() * hookTemplates.length)];
  }
  
  return selectedHook;
}

// Export the functions
export { generateHashtags, getTrendingAudio, generateHookText };
