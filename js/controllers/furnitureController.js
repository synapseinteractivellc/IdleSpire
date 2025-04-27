// ./js/controllers/furnitureController.js
// The controller interface for furniture

class FurnitureController {
    /**
     * Create a new FurnitureController
     * @param {EventController} eventController - The event controller for pub/sub
     * @param {GameState} gameState - The game state management object
     */
    constructor(eventController, gameState) {
        this.eventController = eventController;
        this.gameState = gameState;
        
        // Collection of available furniture
        this.furniture = {};
        this.placedFurniture = {};
        
        // Subscribe to events
        this.subscribeToEvents();
    }
    
    /**
     * Initialize the furniture controller
     */
    init() {
        console.log('Initializing FurnitureController...');
    }
    
    /**
     * Subscribe to game events
     */
    subscribeToEvents() {
        // Listen for character creation to initialize furniture
        this.eventController.on('character:needFurniture', () => {
            this.setupInitialFurniture();
        });
        
        // Listen for furniture purchase attempts
        this.eventController.on('furniture:purchase', (data) => {
            this.purchaseFurniture(data.furnitureId);
        });
        
        // Listen for furniture placement attempts
        this.eventController.on('furniture:place', (data) => {
            this.placeFurniture(data.furnitureId, data.homeId);
        });
        
        // Listen for furniture removal attempts
        this.eventController.on('furniture:remove', (data) => {
            this.removeFurniture(data.furnitureId, data.homeId);
        });
        
        // Listen for home transitions to manage furniture effects
        this.eventController.on('home:transitioned', (data) => {
            this.handleHomeTransition(data.homeId);
        });
        
        // Listen for save loaded
        this.eventController.on('save:loaded', () => {
            this.loadFurnitureFromGameState();
        });
    }
    
    /**
     * Setup initial furniture for a new character
     */
    setupInitialFurniture() {
        // Clear existing furniture
        this.furniture = {};
        
        // Create basic furniture
        this.createBasicFurniture();
    }
    
    /**
     * Create basic furniture items
     */
    createBasicFurniture() {
        // Create a simple bed
        const bed = this.createFurniture('simple_bed', 'Simple Bed', 'A basic bed for sleeping. Improves stamina regeneration.', {
            type: 'bed',
            size: 2,
            compatibility: ['abandoned', 'rented', 'owned', 'manor', 'estate', 'palace'],
            unlocked: true,
            costs: {
                'gold': 20
            },
            effects: {
                statRegens: {
                    'stamina': 0.05
                }
            }
        });
        
        // Create a storage chest
        const chest = this.createFurniture('wooden_chest', 'Wooden Chest', 'A basic chest for storing items. Increases gold capacity.', {
            type: 'storage',
            size: 1,
            compatibility: ['abandoned', 'rented', 'owned', 'manor', 'estate', 'palace'],
            unlocked: true,
            costs: {
                'gold': 15
            },
            effects: {
                statBoosts: {
                    'gold': 20 // Increases gold capacity
                }
            }
        });
        
        // Create a crafting table
        const craftTable = this.createFurniture('crafting_table', 'Crafting Table', 'A simple table for crafting. Required for certain skills.', {
            type: 'crafting',
            size: 2,
            compatibility: ['abandoned', 'rented', 'owned', 'manor', 'estate', 'palace'],
            unlocked: false,
            requirements: {
                skills: {
                    'survival': 2
                }
            },
            costs: {
                'gold': 25
            },
            effects: {
                skillBonuses: {
                    'crafting': 1.1 // 10% boost to crafting skill XP gain
                }
            }
        });
        
        // Create a meditation altar
        const meditationMat = this.createFurniture('meditation_mat', 'Meditation Mat', 'A simple mat for meditation. Increases focus regeneration.', {
            type: 'meditation',
            size: 1,
            compatibility: ['abandoned', 'rented', 'owned', 'manor', 'estate', 'palace'],
            unlocked: false,
            requirements: {
                skills: {
                    'survival': 3
                }
            },
            costs: {
                'gold': 30
            },
            effects: {
                statRegens: {
                    'stamina': 0.02
                }
            }
        });
    }
    
    /**
     * Create a new furniture item
     * @param {string} id - Unique identifier for the furniture
     * @param {string} name - Display name for the furniture
     * @param {string} description - Description of the furniture
     * @param {Object} options - Additional options for the furniture
     * @returns {Furniture} The created furniture
     */
    createFurniture(id, name, description, options = {}) {
        // Prevent duplicate furniture
        if (this.furniture[id]) {
            console.warn(`Furniture with id ${id} already exists`);
            return this.furniture[id];
        }
        
        // Create the furniture
        const furniture = new Furniture(id, name, description, options);
        
        // Add to furniture collection
        this.furniture[id] = furniture;
        
        // Emit furniture added event
        this.eventController.emit('furniture:added', {
            id: furniture.id,
            name: furniture.name,
            description: furniture.description,
            type: furniture.type,
            size: furniture.size,
            costs: furniture.costs,
            unlocked: furniture.unlocked
        });
        
        return furniture;
    }
    
    /**
     * Purchase furniture
     * @param {string} furnitureId - ID of the furniture to purchase
     * @returns {boolean} Whether the purchase was successful
     */
    purchaseFurniture(furnitureId) {
        const furniture = this.furniture[furnitureId];
        if (!furniture) {
            console.warn(`Furniture with id ${furnitureId} not found`);
            return false;
        }
        
        const character = this.gameState.getActiveCharacter();
        if (!character) {
            console.warn('No active character found');
            return false;
        }
        
        // Check if we can afford the furniture
        const unlockCheck = furniture.checkUnlockRequirements(character);
        if (!unlockCheck.success) {
            // Emit event with requirement details
            this.eventController.emit('furniture:purchase-failed', {
                furnitureId: furnitureId,
                missingRequirements: unlockCheck.missingRequirements
            });
            return false;
        }
        
        // Apply costs
        for (const [currencyId, cost] of Object.entries(furniture.costs)) {
            // Emit resource cost event
            this.eventController.emit('resource:cost', {
                type: 'currency',
                id: currencyId,
                amount: cost
            });
        }
        
        // Add to character's inventory
        if (!character.inventory) {
            character.inventory = {};
        }
        
        if (!character.inventory.furniture) {
            character.inventory.furniture = {};
        }
        
        character.inventory.furniture[furnitureId] = {
            id: furnitureId,
            purchased: true,
            placed: false,
            homeId: null
        };
        
        // Emit purchase successful event
        this.eventController.emit('furniture:purchased', {
            furnitureId: furnitureId,
            furnitureName: furniture.name,
            message: `Purchased ${furniture.name}!`
        });
        
        return true;
    }
    
    /**
     * Place furniture in a home
     * @param {string} furnitureId - ID of the furniture to place
     * @param {string} homeId - ID of the home to place the furniture in
     * @returns {boolean} Whether the placement was successful
     */
    placeFurniture(furnitureId, homeId) {
        const furniture = this.furniture[furnitureId];
        if (!furniture) {
            console.warn(`Furniture with id ${furnitureId} not found`);
            return false;
        }
        
        const character = this.gameState.getActiveCharacter();
        if (!character) {
            console.warn('No active character found');
            return false;
        }
        
        // Check if character owns the furniture
        if (!character.inventory?.furniture?.[furnitureId]?.purchased) {
            this.eventController.emit('furniture:placement-failed', {
                furnitureId: furnitureId,
                reason: 'not_owned',
                message: `You don't own ${furniture.name}.`
            });
            return false;
        }
        
        // Get the home
        const homeController = window.game.homeController;
        const home = homeController.getHome(homeId);
        
        if (!home) {
            console.warn(`Home with id ${homeId} not found`);
            return false;
        }
        
        // Check compatibility with home
        if (!furniture.isCompatibleWithHome(home)) {
            this.eventController.emit('furniture:placement-failed', {
                furnitureId: furnitureId,
                homeId: homeId,
                reason: 'incompatible',
                message: `${furniture.name} cannot be placed in ${home.name}.`
            });
            return false;
        }
        
        // Check if there's enough space
        if (furniture.size > home.getRemainingFloorSpace()) {
            this.eventController.emit('furniture:placement-failed', {
                furnitureId: furnitureId,
                homeId: homeId,
                reason: 'no_space',
                message: `Not enough space in ${home.name} for ${furniture.name}.`
            });
            return false;
        }
        
        // Add furniture to home
        home.addFurniture(furniture);
        
        // Update character inventory
        character.inventory.furniture[furnitureId].placed = true;
        character.inventory.furniture[furnitureId].homeId = homeId;
        
        // Track placed furniture
        if (!this.placedFurniture[homeId]) {
            this.placedFurniture[homeId] = {};
        }
        
        this.placedFurniture[homeId][furnitureId] = furniture;
        
        // Apply effects if this is the current home
        if (character.home?.id === homeId) {
            this.applyFurnitureEffects(furniture, character);
        }
        
        // Emit placement successful event
        this.eventController.emit('furniture:placed', {
            furnitureId: furnitureId,
            furnitureName: furniture.name,
            homeId: homeId,
            homeName: home.name,
            message: `Placed ${furniture.name} in ${home.name}.`
        });
        
        return true;
    }
    
    /**
     * Remove furniture from a home
     * @param {string} furnitureId - ID of the furniture to remove
     * @param {string} homeId - ID of the home to remove the furniture from
     * @returns {boolean} Whether the removal was successful
     */
    removeFurniture(furnitureId, homeId) {
        const furniture = this.furniture[furnitureId];
        if (!furniture) {
            console.warn(`Furniture with id ${furnitureId} not found`);
            return false;
        }
        
        const character = this.gameState.getActiveCharacter();
        if (!character) {
            console.warn('No active character found');
            return false;
        }
        
        // Get the home
        const homeController = window.game.homeController;
        const home = homeController.getHome(homeId);
        
        if (!home) {
            console.warn(`Home with id ${homeId} not found`);
            return false;
        }
        
        // Check if the furniture is actually in this home
        if (!character.inventory?.furniture?.[furnitureId]?.placed ||
            character.inventory.furniture[furnitureId].homeId !== homeId) {
            this.eventController.emit('furniture:removal-failed', {
                furnitureId: furnitureId,
                homeId: homeId,
                reason: 'not_placed',
                message: `${furniture.name} is not placed in ${home.name}.`
            });
            return false;
        }
        
        // Remove effects if this is the current home
        if (character.home?.id === homeId) {
            this.removeFurnitureEffects(furniture, character);
        }
        
        // Remove from home
        const removedFurniture = home.removeFurniture(furnitureId);
        if (!removedFurniture) {
            console.warn(`Failed to remove furniture ${furnitureId} from home ${homeId}`);
            return false;
        }
        
        // Update character inventory
        character.inventory.furniture[furnitureId].placed = false;
        character.inventory.furniture[furnitureId].homeId = null;
        
        // Remove from tracking
        if (this.placedFurniture[homeId] && this.placedFurniture[homeId][furnitureId]) {
            delete this.placedFurniture[homeId][furnitureId];
        }
        
        // Emit removal successful event
        this.eventController.emit('furniture:removed', {
            furnitureId: furnitureId,
            furnitureName: furniture.name,
            homeId: homeId,
            homeName: home.name,
            message: `Removed ${furniture.name} from ${home.name}.`
        });
        
        return true;
    }
    
    /**
     * Apply furniture effects to a character
     * @param {Furniture} furniture - The furniture to apply effects from
     * @param {Object} character - The character to apply effects to
     */
    applyFurnitureEffects(furniture, character) {
        // Apply stat boosts
        if (furniture.effects.statBoosts) {
            for (const [statId, amount] of Object.entries(furniture.effects.statBoosts)) {
                this.eventController.emit('resource:upgrade', {
                    resource: 'resource',
                    type: 'max',
                    id: statId,
                    amount: amount,
                    message: `${furniture.name} increases ${statId} capacity.`
                });
            }
        }
        
        // Apply stat regeneration boosts
        if (furniture.effects.statRegens) {
            for (const [statId, amount] of Object.entries(furniture.effects.statRegens)) {
                this.eventController.emit('resource:upgrade', {
                    resource: 'resource',
                    type: 'regen',
                    id: statId,
                    amount: amount,
                    message: `${furniture.name} increases ${statId} regeneration.`
                });
            }
        }
        
        // Apply skill bonuses
        if (furniture.effects.skillBonuses) {
            for (const [skillId, multiplier] of Object.entries(furniture.effects.skillBonuses)) {
                // Emit skill bonus event
                this.eventController.emit('skill:add-modifier', {
                    skillId: skillId,
                    modifierId: `furniture_${furniture.id}`,
                    value: multiplier,
                    source: furniture.name,
                    message: `${furniture.name} provides a bonus to ${skillId}.`
                });
            }
        }
        
        // Apply action bonuses
        if (furniture.effects.actionBonuses) {
            for (const [actionId, multiplier] of Object.entries(furniture.effects.actionBonuses)) {
                // Emit action modifier event
                this.eventController.emit('action:add-modifier', {
                    actionId: actionId,
                    id: `furniture_${furniture.id}`,
                    type: 'duration',
                    value: multiplier,
                    source: furniture.name,
                    isMultiplier: true,
                    message: `${furniture.name} improves ${actionId} efficiency.`
                });
            }
        }
    }
    
    /**
     * Remove furniture effects from a character
     * @param {Furniture} furniture - The furniture to remove effects from
     * @param {Object} character - The character to remove effects from
     */
    removeFurnitureEffects(furniture, character) {
        // Remove stat boosts - this would require a new event type to handle
        if (furniture.effects.statBoosts) {
            for (const [statId, amount] of Object.entries(furniture.effects.statBoosts)) {
                this.eventController.emit('resource:downgrade', {
                    resource: 'resource',
                    type: 'max',
                    id: statId,
                    amount: amount,
                    message: `Lost bonus from ${furniture.name}.`
                });
            }
        }
        
        // Remove stat regeneration boosts
        if (furniture.effects.statRegens) {
            for (const [statId, amount] of Object.entries(furniture.effects.statRegens)) {
                this.eventController.emit('resource:downgrade', {
                    resource: 'resource',
                    type: 'regen',
                    id: statId,
                    amount: amount,
                    message: `Lost regeneration bonus from ${furniture.name}.`
                });
            }
        }
        
        // Remove skill bonuses
        if (furniture.effects.skillBonuses) {
            for (const skillId in furniture.effects.skillBonuses) {
                // Emit skill remove modifier event
                this.eventController.emit('skill:remove-modifier', {
                    skillId: skillId,
                    modifierId: `furniture_${furniture.id}`
                });
            }
        }
        
        // Remove action bonuses
        if (furniture.effects.actionBonuses) {
            for (const actionId in furniture.effects.actionBonuses) {
                // Emit action remove modifier event
                this.eventController.emit('action:remove-modifier', {
                    actionId: actionId,
                    id: `furniture_${furniture.id}`
                });
            }
        }
    }
    
    /**
     * Handle home transition
     * @param {string} newHomeId - ID of the new home
     */
    handleHomeTransition(newHomeId) {
        const character = this.gameState.getActiveCharacter();
        if (!character || !character.inventory || !character.inventory.furniture) {
            return;
        }
        
        // Get the previous home ID
        const prevHomeId = character.home?.id;
        if (prevHomeId === newHomeId) {
            return; // No change
        }
        
        // Remove effects from furniture in the previous home
        if (prevHomeId && this.placedFurniture[prevHomeId]) {
            for (const furnitureId in this.placedFurniture[prevHomeId]) {
                const furniture = this.placedFurniture[prevHomeId][furnitureId];
                this.removeFurnitureEffects(furniture, character);
            }
        }
        
        // Apply effects from furniture in the new home
        if (newHomeId && this.placedFurniture[newHomeId]) {
            for (const furnitureId in this.placedFurniture[newHomeId]) {
                const furniture = this.placedFurniture[newHomeId][furnitureId];
                this.applyFurnitureEffects(furniture, character);
            }
        }

        this.eventController.emit('ui:updateFurnitureDisplay', { homeId: newHomeId });
    }
    
    /**
     * Get available furniture for a character
     * @returns {Object} Dictionary of available furniture
     */
    getAvailableFurniture() {
        const character = this.gameState.getActiveCharacter();
        if (!character || !character.inventory || !character.inventory.furniture) {
            return {};
        }
        
        const availableFurniture = {};
        
        // Add all furniture that the character has purchased but not placed
        for (const furnitureId in character.inventory.furniture) {
            const furnitureData = character.inventory.furniture[furnitureId];
            
            if (furnitureData.purchased && !furnitureData.placed) {
                availableFurniture[furnitureId] = this.furniture[furnitureId];
            }
        }
        
        return availableFurniture;
    }
    
    /**
     * Get furniture placed in a specific home
     * @param {string} homeId - ID of the home to check
     * @returns {Object} Dictionary of placed furniture
     */
    getPlacedFurnitureInHome(homeId) {
        return this.placedFurniture[homeId] || {};
    }
    
    /**
     * Load furniture data from the game state
     */
    loadFurnitureFromGameState() {
        const character = this.gameState.getActiveCharacter();
        if (!character || !character.inventory || !character.inventory.furniture) {
            return;
        }
        
        // First, set up basic furniture
        this.setupInitialFurniture();
        
        // Reset tracking
        this.placedFurniture = {};
        
        // Process placed furniture from character data
        for (const furnitureId in character.inventory.furniture) {
            const furnitureData = character.inventory.furniture[furnitureId];
            
            if (furnitureData.placed && furnitureData.homeId) {
                const homeId = furnitureData.homeId;
                
                // Track placed furniture
                if (!this.placedFurniture[homeId]) {
                    this.placedFurniture[homeId] = {};
                }
                
                this.placedFurniture[homeId][furnitureId] = this.furniture[furnitureId];
                
                // Apply effects if this is the current home
                if (character.home?.id === homeId) {
                    this.applyFurnitureEffects(this.furniture[furnitureId], character);
                }
            }
        }
        
        // Emit furniture loaded event
        this.eventController.emit('furniture:loaded', {
            message: 'Furniture loaded from save.'
        });
    }
}