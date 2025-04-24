// ./js/controllers/actionLogController.js
// The controller interface for the action log

class ActionLogController {
    constructor(eventController) {
        this.eventController = eventController;
        this.logContainer = null;
        this.maxLogEntries = 50; // Maximum number of log entries to keep
        
        // Reference to where log entries will be displayed
        this.logContainer = document.querySelector('.action-log-entries');
        
        // Subscribe to events
        this.subscribeToEvents();
    }
    
    /**
     * Initialize the action log
     */
    init() {
        console.log('Initializing ActionLogController...');
        
        // Add initial log entry
        this.addLogEntry('Game started');
    }
    
    /**
     * Subscribe to game events
     */
    subscribeToEvents() {
        // Log when a stat changes
        this.eventController.on('stat:updated', data => {
            this.addLogEntry(`${data.id.charAt(0).toUpperCase() + data.id.slice(1)} changed to ${Math.floor(data.current)}/${data.max}`);
        });
        
        // Log when a currency changes
        this.eventController.on('currency:updated', data => {
            this.addLogEntry(`${data.id.charAt(0).toUpperCase() + data.id.slice(1)} changed to ${Math.floor(data.current)}/${data.max}`);
        });
        
        // Log when player takes an action
        this.eventController.on('action:started', data => {
            this.addLogEntry(`Started action: ${data.name}`);
        });
        
        this.eventController.on('action:completed', data => {
            this.addLogEntry(`Completed action: ${data.name}`, true);
        });
        
        // Log when a save occurs
        this.eventController.on('save:saved', () => {
            this.addLogEntry('Game saved');
        });
        
        this.eventController.on('save:autosaved', () => {
            this.addLogEntry('Game auto-saved');
        });
        
        // Log when a game is loaded
        this.eventController.on('save:loaded', () => {
            this.addLogEntry('Game loaded');
        });
        
        // Log offline progress
        this.eventController.on('game:offline-progress', data => {
            const minutes = data.offlineTimeInMinutes;
            this.addLogEntry(`Welcome back! You were away for ${minutes} minute${minutes !== 1 ? 's' : ''}`, true);
        });
    }
    
    /**
     * Create a log entry element from the template
     * @param {string} message - The log message
     * @param {boolean} important - Whether this is an important log entry
     * @returns {HTMLElement} - The created log entry element
     */
    createLogEntryElement(message, important = false) {
        // Get the template
        const template = document.getElementById('action-log-entry-template');
        
        // Clone the template content
        const entryElement = template.content.cloneNode(true);
        
        // Fill in the template with the specific log info
        const timestamp = new Date().toLocaleTimeString();
        entryElement.querySelector('.action-log-timestamp').textContent = timestamp;
        entryElement.querySelector('.action-log-message').textContent = message;
        
        // Add important class if needed
        if (important) {
            entryElement.querySelector('.action-log-entry').classList.add('important');
        }
        
        return entryElement;
    }
    
    /**
     * Add a new log entry
     * @param {string} message - The log message
     * @param {boolean} important - Whether this is an important log entry
     */
    addLogEntry(message, important = false) {
        if (!this.logContainer) {
            console.error('Log container not found');
            return;
        }
        
        // Create the log entry
        const logEntry = this.createLogEntryElement(message, important);
        
        // Add to the beginning of the log
        this.logContainer.prepend(logEntry);
        
        // Limit the number of log entries
        this.pruneOldEntries();
        
        // Emit event that a log entry was added
        this.eventController.emit('log:entry-added', {
            message: message,
            important: important,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Remove old log entries to keep the log at a manageable size
     */
    pruneOldEntries() {
        const entries = this.logContainer.querySelectorAll('.action-log-entry');
        
        if (entries.length > this.maxLogEntries) {
            // Remove oldest entries (at the end of the list)
            for (let i = this.maxLogEntries; i < entries.length; i++) {
                entries[i].remove();
            }
        }
    }
    
    /**
     * Clear all log entries
     */
    clearLog() {
        if (this.logContainer) {
            this.logContainer.innerHTML = '';
            this.addLogEntry('Log cleared');
        }
    }
}