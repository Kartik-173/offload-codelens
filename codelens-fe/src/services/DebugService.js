import { ENV } from '../config/env';

const DebugService = {
    isEnabled: ENV.IS_DEV,
  
    log(...message) {
      if (this.isEnabled) {
        console.log(...message);
      }
    },
    
    warn(...message) {
      if (this.isEnabled) {
        console.warn(...message);
      }
    },
    
    error(...message) {
      // if (this.isEnabled) {
        console.error(...message);
      // }
    },
  
    // Add other debug-related methods as needed
  };
  
  export default DebugService;
  