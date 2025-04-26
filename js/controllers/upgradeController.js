// ./js/controllers/upgradeController.js
// The controller interface for upgrades

class UpgradeController {
    /**
     * Create a new upgrade controller
     * @param {EventController} eventController - The event controller for pub/sub
     * @param {GameState} gameState - The game state
     */
    constructor(eventController, gameState) {
        this.eventController = eventController;
        this.gameState = gameState;
        this.upgrades = {}; // Dictionary of all upgrade objects by ID
        
        // Subscribe to events
        this.subscribeToEvents();
    }
    
    /**
     * Initialize the upgrade controller
     */
    init() {
        console.log('Initializing UpgradeController...');
    }
    
    /**
     * Subscribe to game events
     */
    subscribeToEvents() {
        // Listen for character creation to initialize upgrades
        this.eventController.on('character:needUpgrades', () => {
            this.setupInitialUpgrades();
        });
        
        // Listen for save loaded
        this.eventController.on('save:loaded', () => {
            this.loadUpgradesFromGameState();
        });
        
        // Listen for currency updates to check for new available upgrades
        this.eventController.on('currency:updated', data => {
            this.checkUpgradeAvailability(data.id, data.current);
        });
        
        // Listen for stat updates to check for new available upgrades
        this.eventController.on('stat:updated', data => {
            this.checkUpgradeAvailability(data.id, data.current);
        });

        // Listen for upgrade purchase attempts
        this.eventController.on('upgrade:purchase', data => {
            this.purchaseUpgrade(data.id);
        });
    }
    
    /**
     * Set up initial upgrades for a new character
     */
    setupInitialUpgrades() {
        const character = this.gameState.getActiveCharacter();
        if (!character) return;
        
        // Clear existing upgrades
        this.upgrades = {};
        
        // Create default upgrades based on character class
        this.createDefaultUpgrades(character.class);
    }
    
    /**
     * Create default upgrades based on character class
     * @param {string} characterClass - The character's class
     */
    createDefaultUpgrades(characterClass) {
        // Common upgrades for all classes
        this.createUpgrade('coin_purse', 'Coin Purse', 'Increase your maximum gold capacity by 10.', {
            currencyCosts: {
                'gold': 10
            },
            maxCompletions: 3, // Can be purchased up to 5 times
            requiredCurrency: {
                'gold': 10 // Requires at least 10 gold to see this upgrade
            },
            unlocked: false, // Will be unlocked once requirements are met
            upgradeTarget: 'resource',
            upgradeTargetId: 'gold',
            upgradeType: 'max',
            upgradeValue: 15,
            category: 'storage',
            tier: 1,
            messages: {
                complete: 'You purchased a Coin Purse, increasing your gold capacity by 10!'
            }
        });
        
        this.createUpgrade('stamina_training', 'Stamina Training', 'Increase your maximum stamina by 2.', {
            currencyCosts: {
                'gold': 15
            },
            maxCompletions: 3,
            requiredCurrency: {
                'gold': 15
            },
            unlocked: false,
            upgradeTarget: 'resource',
            upgradeTargetId: 'stamina',
            upgradeType: 'max',
            upgradeValue: 2,
            category: 'attributes',
            tier: 1,
            messages: {
                complete: 'You completed stamina training, increasing your maximum stamina by 2!'
            }
        });
        
        // Class-specific upgrades
        if (characterClass.toLowerCase() === 'waif') {
            this.createUpgrade('nimble_fingers', 'Nimble Fingers', 'Increase your begging efficiency by 20%.', {
                currencyCosts: {
                    'gold': 25
                },
                maxCompletions: 1,
                requiredCurrency: {
                    'gold': 25
                },
                requiredActions: {
                    'beg': 10 // Requires having completed the beg action 10 times
                },
                unlocked: false,
                upgradeTarget: 'action',
                upgradeTargetId: 'beg',
                upgradeType: 'efficiency',
                upgradeValue: 0.9,
                category: 'skills',
                tier: 1,
                messages: {
                    complete: 'You\'ve trained your fingers to be more nimble, improving your begging efficiency!'
                }
            });
        } else if (characterClass.toLowerCase() === 'vagabond') {
            this.createUpgrade('tough_skin', 'Tough Skin', 'Increase your maximum health by 3.', {
                currencyCosts: {
                    'gold': 25
                },
                maxCompletions: 1,
                requiredCurrency: {
                    'gold': 25
                },
                unlocked: false,
                upgradeTarget: 'resource',
                upgradeTargetId: 'health',
                upgradeType: 'max',
                upgradeValue: 3,
                category: 'attributes',
                tier: 1,
                messages: {
                    complete: 'Your skin has toughened from your travels, increasing your maximum health!'
                }
            });
        }
    }
    
    /**
     * Create a new upgrade
     * @param {string} id - Unique identifier for the upgrade
     * @param {string} name - Display name for the upgrade
     * @param {string} description - Description of the upgrade
     * @param {Object} options - Additional options for the upgrade
     * @returns {Upgrade} The created upgrade
     */
    createUpgrade(id, name, description, options = {}) {
        // Ensure type is set
        options.type = 'upgrade';

        // Create the upgrade
        const upgrade = new Upgrade(id, name, description, options);
        
        // Add to upgrades dictionary
        this.upgrades[id] = upgrade;
        
        // Add to character if one exists
        const character = this.gameState.getActiveCharacter();
        if (character) {
            character.actions = character.actions || {};
            character.actions[id] = upgrade.serialize();
        }
        
        // Check if it should be visible immediately
        if (character) {
            const requirements = upgrade.checkVisibilityRequirements(character);
            if (requirements.success) {
                upgrade.unlocked = true;
                this.updateCharacterUpgradeData(upgrade);
                
                // Emit upgrade added event
                this.eventController.emit('upgrade:added', {
                    id: id,
                    name: name,
                    description: description,
                    costs: upgrade.currencyCosts,
                    
                    category: upgrade.category,
                    tier: upgrade.tier,
                    completionCount: upgrade.completionCount,
                    maxCompletions: upgrade.maxCompletions
                });
            }
        }
        
        return upgrade;
    }
    
    /**
     * Purchase an upgrade
     * @param {string} upgradeId - ID of the upgrade to purchase
     * @returns {boolean} Whether the purchase was successful
     */
    purchaseUpgrade(upgradeId) {
        const upgrade = this.upgrades[upgradeId];
        if (!upgrade) return false;
        
        const character = this.gameState.getActiveCharacter();
        if (!character) return false;
        
        // Check if the upgrade can be purchased
        if (!upgrade.canStart(character)) {
            return false;
        }
        
        // Check if we have enough currency for all costs
        let hasEnoughResources = true;
        let insufficientResource = null;
        
        // Check currency costs
        for (const currencyId in upgrade.currencyCosts) {
            const cost = upgrade.currencyCosts[currencyId];
            const currentAmount = character.currencies?.[currencyId]?.current || 0;
            
            if (currentAmount < cost) {
                hasEnoughResources = false;
                insufficientResource = `${this.capitalizeFirstLetter(currencyId)}`;
                break;
            }
        }
        
        // Check stat costs
        if (hasEnoughResources) {
            for (const statId in upgrade.statCosts) {
                const cost = upgrade.statCosts[statId];
                const currentAmount = character.stats?.[statId]?.current || 0;
                
                if (currentAmount < cost) {
                    hasEnoughResources = false;
                    insufficientResource = `${this.capitalizeFirstLetter(statId)}`;
                    break;
                }
            }
        }
        
        if (!hasEnoughResources) {
            // Tell the user they don't have enough resources
            this.eventController.emit('ui:notification', {
                message: `You don't have enough ${insufficientResource} to purchase ${upgrade.name}`,
                type: 'error'
            });
            return false;
        }
        
        // Apply costs - now we know we have enough
        // Apply currency costs
        for (const currencyId in upgrade.currencyCosts) {
            const cost = upgrade.currencyCosts[currencyId];
            
            this.eventController.emit('resource:cost', {
                type: 'currency',
                id: currencyId,
                amount: cost
            });
        }
        
        // Apply stat costs
        for (const statId in upgrade.statCosts) {
            const cost = upgrade.statCosts[statId];
            
            this.eventController.emit('resource:cost', {
                type: 'stat',
                id: statId,
                amount: cost
            });
        }
        
        // Apply the upgrade effect
        this.applyUpgradeEffect(upgrade);
        
        // Mark as completed
        upgrade.completionCount++;
        if (upgrade.completionCount >= upgrade.maxCompletions) {
            upgrade.unlocked = false; // No longer available if max completions reached
        }
        
        // Update character data
        this.updateCharacterUpgradeData(upgrade);
        
        // Emit upgrade purchased event
        this.eventController.emit('upgrade:purchased', {
            id: upgradeId,
            name: upgrade.name,
            completionCount: upgrade.completionCount,
            maxCompletions: upgrade.maxCompletions,
            message: upgrade.messages.complete
        });
        
        return true;
    }
    
    /**
     * Apply the effect of an upgrade
     * @param {Upgrade} upgrade - The upgrade to apply
     */
    applyUpgradeEffect(upgrade) {
        if (!upgrade.upgradeTarget || !upgrade.upgradeType || !upgrade.upgradeTargetId) {
            console.warn(`Upgrade ${upgrade.id} is missing target information:`, 
                `target: ${upgrade.upgradeTarget}, type: ${upgrade.upgradeType}, targetId: ${upgrade.upgradeTargetId}`);
            return;
        }
        switch (upgrade.upgradeTarget) {
            case 'resource':
                if (upgrade.upgradeType === 'max') {
                    this.eventController.emit('resource:upgrade', {
                        resource: 'resource',
                        type: 'max',
                        id: upgrade.upgradeTargetId,
                        amount: upgrade.upgradeValue,
                        message: upgrade.messages.complete
                    });                
                } else if (upgrade.upgradeType === 'regen') {
                    // Increase stat regeneration rate
                    this.eventController.emit('resource:upgrade', {
                        resource: 'resource',
                        type: 'regen',
                        id: upgrade.upgradeTargetId,
                        amount: upgrade.upgradeValue,
                        message: upgrade.messages.complete
                    });
                }
                break;
                
            case 'action':
                if (upgrade.upgradeType === 'efficiency') {
                    // Add modifier to action
                    this.eventController.emit('action:add-modifier', {
                        actionId: upgrade.upgradeTargetId,
                        id: `upgrade_${upgrade.id}`,
                        type: 'duration',
                        value: upgrade.upgradeValue,                        
                        source: `${upgrade.name}`,
                        isMultiplier: true,
                        message: upgrade.messages.complete
                    });
                }
                break;
        }
    }
    
    /**
     * Check if any upgrades should become available due to resource changes
     * @param {string} resourceId - ID of the resource that changed
     * @param {number} currentValue - Current value of the resource
     */
    checkUpgradeAvailability(resourceId, currentValue) {
        const character = this.gameState.getActiveCharacter();
        if (!character) return;
        
        for (const upgradeId in this.upgrades) {
            const upgrade = this.upgrades[upgradeId];
            
            // Skip if already unlocked or max completions reached
            if (upgrade.unlocked || upgrade.completionCount >= upgrade.maxCompletions) {
                continue;
            }
            
            // Check if this resource affects this upgrade's visibility
            if (upgrade.requiredCurrency && upgrade.requiredCurrency[resourceId]) {
                const requiredAmount = upgrade.requiredCurrency[resourceId];
                
                // If we've reached the required amount, unlock the upgrade
                if (currentValue >= requiredAmount) {
                    const requirements = upgrade.checkVisibilityRequirements(character);
                    if (requirements.success) {
                        upgrade.unlocked = true;
                        this.updateCharacterUpgradeData(upgrade);
                        
                        // Emit upgrade unlocked event
                        this.eventController.emit('upgrade:added', {
                            id: upgradeId,
                            name: upgrade.name,
                            description: upgrade.description,
                            costs: upgrade.currencyCosts,
                            category: upgrade.category,
                            tier: upgrade.tier,
                            completionCount: upgrade.completionCount,
                            maxCompletions: upgrade.maxCompletions
                        });
                    }
                }
            }
        }
    }
    
    /**
     * Update upgrade data in character object
     * @param {Upgrade} upgrade - Upgrade to update
     */
    updateCharacterUpgradeData(upgrade) {
        const character = this.gameState.getActiveCharacter();
        if (!character) return;
        
        character.actions = character.actions || {};
        character.actions[upgrade.id] = upgrade.serialize();
    }
    
    /**
     * Load upgrades from game state
     */
    loadUpgradesFromGameState() {
        const character = this.gameState.getActiveCharacter();
        if (!character || !character.actions) return;
        
        // Clear existing upgrades
        this.upgrades = {};
        
        // Set up initial upgrades
        this.setupInitialUpgrades();
        
        // Update upgrade data from saved state
        for (const actionId in character.actions) {
            const actionData = character.actions[actionId];
            
            // Check if this is an upgrade (by id pattern or type property)
            if (actionData.type === 'upgrade') {
                // Find the upgrade in our collection
                const upgrade = this.upgrades[actionId];
                
                // If it exists in our predefined upgrades, update it
                if (upgrade) {
                    upgrade.deserialize(actionData);
                    
                    // If unlocked, emit event for UI
                    if (upgrade.unlocked) {
                        this.eventController.emit('upgrade:added', {
                            id: actionId,
                            name: upgrade.name,
                            description: upgrade.description,
                            costs: upgrade.currencyCosts,
                            category: upgrade.category,
                            tier: upgrade.tier,
                            completionCount: upgrade.completionCount,
                            maxCompletions: upgrade.maxCompletions,
                            // Include upgrade-specific data for UI tooltip
                            upgradeTarget: upgrade.upgradeTarget,
                            upgradeTargetId: upgrade.upgradeTargetId,
                            upgradeType: upgrade.upgradeType,
                            upgradeValue: upgrade.upgradeValue
                        });
                    }
                    
                    // If was already completed, apply effects for each completion
                    if (upgrade.completionCount > 0) {
                        for (let i = 0; i < upgrade.completionCount; i++) {
                            this.applyUpgradeEffect(upgrade);
                        }
                    }
                } 
                // If it's an upgrade we don't know about (maybe from a previous version),
                // we could choose to recreate it or ignore it
            }
        }
    }
    
    /**
     * Get all available upgrades
     * @returns {Object} Dictionary of available upgrades
     */
    getAvailableUpgrades() {
        const availableUpgrades = {};
        
        for (const upgradeId in this.upgrades) {
            const upgrade = this.upgrades[upgradeId];
            if (upgrade.unlocked) {
                availableUpgrades[upgradeId] = upgrade;
            }
        }
        
        return availableUpgrades;
    }
    
    /**
     * Get upgrades by category
     * @param {string} category - Category to filter by
     * @returns {Array} Array of upgrades in the category
     */
    getUpgradesByCategory(category) {
        return Object.values(this.upgrades).filter(
            upgrade => upgrade.category === category && upgrade.unlocked
        );
    }

    // Add this helper method to the class
    capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}