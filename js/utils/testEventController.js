// ./js/utils/testEventController.js
// Utility for testing the event system

class TestEventController {
    constructor(eventController) {
        this.eventController = eventController;
        this.logContainer = null;
        this.testControl = null;
    }
    
    /**
     * Initialize the test interface
     */
    init() {
        // Create test UI elements
        this.createTestUI();
        
        // Subscribe to a test event
        this.eventController.on('test:event', data => {
            this.logEvent('test:event', data);
        });
    }
    
    /**
     * Create the UI elements for testing
     */
    createTestUI() {
        // Create container
        const container = document.createElement('div');
        container.id = 'event-test-container';
        container.style.position = 'fixed';
        container.style.bottom = '10px';
        container.style.right = '10px';
        container.style.backgroundColor = '#222';
        container.style.border = '1px solid #444';
        container.style.padding = '10px';
        container.style.borderRadius = '5px';
        container.style.zIndex = '1000';
        container.style.maxWidth = '300px';
        container.style.maxHeight = '300px';
        container.style.overflowY = 'auto';
        
        // Create title
        const title = document.createElement('h3');
        title.textContent = 'Event Test';
        title.style.color = '#f7b955';
        title.style.margin = '0 0 10px 0';
        container.appendChild(title);
        
        // Create log container
        this.logContainer = document.createElement('div');
        this.logContainer.style.marginBottom = '10px';
        this.logContainer.style.color = '#fff';
        this.logContainer.style.fontSize = '12px';
        container.appendChild(this.logContainer);
        
        // Create test controls
        this.testControl = document.createElement('div');
        
        // Add a button to trigger a test event
        const testButton = document.createElement('button');
        testButton.textContent = 'Trigger Test Event';
        testButton.style.marginRight = '5px';
        testButton.addEventListener('click', () => {
            this.triggerTestEvent();
        });
        this.testControl.appendChild(testButton);
        
        // Add a button to clear the log
        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear Log';
        clearButton.addEventListener('click', () => {
            this.clearLog();
        });
        this.testControl.appendChild(clearButton);
        
        container.appendChild(this.testControl);
        
        // Add to document
        document.body.appendChild(container);
    }
    
    /**
     * Trigger a test event
     */
    triggerTestEvent() {
        const testData = {
            timestamp: Date.now(),
            randomValue: Math.floor(Math.random() * 100)
        };
        
        this.logMessage(`Emitting 'test:event' with data: ${JSON.stringify(testData)}`);
        this.eventController.emit('test:event', testData);
    }
    
    /**
     * Log an event
     * @param {string} eventName - Name of the event
     * @param {any} data - Event data
     */
    logEvent(eventName, data) {
        this.logMessage(`Received '${eventName}' with data: ${JSON.stringify(data)}`);
    }
    
    /**
     * Log a message to the test interface
     * @param {string} message - Message to log
     */
    logMessage(message) {
        const logEntry = document.createElement('div');
        logEntry.style.borderBottom = '1px solid #333';
        logEntry.style.paddingBottom = '5px';
        logEntry.style.marginBottom = '5px';
        
        const timestamp = new Date().toLocaleTimeString();
        logEntry.innerHTML = `<span style="color: #999;">[${timestamp}]</span> ${message}`;
        
        this.logContainer.appendChild(logEntry);
        
        // Auto-scroll to bottom
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }
    
    /**
     * Clear the log
     */
    clearLog() {
        this.logContainer.innerHTML = '';
    }
}