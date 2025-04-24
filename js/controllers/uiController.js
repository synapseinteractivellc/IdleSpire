// ./js/controllers/uiController.js
// The controller interface for the UI

class UIController {
    constructor(eventController) {
        this.eventController = eventController;
        this.statContainers = {};
        this.currencyContainers = {};
        
        // Reference to where stats will be displayed
        this.statsPanel = document.getElementById('stats-panel');
        this.currencyPanel = document.getElementById('currency-panel');
        
        // Subscribe to events
        this.subscribeToEvents();
    }
    
    /**
     * Initialize the UI
     */
    init() {
        // Set up initial UI elements
        this.setupEventListeners();
    }
    
    /**
     * Subscribe to game events
     */
    subscribeToEvents() {
        // Subscribe to stat-related events
        this.eventController.on('stat:added', data => {
            this.addStat(data.id, data.name, data.type, data.current, data.max, data.gainRate);
        });
        
        this.eventController.on('stat:updated', data => {
            this.updateStat(data.id, data.current, data.max, data.gainRate);
        });

        // Subscribe to currency-related events
        this.eventController.on('currency:added', data => {
            this.addCurrency(data.id, data.name, data.type, data.current, data.max, data.gainRate);
        });
        this.eventController.on('currency:updated', data => {
            this.updateCurrency(data.id, data.current, data.max, data.gainRate);
        });
    }
    
    /**
     * Set up event listeners for UI interactions
     */
    setupEventListeners() {
        // Add event listeners as needed for UI elements
        // These would emit events when UI actions occur
        
        // Example:
        // document.getElementById('some-button').addEventListener('click', () => {
        //     this.eventController.emit('ui:button-clicked', { buttonId: 'some-button' });
        // });
    }
    
    /**
     * Create a stat display element from the template
     * @param {string} statId - Unique identifier for the stat
     * @param {string} statName - Display name for the stat
     * @param {string} statType - Type of stat (health, mana, stamina, etc.)
     * @param {number} currentValue - Current value of the stat
     * @param {number} maxValue - Maximum value of the stat
     * @param {number} gainRate - Rate at which this stat is gained per second (optional)
     * @returns {HTMLElement} - The created stat element
     */
    createStatElement(statId, statName, statType, currentValue, maxValue, gainRate) {
        // Get the template
        const template = document.getElementById('stat-template');
        
        // Clone the template content
        const statElement = template.content.cloneNode(true);
        
        // Fill in the template with the specific stat info
        statElement.querySelector('.stat-label').textContent = statName;
        
        const statBar = statElement.querySelector('.stat-bar');
        statBar.setAttribute('data-stat-type', statType);
        statBar.classList.add(`${statType}-bar`); // For CSS styling
        
        statElement.querySelector('.stat-values').textContent = `${currentValue}/${maxValue}`;
        
        // Set the width of the bar based on current/max value
        const percentage = (currentValue / maxValue) * 100;
        statBar.style.width = `${percentage}%`;
        
        // Stat gain rate in tooltip
        statElement.querySelector('.stat-rate').textContent = `${gainRate}/sec`;

        // Add a unique identifier to the container
        const container = statElement.querySelector('.stat-container');
        container.id = `stat-${statId}`;
        container.classList.add(`${statType}-stat`);
        
        return statElement;
    }
    
    /**
     * Adds a stat to the UI
     * @param {string} statId - Unique identifier for the stat
     * @param {string} statName - Display name for the stat
     * @param {string} statType - Type of stat (health, mana, stamina, etc.)
     * @param {number} currentValue - Current value of the stat
     * @param {number} maxValue - Maximum value of the stat
     * @param {number} gainRate - Rate at which this stat is gained per second (optional)
     */
    addStat(statId, statName, statType, currentValue, maxValue, gainRate) {
        // Create the stat element from the template
        const statElement = this.createStatElement(statId, statName, statType, currentValue, maxValue, gainRate);
        
        // Add to the stats panel
        this.statsPanel.appendChild(statElement);
        
        // Store a reference to easily find this element later
        this.statContainers[statId] = `stat-${statId}`;
    }
    
    /**
     * Updates a stat's display
     * @param {string} statId - The unique identifier for the stat
     * @param {number} currentValue - The current value to display
     * @param {number} maxValue - The maximum value to display
     * @param {number} gainRate - The current gain rate to display
     */
    updateStat(statId, currentValue, maxValue, gainRate) {
        const containerId = this.statContainers[statId];
        const container = document.getElementById(containerId);
        
        if (container) {
            const statBar = container.querySelector('.stat-bar');
            const statValues = container.querySelector('.stat-values');
            const statRate = container.querySelector('.stat-rate');
            
            // Update the text
            statValues.textContent = `${currentValue}/${maxValue}`;
            
            // Update the bar width
            const percentage = (currentValue / maxValue) * 100;
            statBar.style.width = `${percentage}%`;

            // Update the gain rate
            statRate.textContent = `${gainRate}/sec`;
        }
    }

    /**
     * Create a currency display element from the template
     * @param {string} currencyId - Unique identifier for the currency
     * @param {string} currencyName - Display name for the currency
     * @param {string} currencyType - Type of currency (gold, gem, etc.)
     * @param {number} currentValue - Current value of the currency
     * @param {number} maxValue - Maximum value of the currency
     * @param {number} gainRate - Rate at which this currency is gained per second
     * @returns {HTMLElement} - The created currency element
     */
    createCurrencyElement(currencyId, currencyName, currencyType, currentValue, maxValue, gainRate) {
        // Get the template
        const template = document.getElementById('currency-template');
        
        // Clone the template content
        const currencyElement = template.content.cloneNode(true);
        
        // Fill in the template with the specific currency info
        currencyElement.querySelector('.currency-name').textContent = currencyName + ':';
        currencyElement.querySelector('.currency-values').textContent = `${currentValue}/${maxValue}`;
        currencyElement.querySelector('.currency-rate').textContent = `${gainRate}/sec`;
        
        // Add currency type-specific class for styling
        const container = currencyElement.querySelector('.currency-container');
        container.id = `currency-${currencyId}`;
        container.classList.add(`${currencyType}-currency`);
        
        return currencyElement;
    }

    /**
     * Adds a currency to the UI
     * @param {string} currencyId - Unique identifier for the currency
     * @param {string} currencyName - Display name for the currency
     * @param {string} currencyType - Type of currency (gold, gem, etc.)
     * @param {number} currentValue - Current value of the currency
     * @param {number} maxValue - Maximum value of the currency
     * @param {number} gainRate - Rate at which this currency is gained per second
     */
    addCurrency(currencyId, currencyName, currencyType, currentValue, maxValue, gainRate) {
        const currencyElement = this.createCurrencyElement(
            currencyId, 
            currencyName, 
            currencyType, 
            currentValue, 
            maxValue, 
            gainRate
        );
        
        // Add to the currency panel
        const currencyPanel = document.getElementById('currency-panel');
        currencyPanel.appendChild(currencyElement);
        
        // Store a reference to easily find this element later
        this.currencyContainers[currencyId] = `currency-${currencyId}`;
    }

    /**
     * Updates a currency's display
     * @param {string} currencyId - The unique identifier for the currency
     * @param {number} currentValue - The current value to display
     * @param {number} maxValue - The maximum value to display
     * @param {number} gainRate - The current gain rate to display
     */
    updateCurrency(currencyId, currentValue, maxValue, gainRate) {
        const containerId = this.currencyContainers[currencyId];
        const container = document.getElementById(containerId);
        
        if (container) {
            const currencyValues = container.querySelector('.currency-values');
            const currencyRate = container.querySelector('.currency-rate');
            
            // Update the values
            currencyValues.textContent = `${currentValue}/${maxValue}`;
            currencyRate.textContent = `${gainRate}/sec`;
        }
    }
}