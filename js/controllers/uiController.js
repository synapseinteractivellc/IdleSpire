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
        console.log('Initializing UIController...');
        // Set up initial UI elements
        this.setupEventListeners();

        this.initHomeScreen();

        this.initFurnitureUI();
    }
    
    /**
     * Subscribe to game events
     */
    subscribeToEvents() {
        // Subscribe to all resource events
        this.subscribeToResourceEvents();

        // Subscribe to all the action events
        this.subscribeToActionEvents();

        // Subscribe to all skill events
        this.subscribeToSkillEvents();

        // Subscribe to all upgrade events
        this.subscribeToUpgradeEvents();

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
     * Subscribe to resource events
     */
    subscribeToResourceEvents() {
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
            console.log("Action unlocked in UI." + data);
            this.addActionButton(data);
            this.showActionUnlockedMessage(data);
        });

        // Listen for action data to be ready after a load
        this.eventController.on('action:data-ready', (actionData) => {
            this.updateActionTooltipData(actionData);
        });
    }

    /**
     * Subscribe to skill events
     */
    subscribeToSkillEvents() {
        // Subscribe to skill-related events
        this.eventController.on('skill:added', data => {
            this.addSkill(data);
        });

        this.eventController.on('skill:updated', data => {
            this.updateSkill(data);
        });

        this.eventController.on('skill:loaded', data => {
            this.addSkill(data);
        });

        this.eventController.on('skill:leveled-up', data => {
            this.handleSkillLevelUp(data);
        });

        this.eventController.on('skill:unlocked', data => {
            this.handleSkillUnlocked(data);
        });

        this.eventController.on('skill:bonus-applied', data => {
            this.updateSkillBonuses(data);
        });
    }

    /**
     * Subscribe to upgrade events
     */
    subscribeToUpgradeEvents() {
        // Listen for upgrade added
        this.eventController.on('upgrade:added', (data) => {
            this.addUpgradeButton(data);
        });
        
        // Listen for upgrade purchased
        this.eventController.on('upgrade:purchased', (data) => {
            this.updateUpgradeCompletion(data);
            this.showUpgradePurchasedMessage(data);
        });
        
        // Listen for upgrade data ready (after load)
        this.eventController.on('upgrade:data-ready', (upgradeData) => {
            this.updateUpgradeTooltipData(upgradeData);
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
     * Initialize home screen elements and event listeners
     */
    initHomeScreen() {
        // Get references to home screen elements
        this.currentHomeButton = document.getElementById('current-home-btn');
        this.homeSelectionContainer = document.getElementById('home-selection-container');
        this.furnitureSelectionContainer = document.getElementById('furniture-selection-container');
        
        // Setup current home button event listener
        if (this.currentHomeButton) {
            this.currentHomeButton.addEventListener('click', () => this.toggleHomeSelection());
        }
        
        // Subscribe to home-related events
        this.subscribeToHomeEvents();
    }
    
    /**
     * Subscribe to home-related events
     */
    subscribeToHomeEvents() {
        // Listen for home added events
        this.eventController.on('home:added', (homeData) => {
            this.addHomeToSelectionGrid(homeData);
        });
        
        // Listen for home transition events
        this.eventController.on('home:transitioned', (transitionData) => {
            this.updateCurrentHomeButton(transitionData);
        });
        
        // Listen for home loaded events (after save load)
        this.eventController.on('home:loaded', (loadData) => {
            this.updateCurrentHomeButton(loadData);
        });
    }
    
    /**
     * Initialize furniture UI elements and event listeners
     */
    initFurnitureUI() {
        console.log('Initializing Furniture UI...');
        
        // Get reference to furniture container
        this.furnitureSelectionContainer = document.getElementById('furniture-selection-container');
        
        if (!this.furnitureSelectionContainer) return;
        
        // Clear any existing content
        this.furnitureSelectionContainer.innerHTML = '';
        
        // Get the table template
        const tableTemplate = document.getElementById('furniture-table-template');
        if (!tableTemplate) return;
        
        // Clone the template content and add to the container
        const tableElement = tableTemplate.content.cloneNode(true);
        this.furnitureSelectionContainer.appendChild(tableElement);
        
        // Get reference to the table body where furniture rows will be added
        this.furnitureTableBody = this.furnitureSelectionContainer.querySelector('.furniture-table tbody');
        
        // Add event listeners for filter checkboxes
        const filterOwned = this.furnitureSelectionContainer.querySelector('#filter-owned');
        const filterUnowned = this.furnitureSelectionContainer.querySelector('#filter-unowned');
        const filterBlocked = this.furnitureSelectionContainer.querySelector('#filter-blocked');
        
        if (filterOwned) {
            filterOwned.addEventListener('change', () => this.applyFurnitureFilters());
        }
        
        if (filterUnowned) {
            filterUnowned.addEventListener('change', () => this.applyFurnitureFilters());
        }
        
        if (filterBlocked) {
            filterBlocked.addEventListener('change', () => this.applyFurnitureFilters());
        }
        
        // Subscribe to furniture events
        this.subscribeToFurnitureEvents();
    }

    /**
     * Subscribe to furniture-related events
     */
    subscribeToFurnitureEvents() {
        // Listen for furniture added
        this.eventController.on('furniture:added', (data) => {
            this.addFurnitureItem(data);
        });
        
        // Listen for furniture purchased
        this.eventController.on('furniture:purchased', (data) => {
            this.updateFurnitureOwnership(data);
            this.showFurniturePurchasedMessage(data);
        });
        
        // Listen for furniture placed
        this.eventController.on('furniture:placed', (data) => {
            this.updateFurniturePlacement(data);
            this.showFurniturePlacedMessage(data);
        });
        
        // Listen for furniture removed
        this.eventController.on('furniture:removed', (data) => {
            this.updateFurnitureRemoval(data);
            this.showFurnitureRemovedMessage(data);
        });
        
        // Listen for UI update request
        this.eventController.on('ui:updateFurnitureDisplay', (data) => {
            this.updateFurnitureDisplay(data.homeId);
        });
        
        // Listen for furniture loaded from save
        this.eventController.on('furniture:loaded', () => {
            this.refreshFurnitureDisplay();
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
                
                // If navigating to house screen, show furniture
                if (targetScreenId === 'house') {
                    const character = window.game.gameState.getActiveCharacter();
                    if (character && character.home) {
                        this.updateFurnitureDisplay(character.home.id);
                        if (this.furnitureSelectionContainer) {
                            this.furnitureSelectionContainer.classList.remove('hidden');
                        }
                    }
                }
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
        // Ensure the currency name is properly capitalized
        const displayName = this.capitalizeFirstLetter(currencyName);
        
        const currencyElement = this.createCurrencyElement(
            currencyId, 
            displayName, // Use capitalized name
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
    
    // Add this helper method to the UIController class
    capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
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
                result += `${statName}: ${reward} on completion\n`;
            }
        }
        
        // Format currency rewards
        if (rewards.currencyRewards && Object.keys(rewards.currencyRewards).length > 0) {
            for (const currencyId in rewards.currencyRewards) {
                const reward = rewards.currencyRewards[currencyId];
                // Capitalize the first letter of the currency name
                const currencyName = currencyId.charAt(0).toUpperCase() + currencyId.slice(1);
                result += `${currencyName}: ${reward} on completion\n`;
            }
        }
        
        // Format skill experience rewards
        if (rewards.skillExperience && Object.keys(rewards.skillExperience).length > 0) {
            for (const skillId in rewards.skillExperience) {
                const exp = rewards.skillExperience[skillId];
                // Capitalize the first letter of the skill name
                const skillName = skillId.charAt(0).toUpperCase() + skillId.slice(1);
                result += `${skillName} XP: ${exp} on completion\n`;
            }
        }
        
        // Format progress rewards if they exist
        if (rewards.progressRewards && Object.keys(rewards.progressRewards).length > 0) {
            // Get all stat rewards across all thresholds
            const statProgressRewards = {};
            
            // Collect all stats from all thresholds
            for (const threshold in rewards.progressRewards) {
                const thresholdRewards = rewards.progressRewards[threshold];
                if (thresholdRewards.stats) {
                    for (const statId in thresholdRewards.stats) {
                        if (!statProgressRewards[statId]) {
                            statProgressRewards[statId] = 0;
                        }
                        statProgressRewards[statId] += thresholdRewards.stats[statId];
                    }
                }
            }
            
            // Get the number of thresholds to calculate per-second rates
            const thresholdCount = Object.keys(rewards.progressRewards).length;
            
            // Add progress stat rewards to result
            for (const statId in statProgressRewards) {
                const totalReward = statProgressRewards[statId];
                const statName = statId.charAt(0).toUpperCase() + statId.slice(1);
                result += `${statName}: ${totalReward} total while in progress\n`;
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
        
        // Create and add the button fill element
        const fillElement = document.createElement('div');
        fillElement.className = 'action-button-fill';
        fillElement.setAttribute('data-progress', 'low');
        
        // Insert the fill element as the first child of the button
        const actionButton = button.querySelector('.action-button');
        actionButton.insertBefore(fillElement, actionButton.firstChild);

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
        
        const costsElement = button.querySelector('.action-costs');
        if (costsElement) {
            if (action && (action.statCosts || action.currencyCosts)) {
                const formattedCosts = this.formatCosts({
                    statCosts: action.statCosts,
                    currencyCosts: action.currencyCosts
                });
            
                costsElement.innerHTML = 'Costs:<br>' + formattedCosts.replace(/\n/g, '<br>');
            } else {
                // If no costs data, remove the element or set to "None"
                costsElement.innerHTML = 'Costs:<br>None';
            }
        }

        
        // Format rewards if we have the action object
        const rewardsElement = button.querySelector('.action-rewards');
        if (rewardsElement) {
            if (action && (action.statRewards || action.currencyRewards || action.skillExperience || action.randomRewards)) {
                const formattedRewards = this.formatRewards({
                    statRewards: action.statRewards,
                    currencyRewards: action.currencyRewards,
                    skillExperience: action.skillExperience,
                    randomRewards: action.randomRewards
                });
                
                rewardsElement.innerHTML = 'Rewards:<br>' + formattedRewards.replace(/\n/g, '<br>');
            } else {
                // If no rewards data, remove the element or set to "None"
                rewardsElement.innerHTML = 'Rewards:<br>None';
            }
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
        if (data.progress !== undefined) {
            const button = document.getElementById(`action-${data.id}`);
            if (button) {
                const progressValue = isNaN(data.progress) ? 0 : data.progress;                
                
                // Preserve fill element width
                const fillElement = button.querySelector('.action-button-fill');
                if (fillElement) {
                    fillElement.style.width = `${progressValue}%`;
                    
                    // Update color based on progress
                    if (progressValue < 33) {
                        fillElement.setAttribute('data-progress', 'low');
                    } else if (progressValue < 66) {
                        fillElement.setAttribute('data-progress', 'medium');
                    } else {
                        fillElement.setAttribute('data-progress', 'high');
                    }
                }
                                
                // Update tooltip progress text (now outside the button)
                const tooltipProgress = button.closest('.action-button-container').querySelector('.action-current-percentage');
                if (tooltipProgress) {
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
        let progressValue = isNaN(progressData.progress) ? 0 : progressData.progress;
        
        // Important: Adjust progress for visual purposes to ensure it reaches 100%
        // If progress is over 95%, visually show it as 100% to ensure it looks complete
        const visualProgress = progressValue > 95 ? 100 : progressValue;
                
        // Update fill element if it exists
        const fillElement = button.querySelector('.action-button-fill');
        if (fillElement) {
            fillElement.style.width = `${visualProgress}%`;
            
            // Update the data-progress attribute to change the color based on progress
            if (progressValue < 33) {
                fillElement.setAttribute('data-progress', 'low');
            } else if (progressValue < 66) {
                fillElement.setAttribute('data-progress', 'medium');
            } else {
                fillElement.setAttribute('data-progress', 'high');
            }
        }
                
        // Also update the tooltip percentage (now outside the button)
        const tooltipPercentage = button.closest('.action-button-container').querySelector('.action-current-percentage');
        if (tooltipPercentage) {
            tooltipPercentage.textContent = `Progress: ${Math.floor(progressValue)}%`;
        }
    }

    /**
     * Update an action completion count
     * @param {Object} completionData - Data about the action completion
     */
    updateActionCompletion(completionData) {
        const button = document.getElementById(`action-${completionData.id}`);
        if (!button) return;
    
        // Get the action button container (parent of button)
        const container = button.closest('.action-button-container');
        
        // Update completions count in tooltip (now outside the button)
        const completionsElement = container.querySelector('.action-completions');
        if (completionsElement) {
            completionsElement.textContent = `Completions: ${completionData.completionCount}`;
        }
    }

    /**
     * Update an action tooltip after load
     * @param {Object} actionData - Data about the action
     */
    updateActionTooltipData(actionData) {
        const button = document.getElementById(`action-${actionData.id}`);
        if (!button) return;
        
        // Get the action button container (parent of button)
        const container = button.closest('.action-button-container');
        
        // Update tooltip with costs
        const costsElement = container.querySelector('.action-costs');
        if (costsElement) {
            const formattedCosts = this.formatCosts({
                statCosts: actionData.statCosts,
                currencyCosts: actionData.currencyCosts
            });
            
            costsElement.innerHTML = 'Costs:<br>' + (formattedCosts ? formattedCosts.replace(/\n/g, '<br>') : 'None');
        }
        
        // Update tooltip with rewards
        const rewardsElement = container.querySelector('.action-rewards');
        if (rewardsElement) {
            // Prepare a rewards object that includes both standard rewards and progress rewards
            const rewardsData = {
                statRewards: actionData.statRewards,
                currencyRewards: actionData.currencyRewards,
                skillExperience: actionData.skillExperience,
                randomRewards: actionData.randomRewards,
                progressRewards: actionData.progressRewards // Add progress rewards to be formatted
            };
            
            const formattedRewards = this.formatRewards(rewardsData);
            
            rewardsElement.innerHTML = 'Rewards:<br>' + (formattedRewards ? formattedRewards.replace(/\n/g, '<br>') : 'None');
        }
        
        // Update completion count if available
        if (actionData.completionCount !== undefined) {
            const completionsElement = container.querySelector('.action-completions');
            if (completionsElement) {
                completionsElement.textContent = `Completions: ${actionData.completionCount}`;
            }
        }
    
        this.updateActionProgress(actionData);
    }
    
    /**
     * Create a skill display element from the template
     * @param {string} skillId - Unique identifier for the skill
     * @param {string} skillName - Display name for the skill
     * @param {string} description - Description of the skill
     * @param {string} category - Category of the skill
     * @param {number} currentLevel - Current level of the skill
     * @param {number} maxLevel - Maximum level of the skill
     * @param {number} xp - Current XP for the skill
     * @param {number} xpToNextLevel - XP needed for next level
     * @param {number} progress - Progress percentage toward next level
     * @param {boolean} unlocked - Whether the skill is unlocked
     * @returns {HTMLElement} - The created skill element
     */
    createSkillElement(skillId, skillName, description, category, currentLevel, maxLevel, xp, xpToNextLevel, progress, unlocked) {
        // Get the template
        const template = document.getElementById('skill-template');
        
        // Clone the template content
        const skillElement = template.content.cloneNode(true);
        
        // Fill in the template with the specific skill info
        skillElement.querySelector('.skill-name').textContent = skillName;
        skillElement.querySelector('.skill-level').textContent = `Level ${currentLevel}/${maxLevel}`;
        
        // Set the width of the fill element based on progress percentage
        const skillFill = skillElement.querySelector('.skill-fill');
        skillFill.style.width = `${progress}%`;
        
        // Set XP values
        skillElement.querySelector('.skill-xp-values').textContent = `${xp}/${xpToNextLevel} XP`;
        
        // Add description and bonuses placeholder
        skillElement.querySelector('.skill-description').textContent = description;
        
        // We'll add bonuses later when we have that information
        skillElement.querySelector('.skill-bonuses').textContent = 'Bonuses will appear as you level up';
        
        // Add a unique identifier to the container
        const container = skillElement.querySelector('.skill-container');
        container.id = `skill-${skillId}`;
        container.classList.add(category); // Add category as a class for styling
        
        // Add locked class if not unlocked
        if (!unlocked) {
            container.classList.add('locked');
        }
        
        return skillElement;
    }

    /**
     * Create or get a skill category container
     * @param {string} category - Category name
     * @returns {HTMLElement} - The category container
     */
    getOrCreateSkillCategoryContainer(category) {
        const existingContainer = document.querySelector(`.skill-category-container[data-category="${category}"]`);
        
        if (existingContainer) {
            return existingContainer;
        }
        
        // Get the template
        const template = document.getElementById('skill-category-template');
        
        // Clone the template content
        const categoryElement = template.content.cloneNode(true);
        
        // Fill in the template
        categoryElement.querySelector('.skill-category-name').textContent = category;
        categoryElement.querySelector('.skill-category-toggle').setAttribute('aria-label', `Toggle ${category} Skills`);
        
        // Add category identifier
        const container = categoryElement.querySelector('.skill-category-container');
        container.setAttribute('data-category', category);
        
        // Add event listener for collapsing/expanding
        const header = categoryElement.querySelector('.skill-category-header');
        const content = categoryElement.querySelector('.skill-category-content');
        const toggle = categoryElement.querySelector('.skill-category-toggle');
        
        header.addEventListener('click', () => {
            content.classList.toggle('collapsed');
            toggle.classList.toggle('collapsed');
        });
        
        // Add to the skills screen
        const skillsScreen = document.getElementById('skills-screen');
        skillsScreen.appendChild(container);
        
        return container;
    }

    /**
     * Adds a skill to the UI
     * @param {Object} data - Skill data from event
     */
    addSkill(data) {
        this.skillContainers = this.skillContainers || {};

        if (this.skillContainers[data.id]) {
            return;
        }    
        

        // Create the skill element
        const skillElement = this.createSkillElement(
            data.id,
            data.name,
            data.description,
            data.category,
            data.level,
            data.maxLevel,
            data.xp,
            data.xpToNextLevel,
            data.progress,
            data.unlocked
        );
        
        // Get or create the category container
        const categoryContainer = this.getOrCreateSkillCategoryContainer(data.category);
        
        // Add to the category content
        const categoryContent = categoryContainer.querySelector('.skill-category-content');
        categoryContent.appendChild(skillElement);
        
        // Store a reference to easily find this element later
        
        this.skillContainers[data.id] = `skill-${data.id}`;
    }

    /**
     * Updates a skill's display
     * @param {Object} data - Updated skill data
     */
    updateSkill(data) {
        const containerId = this.skillContainers?.[data.id];
        if (!containerId) return;
        
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Update level display
        const levelDisplay = container.querySelector('.skill-level');
        if (levelDisplay) {
            levelDisplay.textContent = `Level ${data.level}/${data.maxLevel}`;
        }
        
        // Update XP display
        const xpDisplay = container.querySelector('.skill-xp-values');
        if (xpDisplay) {
            xpDisplay.textContent = `${data.xp}/${data.xpToNextLevel} XP`;
        }
        
        // Update progress bar (skill fill)
        const progressFill = container.querySelector('.skill-fill');
        if (progressFill) {
            progressFill.style.width = `${data.progress}%`;
        }
    }

    /**
     * Update skill bonuses display in tooltip
     * @param {Object} data - Bonus data
     */
    updateSkillBonuses(data) {
        const containerId = this.skillContainers?.[data.skillId];
        if (!containerId) return;
        
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Get bonuses element
        const bonusesElement = container.querySelector('.skill-bonuses');
        if (!bonusesElement) return;
        
        // Format and update bonuses text
        let bonusText = '';
        
        switch (data.bonusType) {
            case 'stat_max':
                bonusText = `Increases ${this.capitalizeFirstLetter(data.target)} maximum by ${data.value}`;
                break;
            case 'stat_regen':
                bonusText = `Increases ${this.capitalizeFirstLetter(data.target)} regeneration by ${data.value}/sec`;
                break;
            case 'currency_max':
                bonusText = `Increases ${this.capitalizeFirstLetter(data.target)} capacity by ${data.value}`;
                break;
            case 'action_modifier':
                bonusText = `Improves ${this.capitalizeFirstLetter(data.target)} action by ${data.value}x`;
                break;
            case 'action_unlock':
                bonusText = `Unlocks ${this.capitalizeFirstLetter(data.target)} action`;
                break;
            default:
                bonusText = `${data.bonusType}: ${data.value}`;
        }
        
        // Add bonus to existing text
        const currentText = bonusesElement.textContent;
        if (currentText === 'Bonuses will appear as you level up') {
            bonusesElement.textContent = `Level ${data.skillLevel}: ${bonusText}`;
        } else {
            bonusesElement.innerHTML = `${currentText}<br>Level ${data.skillLevel}: ${bonusText}`;
        }
    }

    /**
     * Handle skill unlocked event
     * @param {Object} data - Unlock data
     */
    handleSkillUnlocked(data) {
        const containerId = this.skillContainers?.[data.id];
        
        // If skill is already in UI, update it
        if (containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                container.classList.remove('locked');
            }
        } else {
            // Otherwise, we'll receive a skill:added event soon
            console.log(`Skill ${data.name} unlocked by ${data.unlockedBy}`);
        }
        
        // Show notification
        this.eventController.emit('ui:notification', {
            message: `New skill unlocked: ${data.name}!`,
            type: 'info'
        });
    }

    /**
     * Handle skill level up event
     * @param {Object} data - Level up data
     */
    handleSkillLevelUp(data) {
        // Show notification
        this.eventController.emit('ui:notification', {
            message: `${data.name} skill leveled up to ${data.level}!`,
            type: 'success'
        });
    }

    /**
     * Format currency costs into a readable string
     * @param {Object} costs - The costs object from an upgrade
     * @returns {string} - Formatted costs string
     */
    formatUpgradeCosts(costs) {
        if (!costs || Object.keys(costs).length === 0) return 'Free';
        
        let result = `\n`;
        
        // Format currency costs
        for (const currencyId in costs) {
            const cost = costs[currencyId];
            // Capitalize the first letter of the currency name
            const currencyName = this.capitalizeFirstLetter(currencyId);
            result += `${currencyName}: ${cost}\n`;
        }
        
        return result;
    }

    /**
     * Format upgrade effects into a readable string
     * @param {Object} data - Upgrade data containing effect information
     * @returns {string} - Formatted effects string
     */
    formatUpgradeEffects(data) {
        if (!data.upgradeTarget || !data.upgradeType || !data.upgradeTargetId) return 'Unknown effect';
        
        let effect = '';
        
        switch (data.upgradeTarget) {
            case 'resource':
                if (data.upgradeType === 'max') {
                    effect = `Increases maximum ${data.upgradeTargetId} by ${data.upgradeValue}`;
                } else if (data.upgradeType === 'regen') {
                    effect = `Increases ${data.upgradeTarget} regeneration by ${data.upgradeValue} per second`;
                }
                break;
                
            case 'action':
                if (data.upgradeType === 'efficiency') {
                    const percent = (data.upgradeValue - 1) * 100;
                    effect = `Increases ${data.upgradeTargetId} efficiency by ${percent}%`;
                }
                break;
                
            default:
                effect = `${data.upgradeType} effect on ${data.upgradeTargetId}`;
        }
        
        return effect;
    }


    /**
     * Create an upgrade display element from the template
     * @param {string} upgradeId - Unique identifier for the upgrade
     * @param {string} upgradeName - Display name for the upgrade
     * @param {string} category - Category of the upgrade
     * @param {string} description - Description of the upgrade
     * @param {Object} costs - Formatted costs of the upgrade
     * @param {Object} effects - Formatted effects of the upgrade
     * @param {number} completions - # of times the upgrade has been purchased
     * @param {number} maxCompletions - Maximum # of times the upgrade can be purchased
     * @param {number} progress - Progress percentage toward next level
     * @param {boolean} unlocked - Whether the upgrade is unlocked
     * @returns {HTMLElement} - The created upgrade element
     */
    createUpgradeElement(upgradeId, upgradeName, category, description, costs, effects, completions, maxCompletions, progress, unlocked) {
        // Get the template
        const template = document.getElementById('upgrade-button-template');

        // Clone the template content
        const upgradeElement = template.content.cloneNode(true);

        // Fill in the template with the specific upgrade info
        upgradeElement.querySelector('.upgrade-name').textContent = upgradeName;
        upgradeElement.querySelector('.upgrade-name-tooltip').textContent = upgradeName
        
        upgradeElement.querySelector('.upgrade-button').id = `upgrade-button-${upgradeId}`;
        upgradeElement.querySelector('.upgrade-button').setAttribute('data-upgrade-id', upgradeId);
        upgradeElement.querySelector('.upgrade-button').setAttribute('aria-label', upgradeName);

        // Set the width of the fill element based on progress percentage
        const upgradeFill = upgradeElement.querySelector('.upgrade-button-fill');
        upgradeFill.style.width = `${progress}%`;

        // Set completion and maxCompletion
        upgradeElement.querySelector('.upgrade-completions').textContent = `Purchased: ${completions}/${maxCompletions}`;

        // Set the description
        upgradeElement.querySelector('.upgrade-description').textContent = description;

        // Set placeholders
        upgradeElement.querySelector('.upgrade-costs').innerHTML = `Costs: <br>${costs}`;
        upgradeElement.querySelector('.upgrade-effects').innerHTML = `Effects: Coming`;

        // Add a unique identifier to the container
        const container = upgradeElement.querySelector('.upgrade-button-container');
        container.id = `upgrade-${upgradeId}`;
        container.classList.add(category); // Add category as a class for styling

        // Add locked class if not unlocked
        if (!unlocked) {
            container.classList.add('locked');
        }


        
        const button = upgradeElement.querySelector('.upgrade-button');
        // Check if max completions reached
        if (completions >= maxCompletions && maxCompletions > 0) {
            button.classList.add('max-completions');
            button.disabled = true;
        }
        
        // Add event listener
        button.addEventListener('click', () => {
            this.eventController.emit('upgrade:purchase', {
                id: upgradeId
            });
        });
        
        return upgradeElement;
    }    

    /**
     * Ensure a category separator exists for this category
     * @param {string} category - Category name
     * @returns {HTMLElement} - The category container
     */
    getOrCreateUpgradeCategoryContainer(category) {
        const existingContainer = document.querySelector(`.upgrade-category-container[data-category="${category}"]`);

        if (existingContainer) {
            return existingContainer;
        }

        // Get the template
        const template = document.getElementById('upgrade-category-template');

        // Clone the template content
        const categoryElement = template.content.cloneNode(true);

        // Fill in the template
        categoryElement.querySelector('.upgrade-category-name').textContent = this.capitalizeFirstLetter(category);
        categoryElement.querySelector('.upgrade-category-toggle').setAttribute('aria-label', `Toggle ${category} Upgrades`);

        // Add category identifier
        const container = categoryElement.querySelector('.upgrade-category-container');
        container.setAttribute('data-category', category);

        // Add event listener for collapsing/expanding
        const header = categoryElement.querySelector('.upgrade-category-header');
        const content = categoryElement.querySelector('.upgrade-category-content');
        const toggle = categoryElement.querySelector('.upgrade-category-toggle');

        header.addEventListener('click', () => {
            content.classList.toggle('collapsed');
            toggle.classList.toggle('collapsed');
        });

        // Add to the upgrade section
        const upgradeButtons = document.querySelector('.upgrade-buttons');
        if (!upgradeButtons) return;
            
        // Insert at beginning for now
        upgradeButtons.appendChild(container);

        return container;    
    }

    /**
     * Add an upgrade button to the UI
     * @param {Object} upgradeData - Data about the upgrade
     */
    addUpgradeButton(upgradeData) {
        this.upgradeContainers = this.upgradeContainers || {};

        if (this.upgradeContainers[upgradeData.id]) {
            return;
        }

        // Set completion count
        const completions = upgradeData.completionCount || 0;
        const maxCompletions = upgradeData.maxCompletions || 1;
        
        // Format costs
        const formattedCosts = this.formatUpgradeCosts(upgradeData.costs);
        
        // Format effects
        //const formattedEffects = this.formatUpgradeEffects(upgradeData.effects);
        console.log("Effects for upgrade: " + upgradeData.effects);

        // Create the upgrade element
        const upgradeElement = this.createUpgradeElement(
            upgradeData.id,
            upgradeData.name,
            upgradeData.category,
            upgradeData.description,
            formattedCosts,
            upgradeData.effects,
            completions,
            maxCompletions,
            upgradeData.progress,
            upgradeData.unlocked
        );

        // Get or create category container if needed
        const categoryContainer = this.getOrCreateUpgradeCategoryContainer(upgradeData.category);

        // Add to the category content
        const categoryContent = categoryContainer.querySelector('.upgrade-category-content');
        categoryContent.appendChild(upgradeElement);

        // Store a reference to easily find this element later
        this.upgradeContainers[upgradeData.id] = `upgrade-${upgradeData.id}`;
    }

    /**
     * Update an upgrade button
     * @param {Object} upgradeData - Data about the upgrade
     */
    updateUpgradeButton(upgradeData) {
        const button = document.getElementById(`upgrade-${upgradeData.id}`);
        if (!button) return;
        
        // Update completion count
        const completions = upgradeData.completionCount || 0;
        const maxCompletions = upgradeData.maxCompletions || 1;
        
        // Find tooltip container
        const container = button.closest('.upgrade-button-container');
        if (container) {
            const completionsElement = container.querySelector('.upgrade-completions');
            if (completionsElement) {
                completionsElement.textContent = `Purchased: ${completions}/${maxCompletions}`;
            }
        }

        if (!upgradeData.unlocked) {
            button.classList.add('hidden');
        }

        this.updateUpgradeCategoryVisibility();
        
        // Check if max completions reached
        if (completions >= maxCompletions && maxCompletions > 0) {
            button.classList.add('max-completions');
            button.disabled = true;
        } else {
            button.classList.remove('max-completions');
            button.disabled = false;
        }
    }

    /**
     * Update tooltip data for an upgrade
     * @param {Object} upgradeData - Detailed upgrade data
     */
    updateUpgradeTooltipData(upgradeData) {
        const button = document.getElementById(`upgrade-${upgradeData.id}`);
        if (!button) return;
        
        // Get container
        const container = button.closest('.upgrade-button-container');
        if (!container) return;
        
        // Update costs
        const costsElement = container.querySelector('.upgrade-costs');
        if (costsElement && upgradeData.costs) {
            const formattedCosts = this.formatUpgradeCosts(upgradeData.costs);
            costsElement.innerHTML = 'Costs:<br>' + formattedCosts.replace(/\n/g, '<br>');
        }
        
        // Update effects
        const effectsElement = container.querySelector('.upgrade-effects');
        if (effectsElement) {
            const formattedEffects = this.formatUpgradeEffects(upgradeData);
            effectsElement.innerHTML = 'Effects:<br>' + formattedEffects.replace(/\n/g, '<br>');
        }
    }

    /**
     * Check and update upgrade category visibility
     * Hides categories that have no visible upgrades
     */
    updateUpgradeCategoryVisibility() {
        // Get all upgrade category containers
        const categories = document.querySelectorAll('.upgrade-category-container');
        
        categories.forEach(category => {
            // Get all upgrade buttons in this category that aren't hidden
            const visibleUpgrades = category.querySelectorAll('.upgrade-button-container:not(.hidden)');
            
            // If there are no visible upgrades, hide the category
            if (visibleUpgrades.length === 0) {
                category.classList.add('hidden');
            } else {
                category.classList.remove('hidden');
            }
        });
    }

    /**
     * Update an upgrade's completion status
     * @param {Object} data - Data about the completion
     */
    updateUpgradeCompletion(data) {
        const button = document.getElementById(`upgrade-${data.id}`);
        if (!button) return;
        
        // Update the button
        this.updateUpgradeButton({
            id: data.id,
            completionCount: data.completionCount,
            maxCompletions: data.maxCompletions,
            unlocked: data.unlocked
        });
    }

    /**
     * Show a message when an upgrade is purchased
     * @param {Object} data - Data about the purchase
     */
    showUpgradePurchasedMessage(data) {
        if (data.message) {
            this.eventController.emit('ui:notification', {
                message: data.message,
                type: 'success'
            });
        }
    }

    /**
     * Toggle home selection grid visibility
     */
    toggleHomeSelection() {
        if (this.homeSelectionContainer) {
            this.homeSelectionContainer.classList.toggle('hidden');
            // Hide furniture selection if it's visible
            if (this.furnitureSelectionContainer) {
                this.furnitureSelectionContainer.classList.add('hidden');
            }
        }
    }
    
    /**
     * Update the current home button with home details
     * @param {Object} homeData - ID of the home to display
     */
    updateCurrentHomeButton(homeData) {
        const home = homeData;

        if (!home || !this.currentHomeButton) return;
        
        // Update button text
        this.currentHomeButton.textContent = home.name;
        
        // Update tooltip details
        const tooltipName = document.getElementById('home-tooltip-name');
        const tooltipDesc = document.getElementById('home-tooltip-description');
        const tooltipSpace = document.getElementById('home-tooltip-space');
        const tooltipMods = document.getElementById('home-tooltip-mods');
        
        if (tooltipName) tooltipName.textContent = home.name;
        if (tooltipDesc) tooltipDesc.textContent = home.description;
        if (tooltipSpace) tooltipSpace.textContent = `Floor Space: ${home.usedFloorSpace}/${home.maxFloorSpace}`;
        if (tooltipMods) {
            // Placeholder for home modifications
            tooltipMods.textContent = 'Modifications: None';
        }
    }
    
    /**
     * Add a home to the home selection grid
     * @param {Object} homeData - Data for the home to add
     */
    addHomeToSelectionGrid(homeData) {
        if (!this.homeSelectionContainer) return;

        // Check if a home with this ID already exists
        const existingHome = this.homeSelectionContainer.querySelector(
            `.home-selection-button[data-home-id="${homeData.id}"]`
        );
        if (existingHome) return;
        
        // Get the home selection template
        const template = document.getElementById('home-selection-template');
        if (!template) return;
        
        // Clone the template
        const homeElement = template.content.cloneNode(true);
        
        // Update home button
        const homeButton = homeElement.querySelector('.home-selection-button');
        const homeNameSpan = homeButton.querySelector('.home-name');
        if (homeNameSpan) homeNameSpan.textContent = homeData.name;
        homeButton.dataset.homeId = homeData.id;
        
        // Add click event to select home
        homeButton.addEventListener('click', () => this.selectHome(homeData.id));
        
        // Update tooltip
        const tooltipName = homeElement.querySelector('.home-tooltip-name');
        const tooltipDesc = homeElement.querySelector('.home-tooltip-description');
        const tooltipSpace = homeElement.querySelector('.home-tooltip-space');
        const tooltipReqs = homeElement.querySelector('.home-tooltip-requirements');
        
        if (tooltipName) tooltipName.textContent = homeData.name;
        if (tooltipDesc) tooltipDesc.textContent = homeData.description;
        if (tooltipSpace) tooltipSpace.textContent = `Floor Space: 0/${homeData.maxFloorSpace}`;
        
        // TODO: Improve requirement display
        if (tooltipReqs) tooltipReqs.textContent = 'Requirements: Check in-game';
        
        // Add to grid
        this.homeSelectionContainer.appendChild(homeElement);
    }
    
    /**
     * Select a home and display its furniture
     * @param {string} homeId - ID of the selected home
     */
    selectHome(homeId) {
        // Emit home transition event
        this.eventController.emit('home:transition', { homeId: homeId });
        
        // Hide home selection grid
        if (this.homeSelectionContainer) {
            this.homeSelectionContainer.classList.add('hidden');
        }
        
        // Show furniture for the selected home
        this.updateFurnitureDisplay(homeId);
    }

    /**
     * Create a furniture row element from the template
     * @param {Object} furnitureData - Data for the furniture item
     * @returns {HTMLElement} The created furniture row element
     */
    createFurnitureElement(furnitureData) {
        // Get the template
        const template = document.getElementById('furniture-row-template');
        if (!template) return null;
        
        // Clone the template
        const furnitureElement = template.content.cloneNode(true);
        
        // Get character data to check ownership
        let ownedCount = 0;
        let maxCount = furnitureData.maxCount || 1;
        
        if (window.game && window.game.gameState) {
            const character = window.game.gameState.getActiveCharacter();
            if (character && character.inventory && character.inventory.furniture && 
                character.inventory.furniture[furnitureData.id]) {
                ownedCount = character.inventory.furniture[furnitureData.id].purchased ? 1 : 0;
            }
        }
        
        // Set basic info
        furnitureElement.querySelector('.furniture-space').textContent = furnitureData.size || 1;
        
        const nameElement = furnitureElement.querySelector('.furniture-name');
        nameElement.textContent = furnitureData.name;
        nameElement.prepend(furnitureElement.querySelector('.furniture-star'));
        
        // Set ownership display
        const ownedDisplay = furnitureElement.querySelector('.furniture-owned');
        if (maxCount < Infinity) {
            ownedDisplay.textContent = `${ownedCount}/${maxCount}`;
        } else {
            ownedDisplay.textContent = ownedCount.toString();
        }
        
        // Set up buttons
        const buyButton = furnitureElement.querySelector('.furniture-buy-button');
        const sellButton = furnitureElement.querySelector('.furniture-sell-button');
        
        // Add ID to the row
        const row = furnitureElement.querySelector('.furniture-row');
        row.id = `furniture-${furnitureData.id}`;
        row.dataset.furnitureId = furnitureData.id;
        
        // Set up buy button
        if (buyButton) {
            if (ownedCount >= maxCount) {
                buyButton.disabled = true;
                buyButton.textContent = 'Owned';
            } else {
                buyButton.addEventListener('click', () => {
                    this.eventController.emit('furniture:purchase', {
                        furnitureId: furnitureData.id
                    });
                });
            }
        }
        
        // Set up sell button
        if (sellButton) {
            if (ownedCount <= 0) {
                sellButton.disabled = true;
            } else {
                sellButton.addEventListener('click', () => {
                    this.eventController.emit('furniture:sell', {
                        furnitureId: furnitureData.id
                    });
                });
            }
        }
        
        // Set up tooltip
        const tooltip = furnitureElement.querySelector('.furniture-tooltip');
        if (tooltip) {
            tooltip.querySelector('.tooltip-title').innerHTML = 
                `${furnitureData.name} <span class="tooltip-max">max: ${maxCount}</span> <span class="tooltip-star">★</span>`;
            tooltip.querySelector('.tooltip-category').textContent = this.capitalizeFirstLetter(furnitureData.type || 'basic');
            tooltip.querySelector('.tooltip-description').textContent = furnitureData.description;
            
            // Set cost
            const costElement = tooltip.querySelector('.tooltip-cost');
            if (costElement && furnitureData.costs) {
                for (const [currency, amount] of Object.entries(furnitureData.costs)) {
                    costElement.textContent = `${this.capitalizeFirstLetter(currency)}: ${amount}`;
                    break; // Just use the first cost for now
                }
            }
            
            // Set effects
            if (furnitureData.effects) {
                const modElement = tooltip.querySelector('.tooltip-modification');
                if (modElement) {
                    let modText = `Space: ${furnitureData.size || 1}`;
                    
                    // Add stat regen effects
                    if (furnitureData.effects.statRegens) {
                        for (const [stat, value] of Object.entries(furnitureData.effects.statRegens)) {
                            modText += `<br>${this.capitalizeFirstLetter(stat)} Regen: +${value}/sec`;
                        }
                    }
                    
                    // Add stat boost effects
                    if (furnitureData.effects.statBoosts) {
                        for (const [stat, value] of Object.entries(furnitureData.effects.statBoosts)) {
                            modText += `<br>${this.capitalizeFirstLetter(stat)} Max: +${value}`;
                        }
                    }
                    
                    modElement.innerHTML = modText;
                }
            }
        }
        
        return furnitureElement;
    }

    /**
     * Add a furniture item to the UI
     * @param {Object} furnitureData - Data for the furniture item
     */
    addFurnitureItem(furnitureData) {
        // Skip if the furniture table body hasn't been initialized
        if (!this.furnitureTableBody) return;
        
        // Check if furniture already exists in the table
        const existingFurniture = document.getElementById(`furniture-${furnitureData.id}`);
        if (existingFurniture) return;
        
        // Create and add the furniture element
        const furnitureRow = this.createFurnitureElement(furnitureData);
        if (furnitureRow) {
            this.furnitureTableBody.appendChild(furnitureRow);
        }
        
        // Update space indicator
        this.updateSpaceIndicator();
    }

    /**
     * Update space indicator in the furniture display
     */
    updateSpaceIndicator() {
        const spaceIndicator = this.furnitureSelectionContainer?.querySelector('.space-indicator');
        if (!spaceIndicator) return;
        
        const character = window.game?.gameState?.getActiveCharacter();
        if (!character || !character.home) return;
        
        const currentHome = character.home;
        spaceIndicator.textContent = `Space: ${currentHome.usedFloorSpace || 0}/${currentHome.maxFloorSpace || 0}`;
    }

    /**
     * Apply furniture filters based on checkbox states
     */
    applyFurnitureFilters() {
        if (!this.furnitureSelectionContainer) return;
        
        const filterOwned = this.furnitureSelectionContainer.querySelector('#filter-owned')?.checked;
        const filterUnowned = this.furnitureSelectionContainer.querySelector('#filter-unowned')?.checked;
        const filterBlocked = this.furnitureSelectionContainer.querySelector('#filter-blocked')?.checked;
        
        // Get all furniture rows
        const furnitureRows = this.furnitureTableBody?.querySelectorAll('.furniture-row');
        if (!furnitureRows) return;
        
        furnitureRows.forEach(row => {
            const ownedText = row.querySelector('.furniture-owned')?.textContent;
            const isOwned = ownedText && parseInt(ownedText) > 0;
            
            // Simple filter logic
            if ((isOwned && filterOwned) || (!isOwned && filterUnowned)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    /**
     * Update furniture ownership display after purchase
     * @param {Object} data - Purchase data
     */
    updateFurnitureOwnership(data) {
        const furnitureItem = document.getElementById(`furniture-${data.furnitureId}`);
        if (!furnitureItem) return;
        
        // Update owned count
        const ownedDisplay = furnitureItem.querySelector('.furniture-owned');
        if (ownedDisplay) {
            ownedDisplay.textContent = '1/1'; // Assuming max of 1
        }
        
        // Update buy button
        const buyButton = furnitureItem.querySelector('.furniture-buy-button');
        if (buyButton) {
            buyButton.disabled = true;
            buyButton.textContent = 'Owned';
        }
        
        // Enable sell button
        const sellButton = furnitureItem.querySelector('.furniture-sell-button');
        if (sellButton) {
            sellButton.disabled = false;
        }
    }

    /**
     * Update furniture placement status
     * @param {Object} data - Placement data
     */
    updateFurniturePlacement(data) {
        const furnitureItem = document.getElementById(`furniture-${data.furnitureId}`);
        if (!furnitureItem) return;
        
        // Mark as placed visually
        furnitureItem.classList.add('placed');
        
        // Disable the sell button if it's placed
        const sellButton = furnitureItem.querySelector('.furniture-sell-button');
        if (sellButton) {
            sellButton.disabled = true;
            sellButton.title = 'Remove from home first';
        }
    }

    /**
     * Update furniture after removal from home
     * @param {Object} data - Removal data
     */
    updateFurnitureRemoval(data) {
        const furnitureItem = document.getElementById(`furniture-${data.furnitureId}`);
        if (!furnitureItem) return;
        
        // Remove placed class
        furnitureItem.classList.remove('placed');
        
        // Enable sell button
        const sellButton = furnitureItem.querySelector('.furniture-sell-button');
        if (sellButton) {
            sellButton.disabled = false;
            sellButton.title = '';
        }
    }

    /**
     * Update the entire furniture display
     * @param {string} homeId - ID of the home to display furniture for
     */
    updateFurnitureDisplay(homeId) {
        // Make sure the furniture container is visible
        if (this.furnitureSelectionContainer) {
            this.furnitureSelectionContainer.classList.remove('hidden');
        }
        
        // Update space indicator
        this.updateSpaceIndicator();
        
        // Get all furniture items
        const furnitureController = window.game?.furnitureController;
        if (!furnitureController) return;
        
        // Clear existing furniture items
        if (this.furnitureTableBody) {
            this.furnitureTableBody.innerHTML = '';
        }
        
        // Add all furniture items
        for (const furnitureId in furnitureController.furniture) {
            const furniture = furnitureController.furniture[furnitureId];
            this.addFurnitureItem(furniture);
        }
        
        // Update placement status
        const placedFurniture = furnitureController.getPlacedFurnitureInHome(homeId);
        for (const furnitureId in placedFurniture) {
            this.updateFurniturePlacement({ furnitureId });
        }
        
        // Apply filters
        this.applyFurnitureFilters();
    }

    /**
     * Refresh the entire furniture display
     */
    refreshFurnitureDisplay() {
        // Clear existing furniture
        if (this.furnitureGrid) {
            this.furnitureGrid.innerHTML = '';
        }
        
        // Get furniture controller
        const furnitureController = window.game.furnitureController;
        if (!furnitureController) return;
        
        // Add all furniture items
        for (const furnitureId in furnitureController.furniture) {
            const furniture = furnitureController.furniture[furnitureId];
            this.addFurnitureItem(furniture);
        }
        
        // Update placement status based on current home
        const character = this.gameState.getActiveCharacter();
        if (character && character.home) {
            this.updateFurnitureDisplay(character.home.id);
        }
    }

    /**
     * Show message when furniture is purchased
     * @param {Object} data - Purchase data
     */
    showFurniturePurchasedMessage(data) {
        if (data.message) {
            this.eventController.emit('ui:notification', {
                message: data.message,
                type: 'success'
            });
        }
    }

    /**
     * Show message when furniture is placed
     * @param {Object} data - Placement data
     */
    showFurniturePlacedMessage(data) {
        if (data.message) {
            this.eventController.emit('ui:notification', {
                message: data.message,
                type: 'success'
            });
        }
    }

    /**
     * Show message when furniture is removed
     * @param {Object} data - Removal data
     */
    showFurnitureRemovedMessage(data) {
        if (data.message) {
            this.eventController.emit('ui:notification', {
                message: data.message,
                type: 'info'
            });
        }
    }    
}