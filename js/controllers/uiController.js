// ./js/controllers/uiController.js
// The controller interface for the UI

class UIController {
    constructor(eventController) {
        this.eventController = eventController;
        this.statContainers = {};
        this.currencyContainers = {};
        
        // Reference to the navigation buttons and screens
        this.navButtons = document.querySelectorAll('#game-nav .nav-button');
        this.screens = document.querySelectorAll('.screen');

        // Reference to where stats and currency will be displayed
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

        // Subscribe to all the action events
        this.subscribeToActionEvents();


        // Listen for action button clicks
        this.eventController.on('ui:action-clicked', (data) => {
            // Find the action controller - this might need to be passed in or retrieved from game
            const actionController = window.game.actionController;
            if (actionController) {
                actionController.startAction(data.actionId);
            }
        });

        // Listen for action cancel button clicks
        this.eventController.on('ui:cancel-action', () => {
            // Find the action controller
            const actionController = window.game.actionController;
            if (actionController) {
                actionController.stopAction(false);
            }
        });
    }

    /**
     * Subscribe to action events
     */
    subscribeToActionEvents() {
        // Listen for action added
        this.eventController.on('action:added', (data) => {
            this.addActionButton(data);
        });
        
        // Listen for action started
        this.eventController.on('action:started', (data) => {
            this.updateCurrentAction(data);
            this.highlightActiveAction(data.id);
        });
        
        // Listen for action progress
        this.eventController.on('action:progress', (data) => {
            this.updateActionProgress(data);
            this.updateCurrentActionProgress(data);
        });
        
        // Listen for action completed
        this.eventController.on('action:completed', (data) => {
            this.showActionCompletionMessage(data);            
            this.updateActionCompletion(data);
            if (!data.autoRestarted) {
                this.clearActiveActionHighlight();
                this.clearCurrentAction();
            }
        });
        
        // Listen for action stopped
        this.eventController.on('action:stopped', (data) => {
            this.clearActiveActionHighlight();
            this.clearCurrentAction();
        });
        
        // Listen for action failed
        this.eventController.on('action:failed', (data) => {
            this.showActionFailedMessage(data);
            this.clearActiveActionHighlight();
        });
        
        // Listen for action unlocked
        this.eventController.on('action:unlocked', (data) => {
            this.addActionButton(data);
            this.showActionUnlockedMessage(data);
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

        // Set up navigation button listeners
        this.navButtons.forEach(button => {
            button.addEventListener('click', (event) => this.handleNavigation(event));
        });
    }

    /**
     * Handle navigation button clicks
     * @param {Event} event - The click event
     */
    handleNavigation(event) {
        const button = event.target;
        const targetScreenId = button.dataset.screen;

        // Update active button
        this.navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Show the target screen and hide others
        this.screens.forEach(screen => {
            if (screen.id === `${targetScreenId}-screen`) {
                screen.classList.remove('hidden');
                screen.classList.add('active');
            } else {
                screen.classList.add('hidden');
                screen.classList.remove('active');
            }
        });
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
            statValues.textContent = `${currentValue.toFixed(1)}/${maxValue}`;
            
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

    /**
     * Format costs into a readable string
     * @param {Object} costs - The costs object from an action
     * @returns {string} - Formatted costs string
     */
    formatCosts(costs) {
        if (!costs) return '';
        
        let result = '';
        
        // Format stat costs
        if (costs.statCosts && Object.keys(costs.statCosts).length > 0) {
            for (const statId in costs.statCosts) {
                const cost = costs.statCosts[statId];
                // Capitalize the first letter of the stat name
                const statName = statId.charAt(0).toUpperCase() + statId.slice(1);
                result += `${statName}: ${cost}/sec\n`;
            }
        }
        
        // Format currency costs
        if (costs.currencyCosts && Object.keys(costs.currencyCosts).length > 0) {
            for (const currencyId in costs.currencyCosts) {
                const cost = costs.currencyCosts[currencyId];
                // Capitalize the first letter of the currency name
                const currencyName = currencyId.charAt(0).toUpperCase() + currencyId.slice(1);
                result += `${currencyName}: ${cost}\n`;
            }
        }
        
        return result || 'None';
    }

    /**
     * Format rewards into a readable string
     * @param {Object} rewards - The rewards object from an action
     * @returns {string} - Formatted rewards string
     */
    formatRewards(rewards) {
        if (!rewards) return '';
        
        let result = '';
        
        // Format stat rewards
        if (rewards.statRewards && Object.keys(rewards.statRewards).length > 0) {
            for (const statId in rewards.statRewards) {
                const reward = rewards.statRewards[statId];
                // Capitalize the first letter of the stat name
                const statName = statId.charAt(0).toUpperCase() + statId.slice(1);
                result += `${statName}: ${reward}\n`;
            }
        }
        
        // Format currency rewards
        if (rewards.currencyRewards && Object.keys(rewards.currencyRewards).length > 0) {
            for (const currencyId in rewards.currencyRewards) {
                const reward = rewards.currencyRewards[currencyId];
                // Capitalize the first letter of the currency name
                const currencyName = currencyId.charAt(0).toUpperCase() + currencyId.slice(1);
                result += `${currencyName}: ${reward}\n`;
            }
        }
        
        // Format skill experience rewards
        if (rewards.skillExperience && Object.keys(rewards.skillExperience).length > 0) {
            for (const skillId in rewards.skillExperience) {
                const exp = rewards.skillExperience[skillId];
                // Capitalize the first letter of the skill name
                const skillName = skillId.charAt(0).toUpperCase() + skillId.slice(1);
                result += `${skillName} XP: ${exp}\n`;
            }
        }
        
        // Mention if there are random rewards
        if (rewards.randomRewards && rewards.randomRewards.length > 0) {
            result += `Chance for bonus rewards!\n`;
        }
        
        return result || 'None';
    }

    /**
     * Add an action button to the UI
     * @param {Object} actionData - Data about the action
     */
    addActionButton(actionData) {
        if (!actionData.unlocked) {
            return;
        }
        
        // Get the action buttons container
        const actionButtons = document.querySelector('.action-buttons');
        if (!actionButtons) return;
        
        // Get the template
        const template = document.getElementById('action-button-template');
        if (!template) return;
        
        // Clone the template
        const button = template.content.cloneNode(true);
        
        // Get the action object from the game's action controller if available
        let action = null;
        if (window.game && window.game.actionController) {
            action = window.game.actionController.actions[actionData.id];
        }
        
        // Fill in the template
        button.querySelector('.action-button').id = `action-${actionData.id}`;
        button.querySelector('.action-button').setAttribute('data-action-id', actionData.id);
        button.querySelector('.action-button').setAttribute('aria-label', actionData.name);
        button.querySelector('.action-name').textContent = actionData.name;
        button.querySelector('.action-name-tooltip').textContent = actionData.name;
        button.querySelector('.action-description').textContent = actionData.description;
        button.querySelector('.action-completions').textContent = 'Completions: 0';
        button.querySelector('.action-current-percentage').textContent = 'Progress: 0%';
        
        // Format costs if we have the action object
        if (action) {
            const costsElement = button.querySelector('.action-costs');
            if (costsElement) {
                const formattedCosts = this.formatCosts({
                    statCosts: action.statCosts,
                    currencyCosts: action.currencyCosts
                });
                
                if (formattedCosts && formattedCosts !== 'None') {
                    costsElement.innerHTML = 'Costs:<br>' + formattedCosts.replace(/\n/g, '<br>');
                } else {
                    costsElement.remove();
                }
            }
            
            // Format rewards if we have the action object
            const rewardsElement = button.querySelector('.action-rewards');
            if (rewardsElement) {
                const formattedRewards = this.formatRewards({
                    statRewards: action.statRewards,
                    currencyRewards: action.currencyRewards,
                    skillExperience: action.skillExperience,
                    randomRewards: action.randomRewards
                });
                
                if (formattedRewards && formattedRewards !== 'None') {
                    rewardsElement.innerHTML = 'Rewards:<br>' + formattedRewards.replace(/\n/g, '<br>');
                } else {
                    rewardsElement.remove();
                }
            }
        } else {
            // If we don't have the action object, just remove the cost/reward elements
            /*
            const costsElement = button.querySelector('.action-costs');
            if (costsElement) costsElement.remove();
            
            const rewardsElement = button.querySelector('.action-rewards');
            if (rewardsElement) rewardsElement.remove();
            */
        }
        
        // Add event listener
        button.querySelector('.action-button').addEventListener('click', () => {
            this.eventController.emit('ui:action-clicked', {
                actionId: actionData.id
            });
        });
        
        // Add to container
        actionButtons.appendChild(button);
    }

    /**
     * Update the current action display in the UI
     * @param {Object} actionData - Data about the action
     */
    updateCurrentAction(actionData) {
        const currentActionContainer = document.getElementById('current-action');
        if (!currentActionContainer) return;
        
        // Get the template
        const template = document.getElementById('current-action-template');
        if (!template) return;
        
        // Clear current content
        const actionText = document.getElementById('action-text');
        if (actionText) {
            actionText.remove();
        }
        
        // Remove any existing current action container
        const existingContainer = currentActionContainer.querySelector('.current-action-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        // Clone the template
        const newActionDisplay = template.content.cloneNode(true);
        
        // Fill in the template
        newActionDisplay.querySelector('.current-action-name').textContent = actionData.name;
        
        // Set initial progress to 0%
        newActionDisplay.querySelector('.progress-bar-fill').style.width = '0%';
        newActionDisplay.querySelector('.progress-bar-text').textContent = '0%';
        
        // Temporarily set costs and rewards to empty until we have more data
        newActionDisplay.querySelector('.current-action-costs').textContent = '';
        newActionDisplay.querySelector('.current-action-rewards').textContent = '';
        
        // Add event listener to cancel button
        newActionDisplay.querySelector('.cancel-button').addEventListener('click', () => {
            this.eventController.emit('ui:cancel-action');
        });
        
        // Add to current action container
        currentActionContainer.appendChild(newActionDisplay);
    }
    
    /**
     * Update the current action progress
     * @param {Object} progressData - Progress data
     */
    updateCurrentActionProgress(progressData) {
        const progressFill = document.querySelector('.current-action-container .progress-bar-fill');
        const progressText = document.querySelector('.current-action-container .progress-bar-text');
        
        if (progressFill) {
            progressFill.style.width = `${progressData.progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.floor(progressData.progress)}%`;
        }
    }
    
    /**
     * Clear the current action display
     */
    clearCurrentAction() {
        const currentActionContainer = document.getElementById('current-action');
        if (!currentActionContainer) return;
        
        // Remove current action container if it exists
        const container = currentActionContainer.querySelector('.current-action-container');
        if (container) {
            container.remove();
        }
        
        // Add "None" text back
        const actionText = document.createElement('p');
        actionText.id = 'action-text';
        actionText.textContent = 'None';
        currentActionContainer.appendChild(actionText);
    }

    /**
     * Highlight the active action button
     * @param {string} actionId - ID of the active action
     */
    highlightActiveAction(actionId) {
        // Remove highlight from all action buttons
        const allButtons = document.querySelectorAll('.action-button');
        allButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Add highlight to active action
        const activeButton = document.getElementById(`action-${actionId}`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    /**
     * Clear highlight from all action buttons
     */
    clearActiveActionHighlight() {
        const allButtons = document.querySelectorAll('.action-button');
        allButtons.forEach(button => {
            button.classList.remove('active');
        });
    }

    /**
     * Show a message for action completion
     * @param {Object} data - Completion data
     */
    showActionCompletionMessage(data) {
        // This could be a toast notification, a modal, or an update to the action log
        if (data.message) {
            this.eventController.emit('ui:notification', {
                message: data.message,
                type: 'success'
            });
        }
    }

    /**
     * Show a message for action failure and preserve progress display
     * @param {Object} data - Failure data
     */
    showActionFailedMessage(data) {
        if (data.message) {
            this.eventController.emit('ui:notification', {
                message: data.message,
                type: 'error'
            });
        }
        // When an action fails due to insufficient resources,
        // update the UI to show the last progress percentage
        // instead of resetting to 0
        if (data.progress !== undefined) {
            const button = document.getElementById(`action-${data.id}`);
            if (button) {
                // Preserve progress bar width
                const progressBar = button.querySelector('.action-progress-bar');
                if (progressBar) {
                    const progressValue = isNaN(data.progress) ? 0 : data.progress;
                    progressBar.style.width = `${progressValue}%`;
                }
                
                // Preserve progress text
                const progressText = button.querySelector('.action-progress-text');
                if (progressText) {
                    const progressValue = isNaN(data.progress) ? 0 : data.progress;
                    progressText.textContent = `${Math.floor(progressValue)}%`;
                }
                
                // Preserve tooltip progress text
                const tooltipProgress = button.querySelector('.action-current-percentage');
                if (tooltipProgress) {
                    const progressValue = isNaN(data.progress) ? 0 : data.progress;
                    tooltipProgress.textContent = `Progress: ${Math.floor(progressValue)}%`;
                }
            }
        }
    }

    /**
     * Show a message for action unlock
     * @param {Object} data - Unlock data
     */
    showActionUnlockedMessage(data) {
        this.eventController.emit('ui:notification', {
            message: `New action unlocked: ${data.name}!`,
            type: 'info'
        });
    }

    /**
     * Update an action button's progress
     * @param {Object} progressData - Data about the action progress
     */
    updateActionProgress(progressData) {
        const button = document.getElementById(`action-${progressData.id}`);
        if (!button) return;
        
        // Get the progress value, ensuring it's a valid number
        const progressValue = isNaN(progressData.progress) ? 0 : progressData.progress;
        
        // Update progress bar if it exists
        const progressBar = button.querySelector('.action-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progressValue}%`;
        }
        
        // Update percentage
        const percentage = button.querySelector('.action-progress-text');
        if (percentage) {
            percentage.textContent = `${Math.floor(progressValue)}%`;
        }
        
        // Also update the tooltip percentage
        const tooltipPercentage = button.querySelector('.action-current-percentage');
        if (tooltipPercentage) {
            tooltipPercentage.textContent = `Progress: ${Math.floor(progressValue)}%`;
        }
    }

    updateActionCompletion(completionData) {
        const button = document.getElementById(`action-${completionData.id}`);
        if (!button) return;

        button.querySelector('.action-completions').textContent = `Completions: ${completionData.completionCount}`;
    }
}