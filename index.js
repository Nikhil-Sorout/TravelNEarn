import { registerRootComponent } from 'expo';
import { BackHandler } from 'react-native';

// Comprehensive polyfill for BackHandler compatibility with React Navigation v7
if (BackHandler) {
  // Store original methods
  const originalAddEventListener = BackHandler.addEventListener;
  const originalRemoveEventListener = BackHandler.removeEventListener;
  
  // Ensure removeEventListener exists and works properly
  if (typeof BackHandler.removeEventListener === 'undefined') {
    BackHandler.removeEventListener = () => {
      // Return an object with a remove method to match expected API
      return { remove: () => {} };
    };
  }
  
  // Override addEventListener to ensure it returns proper object
  if (originalAddEventListener) {
    BackHandler.addEventListener = (eventName, handler) => {
      try {
        const result = originalAddEventListener(eventName, handler);
        
        // Ensure the result has a remove method
        if (result && typeof result.remove === 'undefined') {
          result.remove = () => {
            try {
              // Try to remove the listener using the original method
              if (originalRemoveEventListener) {
                originalRemoveEventListener(eventName, handler);
              }
            } catch (error) {
              console.warn('BackHandler removeEventListener error:', error);
            }
          };
        }
        
        return result;
      } catch (error) {
        console.warn('BackHandler addEventListener error:', error);
        // Return a fallback object
        return { remove: () => {} };
      }
    };
  }
  
  // Ensure exitApp exists
  if (typeof BackHandler.exitApp === 'undefined') {
    BackHandler.exitApp = () => {
      console.warn('BackHandler.exitApp not available');
    };
  }
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
