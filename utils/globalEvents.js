/**
 * Simple global event emitter for cross-component communication
 * Used for triggering UI updates when critical data changes
 */

class GlobalEventEmitter {
  constructor() {
    this.listeners = {};
  }

  // Subscribe to an event
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  // Emit an event to all listeners
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

// Create singleton instance
const globalEvents = new GlobalEventEmitter();

// Define event types for better organization
export const EVENT_TYPES = {
  USERNAME_CHANGED: 'username_changed',
  DATA_RESTORED: 'data_restored',
  DATA_CLEARED: 'data_cleared',
  ACCOUNTS_UPDATED: 'accounts_updated',
  TRANSACTIONS_UPDATED: 'transactions_updated',
};

export default globalEvents;
