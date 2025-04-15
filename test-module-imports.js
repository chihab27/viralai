// Test Module Imports
// This file tests that all the module imports work correctly

import { createShortWithViralDetection } from './viral-segment-integration.js';
import { processVideoForViralSegments, getBestViralSegment } from './viral-segment-processor.js';
import { detectViralSegments } from './viral-segment-detector.js';
import { downloadYouTubeVideo, downloadYouTubeSegment, getVideoTranscript } from './sieve-api.js';

console.log('All modules imported successfully!');

// Export a test function
export function testModuleImports() {
  return {
    success: true,
    message: 'All modules imported successfully!'
  };
}
