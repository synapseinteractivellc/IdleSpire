// ./js/models/furniture.js
// The model for a furniture object in the game

class Furniture {
    /**
     * Create a new furniture item
     * @param {string} id - Unique identifier for the furniture
     * @param {string} name - Display name for the furniture
     * @param {string} description - Description of the furniture
     * @param {Object} options - Additional furniture configuration
     */
    constructor(id, name, description, options = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        
        // Furniture type and properties
        this.type = options.type || 'basic';
        this.size = options.size || 1; // Space required in the home
        this.ownedCount = options.ownedCount || 0; // Get how many of a piece of furniture is owned assume 0
        this.maxCount = options.maxCount || Infinity; // Get how many of a piece of furniture can be owned, if no max allow infinite to floorSpace.
        
        // Compatibility with home types
        this.compatibility = options.compatibility || ['abandoned', 'rented', 'owned', 'manor', 'estate', 'palace']; 
        if (!this.compatibility.includes('street')) {
            // Most furniture can't be placed on the street
            this.compatibility = this.compatibility;
        }
        
        // Unlocking and requirements
        this.unlocked = options.unlocked || false;
        this.requirements = options.requirements || {
            skills: {},       // { 'skillId': requiredLevel }
            currency: {},     // { 'currencyId': requiredAmount }
            upgrades: {},     // { 'upgradeId': requiredCompletions }
            homes: []         // Array of home IDs this furniture requires
        };
        
        // Furniture cost to purchase
        this.costs = options.costs || {
            // { 'currencyId': amount }
        };
        
        // Furniture effects when placed in a home
        this.effects = options.effects || {
            statBoosts: {},   // { 'statId': amount }
            statRegens: {},   // { 'statId': amount }
            skillBonuses: {}, // { 'skillId': xpMultiplier }
            actionBonuses: {} // { 'actionId': speedMultiplier }
        };
        
        // Aesthetic properties
        this.quality = options.quality || 1; // 1 = basic, 5 = luxurious
        this.aestheticValue = options.aestheticValue || this.quality; // Contributes to home aesthetic rating
    }
    
    /**
     * Check if the furniture meets all unlock requirements
     * @param {Object} character - The character attempting to unlock the furniture
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
        
        // Check currency requirements to afford
        if (this.costs && Object.keys(this.costs).length > 0) {
            for (const [currencyId, requiredAmount] of Object.entries(this.costs)) {
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
        
        // Check home requirements
        if (this.requirements.homes && this.requirements.homes.length > 0) {
            // Check if the current home is in the required homes list
            if (!this.requirements.homes.includes(character.home?.id)) {
                result.success = false;
                result.missingRequirements.push({
                    type: 'home',
                    required: this.requirements.homes,
                    current: character.home?.id
                });
            }
        }
        
        return result;
    }
    
    /**
     * Check if the furniture is compatible with a specific home
     * @param {Object} home - The home to check compatibility with
     * @returns {boolean} Whether the furniture is compatible
     */
    isCompatibleWithHome(home) {
        // Check home type compatibility
        if (!this.compatibility.includes(home.type)) {
            return false;
        }
        
        // Check if there's enough space
        if (this.size > home.getRemainingFloorSpace()) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Apply the effects of this furniture to a character
     * @param {Object} character - The character to apply effects to
     */
    applyEffects(character) {
        // This would be called when the furniture is active in a home
        // The actual implementation would emit events to the appropriate controllers
    }
    
    /**
     * Remove the effects of this furniture from a character
     * @param {Object} character - The character to remove effects from
     */
    removeEffects(character) {
        // This would be called when the furniture is removed or deactivated
        // The actual implementation would emit events to the appropriate controllers
    }
    
    /**
     * Serialize the furniture for saving
     * @returns {Object} Serialized furniture data
     */
    serialize() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            type: this.type,
            size: this.size,
            ownedCount: this.ownedCount,
            maxCount: this.maxCount,
            compatibility: this.compatibility,
            unlocked: this.unlocked,
            requirements: this.requirements,
            costs: this.costs,
            effects: this.effects,
            quality: this.quality,
            aestheticValue: this.aestheticValue
        };
    }
    
    /**
     * Deserialize saved data into this furniture
     * @param {Object} data - Saved furniture data
     */
    deserialize(data) {
        Object.assign(this, {
            id: data.id,
            name: data.name,
            description: data.description,
            type: data.type || 'basic',
            size: data.size || 1,
            ownedCount: data.ownedCount || 0,
            maxCount: data.maxCount || Infinity,
            compatibility: data.compatibility || ['abandoned', 'rented', 'owned', 'manor', 'estate', 'palace'],
            unlocked: data.unlocked || false,
            requirements: data.requirements || {},
            costs: data.costs || {},
            effects: data.effects || {},
            quality: data.quality || 1,
            aestheticValue: data.aestheticValue || 1
        });
    }
}