// ./js/controllers/eventController.js
// Central event system for the game

class EventController {
    constructor() {
        // Map of event names to arrays of callback functions
        this.events = {};
    }
    
    /**
     * Subscribe to an event
     * @param {string} eventName - The name of the event to listen for
     * @param {Function} callback - The function to call when the event occurs
     * @returns {Function} - Function to unsubscribe from the event
     */
    on(eventName, callback) {
        // Create the event array if it doesn't exist
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        
        // Add the callback to the event array
        this.events[eventName].push(callback);
        
        // Return a function to unsubscribe
        return () => {
            this.events[eventName] = this.events[eventName].filter(
                existingCallback => existingCallback !== callback
            );
        };
    }
    
    /**
     * Emit an event
     * @param {string} eventName - The name of the event to emit
     * @param {any} data - The data to pass to the callbacks
     */
    emit(eventName, data) {
        // If no subscribers for this event, do nothing
        if (!this.events[eventName]) {
            return;
        }
        
        // Call all the callbacks for this event
        this.events[eventName].forEach(callback => {
            callback(data);
        });
    }
    
    /**
     * Unsubscribe from all instances of an event
     * @param {string} eventName - The name of the event to unsubscribe from
     */
    off(eventName) {
        delete this.events[eventName];
    }
}