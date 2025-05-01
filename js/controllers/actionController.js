// ./js/controllers/actionController.js
// The controller interface for actions

class ActionController {
    /**
     * Create a new action controller
     * @param {EventController} eventController - The event controller for pub/sub
     * @param {GameState} gameState - The game state
     */
    constructor(eventController, gameState) {
        this.eventController = eventController;
        this.gameState = gameState;
        this.actions = {}; // Dictionary of all action objects by ID
        this.activeAction = null; // Currently active action
        this.restAction = null; // Current rest action
        this.previousAction = null; // Previous action
        
        // Subscribe to events
        this.subscribeToEvents();
    }
    
    /**
     * Initialize the action controller
     */
    init() {
        console.log('Initializing ActionController...');
        
        // Setup initial actions
        this.setupInitialActions();
        
        // Load any existing actions from game state
        this.loadActionsFromGameState();
    }
    
    /**
     * Subscribe to game events
     */
    subscribeToEvents() {
        // Listen for character creation to initialize actions
        this.eventController.on('character:needActions', () => {
            this.setupInitialActions();
        });
        
        // Listen for save loaded
        this.eventController.on('save:loaded', () => {
            this.loadActionsFromGameState();
        });

        // Listen for action modifier events
        this.eventController.on('action:add-modifier', (data) => {
            this.addModifier(data);
        });
    }
    
    /**
     * Set up initial actions for a new character
     */
    setupInitialActions() {
        const character = this.gameState.getActiveCharacter();
        if (!character) return;
        
        // Clear existing actions
        this.actions = {};
        
        // Create the config loader
        const configLoader = new ConfigLoader(this.eventController);
        
        // Load actions from config
        configLoader.loadActions(this, ActionConfig, character);
    }
    
    /**
     * Create default actions based on character class
     * @param {string} characterClass - The character's class
     */
    createDefaultActions(characterClass) {
        // Common actions for all classes
        this.createAction('beg', 'Beg', 'Beg for coins in the street.', {
            baseDuration: 4000, // 4 seconds
            unlocked: true,
            autoRestart: true,
            statCosts: {
                'stamina': 0.5 // 0.5 stamina per second
            },
            currencyRewards: {
                'gold': 5
            },
            skillExperience: {
                'survival': 100
            },
            randomRewards: [
                {
                    chance: 10, // 10% chance
                    reward: {
                        currencies: { 'gold': 4 }
                    },
                    message: 'A kind noble gives you extra coins!'
                }
            ],
            messages: {
                start: 'You begin begging for coins...',
                progress: 'You continue begging for coins...',
                complete: 'You received some coins from begging.',
                cancel: 'You stop begging.',
                fail: 'You\'re too tired to continue begging.'
            }
        });

        this.createAction('rest_abandoned', 'Rest in Abandoned Building', 'Find shelter and rest in an abandoned building.', {
            baseDuration: 5000, // 5 seconds
            unlocked: true,
            autoRestart: false,
            isRestAction: true,
            progressRewards: {
                "20": {
                    stats: {
                        'health': 0.5,
                        'stamina': 1
                    }
                },
                "40": {
                    stats: {
                        'health': 0.5,
                        'stamina': 1
                    }
                },
                "60": {
                    stats: {
                        'health': 0.5,
                        'stamina': 1
                    }
                },
                "80": {
                    stats: {
                        'health': 0.5,
                        'stamina': 1
                    }
                },
                "99": {
                    stats: {
                        'health': 0.5,
                        'stamina': 1
                    }
                }
            },
            messages: {
                start: 'You find an abandoned building to rest in...',
                progress: 'You continue resting...',
                complete: 'You feel somewhat refreshed.',
                cancel: 'You stop resting.',
                fail: 'You were unable to rest.'
            }
        });
        
        // Set this as the rest action
        this.restAction = this.actions['rest_abandoned'];
    }
    
    /**
     * Create a new action
     * @param {string} id - Unique identifier for the action
     * @param {string} name - Display name for the action
     * @param {string} description - Description of the action
     * @param {Object} options - Additional options for the action
     * @returns {Action} The created action
     */
    createAction(id, name, description, options = {}) {
        // Create the action
        const action = new Action(id, name, description, options);
        
        // Add to actions dictionary
        this.actions[id] = action;
        
        // Add to character if one exists
        const character = this.gameState.getActiveCharacter();
        if (character) {
            character.actions = character.actions || {};
            character.actions[id] = action.serialize();
        }
        
        // Emit action added event
        this.eventController.emit('action:added', {
            id: id,
            name: name,
            description: description,
            isRestAction: options.isRestAction || false,
            unlocked: action.unlocked
        });
        
        // Emit action data-ready event to update tooltips
        this.eventController.emit('action:data-ready', {
            id: action.id,
            name: action.name,
            description: action.description,
            statCosts: action.statCosts,
            currencyCosts: action.currencyCosts,
            statRewards: action.statRewards, 
            currencyRewards: action.currencyRewards,
            skillExperience: action.skillExperience,
            randomRewards: action.randomRewards,
            progressRewards: action.progressRewards, // Include progress rewards
            isRestAction: action.isRestAction,
            unlocked: action.unlocked,
            completionCount: action.completionCount,
            progress: action.currentProgress
        });
        
        return action;
    }
    
    /**
     * Start an action
     * @param {string} actionId - ID of the action to start
     * @returns {boolean} Whether the action was successfully started
     */
    startAction(actionId) {
        const action = this.actions[actionId];
        if (!action || !action.canStart()) {
            return false;
        }
        
        // Store the current action as previous action if we're switching to a rest action
        // and the current action isn't already a rest action
        if (action.isRestAction && this.activeAction && !this.activeAction.isRestAction) {
            this.previousAction = this.activeAction;
        }
        
        // Stop current action if there is one
        if (this.activeAction) {
            this.stopAction();
        }
        
        // Start the action
        const started = action.start();
        if (!started) {
            return false;
        }
        
        this.activeAction = action;
        
        // Update character data
        this.updateCharacterActionData(action);
        
        // Emit action started event
        this.eventController.emit('action:started', {
            id: action.id,
            name: action.name,
            message: action.messages.start
        });
        
        return true;
    }
    
    /**
     * Stop the current action
     * @returns {boolean} Whether an action was stopped
     */
    stopAction() {
        if (!this.activeAction) {
            return false;
        }
        
        const result = this.activeAction.stop();
        const action = this.activeAction;
        this.activeAction = null;
        
        // Update character data
        this.updateCharacterActionData(action);
        
        // Emit action stopped event
        this.eventController.emit('action:stopped', {
            id: action.id,
            name: action.name,
            progress: action.progress,
            message: result.message
        });
        
        return true;
    }
    
    /**
     * Start the rest action
     * @returns {boolean} Whether the rest action was started
     */
    startRestAction() {
        if (!this.restAction) {
            console.log('No rest action registered.');
            return false;
        };
        this.startAction(this.restAction.id);
        
        return false;
    }
    
    /**
     * Update the action controller to preserve progress when stopping due to insufficient resources
     */
    updateActions(deltaTime) {
        if (!this.activeAction) {
            return;
        }
        
        const character = this.gameState.getActiveCharacter();
        if (!character) {
            return;
        }
        
        // Update the active action
        const result = this.activeAction.update(deltaTime, character);
        
        // If no result, nothing to do
        if (!result) {
            return;
        }
        
        // Apply costs
        this.applyCosts(result.costs);
        
        // Apply rewards if any
        if (result.rewards) {
            this.applyRewards(result.rewards);
        }
        
        // Update character data
        this.updateCharacterActionData(this.activeAction);
        
        // Emit progress event
        this.eventController.emit('action:progress', {
            id: result.id,
            name: result.name,
            progress: result.progress,
            progressChange: result.progressChange
        });
        
        // If completed, emit completion event
        if (result.completed) {
            this.eventController.emit('action:completed', {
                id: result.id,
                name: result.name,
                completionCount: result.completionCount,
                message: result.message,
                rewards: result.rewards,
                autoRestarted: this.activeAction && this.activeAction.id === result.id
            });
            
            // Check if this was a rest action that's no longer active (fully rested)
            // and if we have a previous action to resume
            if (this.activeAction && this.activeAction.isRestAction && 
                !this.activeAction.isActive && this.previousAction) {
                
                // Get health and stamina to check if they're full enough to resume
                const health = character.stats.health ? character.stats.health.current : 0;
                const healthMax = character.stats.health ? character.stats.health.max : 0;
                const stamina = character.stats.stamina ? character.stats.stamina.current : 0;
                const staminaMax = character.stats.stamina ? character.stats.stamina.max : 0;
                
                // Only resume if we have enough resources (at least 50% of each)
                if (health >= healthMax * 0.5 && stamina >= staminaMax * 0.5) {
                    const previousActionId = this.previousAction.id;
                    this.previousAction = null; // Clear the previous action reference
                    
                    // Start the previous action
                    this.startAction(previousActionId);
                } else {
                    // Not enough resources yet, just clear the active action
                    this.activeAction = null;
                    this.previousAction = null;
                }
            }
        }
        
        // If action failed due to insufficient resources, start rest action
        if (result.insufficientResources && result.insufficientResources.length > 0) {
            // Log the failure but include the current progress in the event
            this.eventController.emit('action:failed', {
                id: result.id,
                name: result.name,
                message: result.message,
                insufficientResources: result.insufficientResources,
                progress: result.progress // Add the current progress here
            });
            
            // Start rest action
            this.startRestAction();
        }
    }
    
    /**
     * Apply costs to character resources
     * @param {Object} costs - Costs to apply
     */
    applyCosts(costs) {
        if (!costs) return;
        
        // Apply stat costs
        for (const statId in costs.stats) {
            const amount = costs.stats[statId];
            if (amount > 0) {
                // Emit resource cost event
                this.eventController.emit('resource:cost', {
                    type: 'stat',
                    id: statId,
                    amount: amount
                });
            }
        }
        
        // Apply currency costs
        for (const currencyId in costs.currencies) {
            const amount = costs.currencies[currencyId];
            if (amount > 0) {
                // Emit resource cost event
                this.eventController.emit('resource:cost', {
                    type: 'currency',
                    id: currencyId,
                    amount: amount
                });
            }
        }
    }
    
    /**
     * Apply rewards to character
     * @param {Object} rewards - Rewards to apply
     */
    applyRewards(rewards) {
        if (!rewards) return;
        
        // Apply stat rewards
        for (const statId in rewards.stats) {
            const amount = rewards.stats[statId];
            if (amount > 0) {
                // Emit resource reward event
                this.eventController.emit('resource:reward', {
                    type: 'stat',
                    id: statId,
                    amount: amount
                });
            }
        }
        
        // Apply currency rewards
        for (const currencyId in rewards.currencies) {
            const amount = rewards.currencies[currencyId];
            if (amount > 0) {
                // Emit resource reward event
                this.eventController.emit('resource:reward', {
                    type: 'currency',
                    id: currencyId,
                    amount: amount
                });
            }
        }
        
        // Apply skill experience
        for (const skillId in rewards.skillExp) {
            const amount = rewards.skillExp[skillId];
            if (amount > 0) {
                // Emit skill exp reward event
                this.eventController.emit('skill:exp-gained', {
                    id: skillId,
                    amount: amount
                });
            }
        }
        
        // Apply random rewards
        if (rewards.random && rewards.random.length > 0) {
            rewards.random.forEach(randomReward => {
                // Apply currency rewards
                if (randomReward.currencies) {
                    for (const currencyId in randomReward.currencies) {
                        const amount = randomReward.currencies[currencyId];
                        if (amount > 0) {
                            // Emit resource reward event
                            this.eventController.emit('resource:reward', {
                                type: 'currency',
                                id: currencyId,
                                amount: amount,
                                message: randomReward.message
                            });
                        }
                    }
                }
                
                // Apply stat rewards
                if (randomReward.stats) {
                    for (const statId in randomReward.stats) {
                        const amount = randomReward.stats[statId];
                        if (amount > 0) {
                            // Emit resource reward event
                            this.eventController.emit('resource:reward', {
                                type: 'stat',
                                id: statId,
                                amount: amount,
                                message: randomReward.message
                            });
                        }
                    }
                }
                
                // Apply unlocks
                if (randomReward.unlocks) {
                    for (const unlockId in randomReward.unlocks) {
                        // Emit unlock event
                        this.eventController.emit('action:unlocked', {
                            id: unlockId,                            
                            message: randomReward.message
                        });
                        
                        // Unlock the action if it exists
                        if (this.actions[unlockId]) {
                            this.actions[unlockId].unlocked = true;
                            this.updateCharacterActionData(this.actions[unlockId]);
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Update action data in character object
     * @param {Action} action - Action to update
     */
    updateCharacterActionData(action) {
        const character = this.gameState.getActiveCharacter();
        if (!character) return;
        
        character.actions = character.actions || {};
        character.actions[action.id] = action.serialize();
    }

    /**
     * Add a modifier to an action
     * @param {Object} data - Modifier data from event
     * @returns {boolean} - Whether the modifier was successfully added
     */
    addModifier(data) {
        // Check if we have required data
        if (!data.actionId || !data.id || !data.type || data.value === undefined) {
            console.warn('Missing required data for action modifier:', data);
            return false;
        }
        
        // Get the action by ID
        const action = this.actions[data.actionId];
        if (!action) {
            console.warn(`Action ${data.actionId} not found for adding modifier`);
            return false;
        }
        
        try {
            // Set default values for optional parameters
            const source = data.source || 'System';
            const isMultiplier = data.isMultiplier !== undefined ? data.isMultiplier : true;
            const duration = data.duration || Infinity; // Default to permanent
            
            // Add the modifier to the action
            action.addModifier(
                data.id,
                data.type,
                data.value,
                source,
                isMultiplier,
                duration
            );
            
            // Update action in character data
            this.updateCharacterActionData(action);
            
            // Log message if provided
            if (data.message) {
                this.eventController.emit('log:entry-added', {
                    message: data.message,
                    important: true,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Emit modifier added event
            this.eventController.emit('action:modifier-added', {
                actionId: data.actionId,
                modifierId: data.id,
                type: data.type,
                value: data.value,
                source: source
            });
            
            return true;
        } catch (error) {
            console.error(`Error adding modifier to action ${data.actionId}:`, error);
            return false;
        }
    }
    
    /**
     * Load actions from game state
     */
    loadActionsFromGameState() {
        const character = this.gameState.getActiveCharacter();
        if (!character || !character.actions) return;
        
        // Clear existing actions
        this.actions = {};
        
        // Load each action from character data
        for (const actionId in character.actions) {
            const actionData = character.actions[actionId];
            
            // Skip if no data
            if (!actionData) continue;
            
            // Create action object based on type
            if (actionId === 'beg') {
                this.createAction('beg', 'Beg', 'Beg for coins in the street.', {
                    baseDuration: 4000,
                    statCosts: {
                        'stamina': 0.5
                    },
                    currencyRewards: {
                        'gold': 5
                    },
                    skillExperience: {
                        'survival': 100
                    },
                    randomRewards: [
                        {
                            chance: 10,
                            reward: {
                                currencies: { 'gold': 4 }
                            },
                            message: 'A kind noble gives you extra coins!'
                        }
                    ]
                });
            } else if (actionId === 'rest_abandoned') {
                this.createAction('rest_abandoned', 'Rest in Abandoned Building', 'Find shelter and rest in an abandoned building.', {
                    baseDuration: 5000,
                    isRestAction: true,
                    autoRestart: false,
                    progressRewards: {
                        "20": {
                            stats: {
                                'health': 0.5,
                                'stamina': 1
                            }
                        },
                        "40": {
                            stats: {
                                'health': 0.5,
                                'stamina': 1
                            }
                        },
                        "60": {
                            stats: {
                                'health': 0.5,
                                'stamina': 1
                            }
                        },
                        "80": {
                            stats: {
                                'health': 0.5,
                                'stamina': 1
                            }
                        },
                        "99": {
                            stats: {
                                'health': 0.5,
                                'stamina': 1
                            }
                        }
                    },
                });
                
                // Set as rest action
                this.restAction = this.actions['rest_abandoned'];
            }
            // Add more action types as needed
            
            // Deserialize saved data into the action
            if (this.actions[actionId]) {
                this.actions[actionId].deserialize(actionData);
                
                // Restore active action if one was active
                if (actionData.isActive) {
                    this.activeAction = this.actions[actionId];
                }
            }
        }
        
        // Notify UI of all actions
        for (const actionId in this.actions) {
            const action = this.actions[actionId];
            this.eventController.emit('action:created', {
                id: action.id,
                name: action.name,
                description: action.description,
                isRestAction: action.isRestAction,
                unlocked: action.unlocked
            });
        }
        
        // Notify UI of active action if one exists
        if (this.activeAction) {
            this.eventController.emit('action:started', {
                id: this.activeAction.id,
                name: this.activeAction.name,
                message: `Resuming ${this.activeAction.name}`
            });
        }

        for (const actionId in this.actions) {
            const action = this.actions[actionId];
            this.eventController.emit('action:data-ready', {
                id: action.id,
                name: action.name,
                description: action.description,
                statCosts: action.statCosts,
                currencyCosts: action.currencyCosts,
                statRewards: action.statRewards, 
                currencyRewards: action.currencyRewards,
                skillExperience: action.skillExperience,
                randomRewards: action.randomRewards,
                progressRewards: action.progressRewards, // Include progress rewards
                isRestAction: action.isRestAction,
                unlocked: action.unlocked,
                completionCount: action.completionCount,
                progress: action.currentProgress
            });
        }
    }
    
    /**
     * Get all available actions
     * @returns {Object} Dictionary of available actions
     */
    getAvailableActions() {
        const availableActions = {};
        
        for (const actionId in this.actions) {
            const action = this.actions[actionId];
            if (action.unlocked) {
                availableActions[actionId] = action;
            }
        }
        
        return availableActions;
    }
    
    /**
     * Check if an action is unlocked
     * @param {string} actionId - ID of the action to check
     * @returns {boolean} Whether the action is unlocked
     */
    isActionUnlocked(actionId) {
        return this.actions[actionId]?.unlocked || false;
    }
    
    /**
     * Unlock an action
     * @param {string} actionId - ID of the action to unlock
     * @returns {boolean} Whether the action was successfully unlocked
     */
    unlockAction(actionId) {
        const action = this.actions[actionId];
        if (!action || action.unlocked) {
            console.log(`Action ${actionId} is already unlocked or doesn't exist`);
            return false;
        }
        
        console.log(`Unlocking action: ${actionId} (${action.name})`);
        action.unlocked = true;
        this.updateCharacterActionData(action);
        
        // Emit action unlocked event with all required data
        this.eventController.emit('action:unlocked', {
            id: actionId,
            name: action.name,
            description: action.description,
            unlocked: true,
            isRestAction: action.isRestAction || false
        });
        
        console.log(`Emitted action:unlocked event for ${actionId}`);
        return true;
    }
    
    /**
     * Get cooldown information for an action
     * @param {string} actionId - ID of the action to check
     * @returns {Object|null} Cooldown info or null if no cooldown
     */
    getActionCooldown(actionId) {
        const action = this.actions[actionId];
        if (!action) {
            return null;
        }
        
        const now = Date.now();
        
        if (action.cooldownEndTime > now) {
            return {
                id: action.id,
                remaining: action.cooldownEndTime - now,
                total: action.cooldown
            };
        }
        
        return null;
    }
    
    /**
     * Get the active action
     * @returns {Action|null} The currently active action or null if none
     */
    getActiveAction() {
        return this.activeAction;
    }
    
    /**
     * Check if any active actions require resting
     * @returns {boolean} Whether rest is needed
     */
    checkNeedRest() {
        if (!this.activeAction || this.activeAction.isRestAction) {
            return false;
        }
        
        const character = this.gameState.getActiveCharacter();
        if (!character) {
            return false;
        }
        
        // Check if any required stat is below threshold
        for (const statId in this.activeAction.statCosts) {
            const costRate = this.activeAction.statCosts[statId];
            if (costRate > 0) {
                const currentValue = character.stats?.[statId]?.current || 0;
                
                // If stat is less than what would be required for 1 second
                if (currentValue < costRate) {
                    return true;
                }
            }
        }
        
        return false;
    }
}