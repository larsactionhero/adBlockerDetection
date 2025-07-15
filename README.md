# adBlockerDetection

Current version: 1.0.0 of July 15, 2025

## Installation
```npm
npm install -S git@github.com:larsactionhero/adBlockerDetection.git
```

## Usage
First, make sure to import dependency:
```javascript
import { detectYouTubeBlocking } from 'useAdBlockerDetection';
```

### 1. For a single instance:
```javascript
// Test with a simple YouTube thumbnail load first
const blocked = await detectYouTubeBlocking({ 
  useAllTests: true,
});
    
adBlockerDetected.value = blocked;
// console.log('YouTube blocked:', blocked);
```
