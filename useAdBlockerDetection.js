/**
 * AdBlocker Detection Utility
 * Various methods for detecting ad blockers and YouTube blocking
 */
const showDebug = false;
/**
 * Checks if YouTube content is blocked (thumbnail test)
 * @returns {Promise<boolean>} true if blocked, false if available
 */
export const checkYouTubeBlocked = async () => {
  try {
    const img = new Image();
    img.src = 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg';

    return new Promise((resolve) => {
      img.onload = () => {
        if(showDebug) console.log('YouTube thumbnail loaded successfully');
        resolve(false); // NOT blocked
      };
      img.onerror = () => {
        if(showDebug) console.log('YouTube thumbnail failed to load');
        resolve(true); // blocked
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        if(showDebug) console.log('YouTube thumbnail test timed out');
        resolve(true); // assume blocked if timeout
      }, 5000);
    });
  } catch (error) {
    if(showDebug) console.error('Error in checkYouTubeBlocked:', error);
    return true; // assume blocked on error
  }
};

/**
 * General ad blocker detection via test element
 * @returns {boolean} true if ad blocker detected, false if not
 */
export const detectAdBlocker = () => {
  try {
    const testElement = document.createElement('div');
    testElement.innerHTML = '&nbsp;';
    testElement.className = 'adsbox';
    testElement.style.cssText = 'position: absolute; left: -999px; width: 1px; height: 1px;';

    document.body.appendChild(testElement);

    // Small delay to let ad blockers act
    setTimeout(() => {
      const isBlocked =
        testElement.offsetHeight === 0 ||
        testElement.offsetWidth === 0 ||
        testElement.style.display === 'none' ||
        testElement.style.visibility === 'hidden';

      document.body.removeChild(testElement);
      return isBlocked;
    }, 100);

    const isBlocked =
      testElement.offsetHeight === 0 ||
      testElement.offsetWidth === 0 ||
      testElement.style.display === 'none' ||
      testElement.style.visibility === 'hidden';

    document.body.removeChild(testElement);
    return isBlocked;
  } catch (error) {
    if(showDebug) console.error('Error in detectAdBlocker:', error);
    return false; // assume no ad blocker on error
  }
};

/**
 * Checks YouTube availability via favicon
 * @returns {Promise<boolean>} true if blocked, false if available
 */
export const checkYouTubeFavicon = async () => {
  try {
    const response = await fetch('https://www.youtube.com/favicon.ico', {
      mode: 'no-cors',
      cache: 'no-cache',
    });
    return false; // NOT blocked
  } catch (error) {
    if(showDebug) console.log('YouTube favicon test failed:', error);
    return true; // blocked
  }
};

/**
 * Checks YouTube availability via script loading
 * @returns {Promise<boolean>} true if blocked, false if available
 */
export const checkYouTubeScript = () =>
  new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';

    const cleanup = () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };

    script.onload = () => {
      if(showDebug) console.log('YouTube script loaded successfully');
      cleanup();
      resolve(false); // NOT blocked
    };

    script.onerror = () => {
      if(showDebug) console.log('YouTube script failed to load');
      cleanup();
      resolve(true); // blocked
    };

    document.head.appendChild(script);

    // Timeout after 5 seconds
    setTimeout(() => {
      if(showDebug) console.log('YouTube script test timed out');
      cleanup();
      resolve(true); // assume blocked if timeout
    }, 5000);
  });

/**
 * Robust YouTube blocking detection with multiple tests
 * @param {Object} options - Configuration options
 * @param {boolean} options.useAllTests - Use all tests (default: false)
 * @param {number} options.timeout - Timeout in ms (default: 5000)
 * @returns {Promise<boolean>} true if blocked, false if available
 */
export const detectYouTubeBlocking = async (options = {}) => {
  const { useAllTests = false, timeout = 5000 } = options;

  if(showDebug) console.log('Starting YouTube blocking detection...');

  const tests = [
    // Test 1: YouTube Thumbnail (usually most reliable test)
    async () => {
      console.log('Running thumbnail test...');
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = () => {
         if(showDebug) console.log('✓ Thumbnail test: NOT blocked');
          resolve(false);
        };
        img.onerror = () => {
          if(showDebug) console.log('✗ Thumbnail test: BLOCKED');
          resolve(true);
        };
        img.src = 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg';

        setTimeout(() => {
          if(showDebug) console.log('✗ Thumbnail test: TIMEOUT (assumed blocked)');
          resolve(true);
        }, timeout);
      });
    },
  ];

  // Additional tests only if requested
  if (useAllTests) {
    tests.push(
      // General ad blocker test
      async () => {
        if(showDebug) console.log('Running general ad blocker test...');
        const result = detectAdBlocker();
        if(showDebug) console.log(result ? '✗ Ad blocker test: DETECTED' : '✓ Ad blocker test: NOT detected');
        return result;
      },

      // YouTube Script test
      async () => {
        if(showDebug) console.log('Running script test...');
        const result = await checkYouTubeScript();
        if(showDebug) console.log(result ? '✗ Script test: BLOCKED' : '✓ Script test: NOT blocked');
        return result;
      },
    );
  }

  try {
    // Execute all test functions and wait for results
    const results = await Promise.all(tests.map((testFunc) => testFunc()));
    if(showDebug) console.log('Test results:', results);

    // If any test indicates blocking, return true
    const isBlocked = results.some((blocked) => blocked);
    if(showDebug) console.log('Final result - YouTube blocked:', isBlocked);

    return isBlocked;
  } catch (error) {
    if(showDebug) console.error('Error in YouTube blocking detection:', error);
    return true; // assume blocked on error
  }
};

/**
 * Combined ad blocker detection (general + YouTube)
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Result object with details
 */
export const detectBlocking = async (options = {}) => {
  try {
    const [youtubeBlocked, generalAdBlocker] = await Promise.all([
      detectYouTubeBlocking(options),
      Promise.resolve(detectAdBlocker()),
    ]);

    return {
      youtubeBlocked,
      generalAdBlocker,
      anyBlocked: youtubeBlocked || generalAdBlocker,
      timestamp: Date.now(),
    };
  } catch (error) {
    if(showDebug) console.error('Error in blocking detection:', error);
    return {
      youtubeBlocked: true,
      generalAdBlocker: true,
      anyBlocked: true,
      error: error.message,
      timestamp: Date.now(),
    };
  }
};

/**
 * Simple convenience function for quick YouTube check
 * @returns {Promise<boolean>} true if YouTube available, false if blocked
 */
export const isYouTubeAvailable = async () => {
  const blocked = await checkYouTubeBlocked();
  return !blocked;
};

// Default export for simple usage
export default {
  checkYouTubeBlocked,
  detectAdBlocker,
  detectYouTubeBlocking,
  detectBlocking,
  isYouTubeAvailable,
};
