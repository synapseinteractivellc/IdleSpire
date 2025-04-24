// ./js/controllers/resourceController.js
// The controller interface for managing resources

class ResourceController {
    /**
     * Create a new resource controller
     * @param {EventController} eventController - The event controller for pub/sub
     * @param {GameState} gameState - The game state
     */
    constructor(eventController, gameState) {
        this.eventController = eventController;
        this.gameState = gameState;
        this.stats = {};
        this.currencies = {};
        
        // Subscribe to events
        this.subscribeToEvents();
    }
    
    /**
     * Initialize the resource controller
     */
    init() {
        console.log('Initializing ResourceController...');
    }
    
    /**
     * Subscribe to game events
     */
    subscribeToEvents() {
        // Listen for character creation to initialize resources
        this.eventController.on('character:created', (data) => {
            this.initializeCharacterResources(data);
        });
    }
    
    /**
     * Initialize resources for a new character
     * @param {Object} characterData - Basic character creation data
     */
    initializeCharacterResources(characterData) {
        const character = this.gameState.getActiveCharacter();
        if (!character) return;
        
        // Create basic stats based on character class
        this.createBasicStats(character, characterData.class);
        
        // Create basic currencies
        this.createBasicCurrencies(character);
        
        // Emit events for UI updates
        this.emitResourceEvents();
    }
    
    /**
     * Create basic stats for a character based on class
     * @param {Object} character - The character object
     */
    createBasicStats(character) {
        // Health stat
        const healthStat = new Stat(
            'health',
            'Health',
            'Your physical well-being. If it reaches zero, you\'ll be incapacitated.',
            10,  
            10,
            0, 
            {
                regenRate: 0.01,
                color: 'hsl(0, 70%, 50%)'
            }
        );
        
        // Stamina stat
        const staminaStat = new Stat(
            'stamina',
            'Stamina',
            'Your physical energy. Used for physical actions and travel.',
            10,
            10,
            0,
            {
                regenRate: 0.05,
                color: 'hsl(145, 60%, 40%)'
            }
        );
        
        // Store stats in controller
        this.stats['health'] = healthStat;
        this.stats['stamina'] = staminaStat;
        
        // Store in character data
        character.stats = {
            health: healthStat.serialize(),
            stamina: staminaStat.serialize()
        };
    }
    
    /**
     * Create basic currencies for a character
     * @param {Object} character - The character object
     */
    createBasicCurrencies(character) {
        // Gold currency
        const goldCurrency = new Currency(
            'gold',
            'Gold',
            'Basic currency used for most transactions.',
            0,  // Initial value
            10, // Max value
            0, // Gain rate
            {
                type: 'gold',
                color: 'hsl(48, 100%, 67%)',
                isPremium: false
            }
        );
        
        // Store currencies in controller
        this.currencies['gold'] = goldCurrency;
        
        // Store in character data
        character.currencies = {
            gold: goldCurrency.serialize()
        };
    }
    
    /**
     * Emit events for UI updates for all resources
     */
    emitResourceEvents() {
        // Emit events for stats
        for (const statId in this.stats) {
            const stat = this.stats[statId];
            this.eventController.emit('stat:added', {
                id: statId,
                name: stat.name,
                type: statId,
                current: stat.current,
                max: stat.max,
                gainRate: stat.gainRate
            });
        }
        
        // Emit events for currencies
        for (const currencyId in this.currencies) {
            const currency = this.currencies[currencyId];
            this.eventController.emit('currency:added', {
                id: currencyId,
                name: currency.name,
                type: currencyId,
                current: currency.current,
                max: currency.max,
                gainRate: currency.gainRate
            });
        }
    }
    
    /**
     * Get a resource by ID
     * @param {string} resourceId - ID of the resource
     * @returns {Resource|null} The resource or null if not found
     */
    getResource(resourceId) {
        return this.stats[resourceId] || this.currencies[resourceId] || null;
    }
    
    /**
     * Add a new stat
     * @param {string} id - Stat ID
     * @param {string} name - Stat name
     * @param {string} description - Stat description
     * @param {Object} options - Stat options
     * @returns {Stat} The created stat
     */
    addStat(id, name, description, options = {}) {
        // Default values more appropriate for game stats
        const initialValue = options.initialValue || 5;
        const maxValue = options.maxValue || 5;
        
        const stat = new Stat(
            id,
            name,
            description,
            initialValue,
            maxValue,
            options.gainRate || 0,
            options
        );
        
        this.stats[id] = stat;
        
        // Add to character if one exists
        const character = this.gameState.getActiveCharacter();
        if (character) {
            character.stats = character.stats || {};
            character.stats[id] = stat.serialize();
        }
        
        // Emit stat added event
        this.eventController.emit('stat:added', {
            id: id,
            name: name,
            type: id,
            current: stat.current,
            max: stat.max,
            gainRate: stat.gainRate
        });
        
        return stat;
    }
    
    /**
     * Add a new currency
     * @param {string} id - Currency ID
     * @param {string} name - Currency name
     * @param {string} description - Currency description
     * @param {Object} options - Currency options
     * @returns {Currency} The created currency
     */
    addCurrency(id, name, description, options = {}) {
        // Default values more appropriate for game currencies
        const initialValue = options.initialValue || 0;
        const maxValue = options.maxValue || 10;
        
        const currency = new Currency(
            id,
            name,
            description,
            initialValue,
            maxValue,
            options.gainRate || 0,
            options
        );
        
        this.currencies[id] = currency;
        
        // Add to character if one exists
        const character = this.gameState.getActiveCharacter();
        if (character) {
            character.currencies = character.currencies || {};
            character.currencies[id] = currency.serialize();
        }
        
        // Emit currency added event
        this.eventController.emit('currency:added', {
            id: id,
            name: name,
            type: options.type || id,
            current: currency.current,
            max: currency.max,
            gainRate: currency.gainRate
        });
        
        return currency;
    }
    
    /**
     * Update a resource value
     * @param {string} resourceId - ID of the resource
     * @param {number} newValue - New value
     * @param {boolean} respectMax - Whether to respect the maximum value
     * @returns {boolean} Whether the update was successful
     */
    updateResourceValue(resourceId, newValue, respectMax = true) {
        const resource = this.getResource(resourceId);
        if (!resource) return false;
        
        const oldValue = resource.current;
        
        if (respectMax) {
            resource.current = Math.min(newValue, resource.max);
        } else {
            resource.current = newValue;
        }
        
        // Update character data
        this.updateCharacterResourceData(resourceId, resource);
        
        // Emit event based on resource type
        if (this.stats[resourceId]) {
            this.eventController.emit('stat:updated', {
                id: resourceId,
                current: resource.current,
                max: resource.max,
                gainRate: resource.gainRate
            });
        } else if (this.currencies[resourceId]) {
            this.eventController.emit('currency:updated', {
                id: resourceId,
                current: resource.current,
                max: resource.max,
                gainRate: resource.gainRate
            });
        }
        
        return true;
    }
    
    /**
     * Add to a resource
     * @param {string} resourceId - ID of the resource
     * @param {number} amount - Amount to add
     * @param {boolean} respectMax - Whether to respect the maximum value
     * @returns {number} Amount actually added
     */
    addToResource(resourceId, amount, respectMax = true) {
        const resource = this.getResource(resourceId);
        if (!resource) return 0;
        
        const amountAdded = resource.add(amount, respectMax);
        
        // Update character data
        this.updateCharacterResourceData(resourceId, resource);
        
        // Emit event based on resource type
        if (this.stats[resourceId]) {
            this.eventController.emit('stat:updated', {
                id: resourceId,
                current: resource.current,
                max: resource.max,
                gainRate: resource.gainRate
            });
        } else if (this.currencies[resourceId]) {
            this.eventController.emit('currency:updated', {
                id: resourceId,
                current: resource.current,
                max: resource.max,
                gainRate: resource.gainRate
            });
        }
        
        return amountAdded;
    }
    
    /**
     * Subtract from a resource
     * @param {string} resourceId - ID of the resource
     * @param {number} amount - Amount to subtract
     * @param {boolean} allowNegative - Whether to allow values below zero
     * @returns {boolean} Whether the subtraction was successful
     */
    subtractFromResource(resourceId, amount, allowNegative = false) {
        const resource = this.getResource(resourceId);
        if (!resource) return false;
        
        if (!resource.hasEnough(amount) && !allowNegative) {
            return false;
        }
        
        const success = resource.subtract(amount, allowNegative);
        
        if (success) {
            // Update character data
            this.updateCharacterResourceData(resourceId, resource);
            
            // Emit event based on resource type
            if (this.stats[resourceId]) {
                this.eventController.emit('stat:updated', {
                    id: resourceId,
                    current: resource.current,
                    max: resource.max,
                    gainRate: resource.gainRate
                });
            } else if (this.currencies[resourceId]) {
                this.eventController.emit('currency:updated', {
                    id: resourceId,
                    current: resource.current,
                    max: resource.max,
                    gainRate: resource.gainRate
                });
            }
        }
        
        return success;
    }
    
    /**
     * Set the maximum value of a resource
     * @param {string} resourceId - ID of the resource
     * @param {number} newMax - New maximum value
     * @param {boolean} adjustCurrent - Whether to adjust current value proportionally
     * @returns {boolean} Whether the update was successful
     */
    setResourceMax(resourceId, newMax, adjustCurrent = false) {
        const resource = this.getResource(resourceId);
        if (!resource) return false;
        
        resource.setMax(newMax, adjustCurrent);
        
        // Update character data
        this.updateCharacterResourceData(resourceId, resource);
        
        // Emit event based on resource type
        if (this.stats[resourceId]) {
            this.eventController.emit('stat:updated', {
                id: resourceId,
                current: resource.current,
                max: resource.max,
                gainRate: resource.gainRate
            });
        } else if (this.currencies[resourceId]) {
            this.eventController.emit('currency:updated', {
                id: resourceId,
                current: resource.current,
                max: resource.max,
                gainRate: resource.gainRate
            });
        }
        
        return true;
    }
    
    /**
     * Set the gain rate of a resource
     * @param {string} resourceId - ID of the resource
     * @param {number} newRate - New gain rate
     * @returns {boolean} Whether the update was successful
     */
    setResourceGainRate(resourceId, newRate) {
        const resource = this.getResource(resourceId);
        if (!resource) return false;
        
        resource.setGainRate(newRate);
        
        // Update character data
        this.updateCharacterResourceData(resourceId, resource);
        
        // Emit event based on resource type
        if (this.stats[resourceId]) {
            this.eventController.emit('stat:updated', {
                id: resourceId,
                current: resource.current,
                max: resource.max,
                gainRate: resource.gainRate
            });
        } else if (this.currencies[resourceId]) {
            this.eventController.emit('currency:updated', {
                id: resourceId,
                current: resource.current,
                max: resource.max,
                gainRate: resource.gainRate
            });
        }
        
        return true;
    }
    
    /**
     * Update a resource in the character's data
     * @private
     * @param {string} resourceId - ID of the resource
     * @param {Resource} resource - Resource object
     */
    updateCharacterResourceData(resourceId, resource) {
        const character = this.gameState.getActiveCharacter();
        if (!character) return;
        
        if (this.stats[resourceId]) {
            character.stats = character.stats || {};
            character.stats[resourceId] = resource.serialize();
        } else if (this.currencies[resourceId]) {
            character.currencies = character.currencies || {};
            character.currencies[resourceId] = resource.serialize();
        }
    }
    
    /**
     * Update all resources based on elapsed time
     * @param {number} deltaTime - Time elapsed in milliseconds
     */
    updateResources(deltaTime) {
        // Update stats
        for (const statId in this.stats) {
            const stat = this.stats[statId];
            const amountGained = stat.update(deltaTime);
            
            if (amountGained !== 0) {
                this.updateCharacterResourceData(statId, stat);
                
                this.eventController.emit('stat:updated', {
                    id: statId,
                    current: stat.current,
                    max: stat.max,
                    gainRate: stat.gainRate
                });
            }
        }
        
        // Update currencies
        for (const currencyId in this.currencies) {
            const currency = this.currencies[currencyId];
            const amountGained = currency.update(deltaTime);
            
            if (amountGained !== 0) {
                this.updateCharacterResourceData(currencyId, currency);
                
                this.eventController.emit('currency:updated', {
                    id: currencyId,
                    current: currency.current,
                    max: currency.max,
                    gainRate: currency.gainRate
                });
            }
        }
    }
    
    /**
     * Load resources from saved game data
     * @param {Object} character - Character object with saved resource data
     */
    loadFromSaveData(character) {
        // Clear existing resources
        this.stats = {};
        this.currencies = {};
        
        // Load stats
        if (character.stats) {
            for (const statId in character.stats) {
                const statData = character.stats[statId];
                const stat = new Stat(
                    statData.id || statId,
                    statData.name || statId,
                    statData.description || '',
                    0, 0, 0, // These will be overridden by deserialize
                    { type: statData.type || statId }
                );
                stat.deserialize(statData);
                this.stats[statId] = stat;
            }
        }
        
        // Load currencies
        if (character.currencies) {
            for (const currencyId in character.currencies) {
                const currencyData = character.currencies[currencyId];
                const currency = new Currency(
                    currencyData.id || currencyId,
                    currencyData.name || currencyId,
                    currencyData.description || '',
                    0, 0, 0, // These will be overridden by deserialize
                    { type: currencyData.type || currencyId }
                );
                currency.deserialize(currencyData);
                this.currencies[currencyId] = currency;
            }
        }
        
        // Emit events for UI
        this.emitResourceEvents();
    }
}