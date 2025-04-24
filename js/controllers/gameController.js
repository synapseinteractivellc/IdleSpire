// ./js/controllers/gameController.js
// The controller interface for the game

class GameController {
    constructor(eventController) {
        this.eventController = eventController;
        
        // Subscribe to events that the GameController should respond to
        this.subscribeToEvents();
    }
    
    /**
     * Initialize the game
     */
    init() {
        // Initialize game state and other controllers
    }
    
    /**
     * Subscribe to events
     */
    subscribeToEvents() {
        // Listen for events from UI or other controllers
        this.eventController.on('ui:button-clicked', data => {
            // Handle UI events as needed
        });
    }
    
    /**
     * Example method that would emit an event when a stat changes
     * @param {string} statId - The ID of the stat
     * @param {number} newValue - The new value of the stat
     * @param {number} maxValue - The max value of the stat
     * @param {number} gainRate - The rate at which the stat is gained (optional)
     */
    updateStatValue(statId, newValue, maxValue, gainRate) {
        // Update the model (would happen here)
        
        // Then emit an event for the UI to update
        this.eventController.emit('stat:updated', {
            id: statId,
            current: newValue,
            max: maxValue,
            gainRate: gainRate || 0 // Default to 0 if not provided
        });
    }
    
    /**
     * Example method that would emit an event when a new stat is added
     * @param {string} statId - The ID of the stat
     * @param {string} statName - The display name of the stat
     * @param {string} statType - The type of stat (health, mana, etc.)
     * @param {number} initialValue - The initial value of the stat
     * @param {number} maxValue - The max value of the stat
     * @param {number} gainRate - The rate at which the stat is gained (optional)
     */
    addNewStat(statId, statName, statType, initialValue, maxValue, gainRate) {
        // Create the stat in the model (would happen here)
        
        // Then emit an event for the UI to add the display
        this.eventController.emit('stat:added', {
            id: statId,
            name: statName,
            type: statType,
            current: initialValue,
            max: maxValue,
            gainRate: gainRate || 0 // Default to 0 if not provided
        });
    }

    /**
     * Example method that would emit an event when a currency changes
     * @param {string} currencyId - The ID of the currency
     * @param {number} newValue - The new value of the currency
     * @param {number} maxValue - The max value of the currency
     * @param {number} gainRate - The rate at which the currency is gained (optional)
     */
    updateCurrencyValue(currencyId, newValue, maxValue, gainRate) {
        // Update the model (would happen here)
        
        // Then emit an event for the UI to update
        this.eventController.emit('currency:updated', {
            id: currencyId,
            current: newValue,
            max: maxValue,
            gainRate: gainRate || 0 // Default to 0 if not provided
        });
    }

    /**
     * Example method that would emit an event when a new currency is added
     * @param {string} currencyId - The ID of the currency
     * @param {string} currencyName - The display name of the currency
     * @param {string} currencyType - The type of currency (gold, arcana, scrolls, etc.)
     * @param {number} initialValue - The initial value of the currency
     * @param {number} maxValue - The max value of the currency
     * @param {number} gainRate - The rate at which the currency is gained (optional)
     */
    addNewCurrency(currencyId, currencyName, currencyType, initialValue, maxValue, gainRate) {
        // Create the currency in the model (would happen here)
        
        // Then emit an event for the UI to add the display
        this.eventController.emit('currency:added', {
            id: currencyId,
            name: currencyName,
            type: currencyType,
            current: initialValue,
            max: maxValue,
            gainRate: gainRate || 0 // Default to 0 if not provided
        });
    }
}