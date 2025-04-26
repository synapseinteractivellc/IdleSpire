// ./js/models/home.js
// The model for a home object in the game

class Home {
    /**
     * Create a new home
     * @param {string} id - Unique identifier for the home
     * @param {string} name - Display name for the home
     * @param {string} description - Description of the home
     * @param {Object} options - Additional home configuration
     */
    constructor(id, name, description, options = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        
        // Home type and progression
        this.type = options.type || 'street';
        this.level = options.level || 0;
        
        // Space management
        this.maxFloorSpace = options.maxFloorSpace || 0;
        this.usedFloorSpace = options.usedFloorSpace || 0;
        
        // Unlocking and requirements
        this.unlocked = options.unlocked || false;
        this.requirements = options.requirements || {
            skills: {},       // { 'skillId': requiredLevel }
            classes: [],       // Allowed character classes
            upgrades: {},      // { 'upgradeId': requiredCompletions }
            currency: {}       // { 'currencyId': requiredAmount }
        };
        
        // Home effects - bonuses while living here
        this.effects = options.effects || {
            statRegens: {},    // { 'statId': regenBonus }
            skillBonuses: {},  // { 'skillId': { actionId: xpBonus } }
            actionModifiers: {} // { 'actionId': { type: 'duration', value: 0.8 } }
        };
        
        // Furniture currently in the home
        this.furniture = options.furniture || [];
    }
    
    /**
     * Check if the home meets all unlock requirements
     * @param {Object} character - The character attempting to unlock the home
     * @returns {Object} Requirement check result
     */
    checkUnlockRequirements(character) {
        const result = {
            success: true,
            missingRequirements: []
        };
        
        // Check skill requirements
        if (this.requirements.skills && Object.keys(this.requirements.skills).length > 0) {
            for (const [skillId, requiredLevel] of Object.entries(this.requirements.skills)) {
                const currentLevel = character.skills?.[skillId]?.currentLevel || 0;
                if (currentLevel < requiredLevel) {
                    result.success = false;
                    result.missingRequirements.push({
                        type: 'skill',
                        id: skillId,
                        required: requiredLevel,
                        current: currentLevel
                    });
                }
            }
        }
        
        // Check class requirements
        if (this.requirements.classes && this.requirements.classes.length > 0 && 
            !this.requirements.classes.includes(character.class)) {
            result.success = false;
            result.missingRequirements.push({
                type: 'class',
                required: this.requirements.classes,
                current: character.class
            });
        }
        
        // Check upgrade requirements
        if (this.requirements.upgrades && Object.keys(this.requirements.upgrades).length > 0) {
            for (const [upgradeId, requiredCompletions] of Object.entries(this.requirements.upgrades)) {
                const currentCompletions = character.actions?.[upgradeId]?.completionCount || 0;
                if (currentCompletions < requiredCompletions) {
                    result.success = false;
                    result.missingRequirements.push({
                        type: 'upgrade',
                        id: upgradeId,
                        required: requiredCompletions,
                        current: currentCompletions
                    });
                }
            }
        }
        
        // Check currency requirements
        if (this.requirements.currency && Object.keys(this.requirements.currency).length > 0) {
            for (const [currencyId, requiredAmount] of Object.entries(this.requirements.currency)) {
                const currentAmount = character.currencies?.[currencyId]?.current || 0;
                if (currentAmount < requiredAmount) {
                    result.success = false;
                    result.missingRequirements.push({
                        type: 'currency',
                        id: currencyId,
                        required: requiredAmount,
                        current: currentAmount
                    });
                }
            }
        }
        
        // Check stat requirements
        if (this.requirements.stats && Object.keys(this.requirements.stats).length > 0) {
            for (const [statId, requiredAmount] of Object.entries(this.requirements.stats)) {
                const currentAmount = character.stats?.[statId]?.current || 0;
                if (currentAmount < requiredAmount) {
                    result.success = false;
                    result.missingRequirements.push({
                        type: 'stat',
                        id: statId,
                        required: requiredAmount,
                        current: currentAmount
                    });
                }
            }
        }
        
        return result;
    }
    
    /**
     * Calculate remaining floor space
     * @returns {number} Remaining floor space
     */
    getRemainingFloorSpace() {
        return this.maxFloorSpace - this.usedFloorSpace;
    }
    
    /**
     * Check compatibility of current furniture when switching homes
     * @param {Home} newHome - The home being switched to
     * @returns {Object} Compatibility check result
     */
    checkFurnitureCompatibility(newHome) {
        const incompatibleFurniture = this.furniture.filter(item => 
            // Check if furniture exceeds new home's floor space
            item.size > newHome.maxFloorSpace ||
            // Check if furniture is not compatible with new home type
            (item.compatibility && !item.compatibility.includes(newHome.type))
        );
        
        return {
            compatible: incompatibleFurniture.length === 0,
            incompatibleItems: incompatibleFurniture
        };
    }
    
    /**
     * Add a piece of furniture to the home
     * @param {Furniture} furniture - Furniture to add
     * @returns {boolean} Whether furniture was successfully added
     */
    addFurniture(furniture) {
        // Check if there's enough floor space
        if (furniture.size > this.getRemainingFloorSpace()) {
            return false;
        }
        
        this.furniture.push(furniture);
        this.usedFloorSpace += furniture.size;
        return true;
    }
    
    /**
     * Remove a piece of furniture
     * @param {string} furnitureId - ID of furniture to remove
     * @returns {Furniture|null} Removed furniture or null if not found
     */
    removeFurniture(furnitureId) {
        const index = this.furniture.findIndex(f => f.id === furnitureId);
        if (index === -1) return null;
        
        const [removedFurniture] = this.furniture.splice(index, 1);
        this.usedFloorSpace -= removedFurniture.size;
        return removedFurniture;
    }
    
    /**
     * Serialize the home for saving
     * @returns {Object} Serialized home data
     */
    serialize() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            type: this.type,
            level: this.level,
            maxFloorSpace: this.maxFloorSpace,
            usedFloorSpace: this.usedFloorSpace,
            unlocked: this.unlocked,
            requirements: this.requirements,
            effects: this.effects,
            furniture: this.furniture.map(f => f.serialize())
        };
    }
    
    /**
     * Deserialize saved data into this home
     * @param {Object} data - Saved home data
     */
    deserialize(data) {
        Object.assign(this, {
            id: data.id,
            name: data.name,
            description: data.description,
            type: data.type || 'street',
            level: data.level || 0,
            maxFloorSpace: data.maxFloorSpace || 10,
            usedFloorSpace: data.usedFloorSpace || 0,
            unlocked: data.unlocked || false,
            requirements: data.requirements || {},
            effects: data.effects || {},
            furniture: (data.furniture || []).map(furnitureData => {
                // TODO: Create Furniture from serialized data when Furniture class is implemented
                return furnitureData;
            })
        });
    }
}