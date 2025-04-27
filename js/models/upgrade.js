// ./js/models/upgrade.js
// The model for an upgrade object in the game

class Upgrade extends Action {
    /**
     * Create a new upgrade
     * @param {string} id - Unique identifier for the upgrade
     * @param {string} name - Display name for the upgrade
     * @param {string} description - Description of the upgrade
     * @param {Object} options - Additional options for the upgrade
     */
    constructor(id, name, description, options = {}) {
        // Set default options specific to upgrades
        options.type = 'upgrade';
        options.baseDuration = options.baseDuration || 1; // Instant by default
        options.autoRestart = false; // Upgrades don't auto-restart by default
        
        // Call parent constructor
        super(id, name, description, options);
        
        // Upgrade-specific properties
        this.upgradeTarget = options.upgradeTarget || null; // What this upgrade affects (stat, currency, action, etc.)
        this.upgradeTargetId = options.upgradeTargetId || null; // Specific ID of what this upgrade affects
        this.upgradeType = options.upgradeType || null; // Type of upgrade effect (max, regen, efficiency, etc.)
        this.upgradeValue = options.upgradeValue || 0; // Value of the upgrade effect
        this.tier = options.tier || 1; // Upgrade tier for sequential upgrades
        this.category = options.category || 'general'; // Category for grouping upgrades
    }

    /**
     * Apply the upgrade effect
     * @param {object} gameState - The current game state
     * @returns {boolean} - Whether the effect was successfully applied
     */
    applyEffect(gameState) {
        if (!this.upgradeTarget || !this.upgradeType || !this.upgradeTargetId) {
            console.warn(`Upgrade ${this.id} has no target, type, or targetId defined`);
            return false;
        }

        // Default implementation - specific effects would be handled by the controller
        return true;
    }

    /**
     * Check if the character meets requirements to see/purchase this upgrade
     * @param {Object} character - Character to check against
     * @returns {Object} Result with success flag and reason if failed
     */
    checkVisibilityRequirements(character) {
        const result = {
            success: true,
            missingRequirements: []
        };
        
        // Check required currency minimums (for visibility, not cost)
        for (const currencyId in this.requiredCurrency) {
            const requiredAmount = this.requiredCurrency[currencyId];
            const available = character.currencies?.[currencyId]?.current || 0;
            
            if (available < requiredAmount) {
                result.success = false;
                result.missingRequirements.push({
                    type: 'currency',
                    id: currencyId,
                    required: requiredAmount,
                    current: available
                });
            }
        }

        for (const statId in this.requiredStats) {
            const requiredAmount = this.requiredStats[statId];
            const available = character.stat?.[statId]?.current || 0;
            
            if (available < requiredAmount) {
                result.success = false;
                result.missingRequirements.push({
                    type: 'stat',
                    id: statId,
                    required: requiredAmount,
                    current: available
                });
            }
        }

        
        // Check required upgrades
        for (const upgradeId in this.requiredUpgrades) {
            const requiredCount = this.requiredUpgrades[upgradeId];
            const completions = character.actions?.[upgradeId]?.completionCount || 0;
            
            if (completions < requiredCount) {
                result.success = false;
                result.missingRequirements.push({
                    type: 'upgrade',
                    id: upgradeId,
                    required: requiredCount,
                    current: completions
                });
            }
        }

        // Also check the base requirements (class, skills, actions)
        const baseRequirements = super.checkUnlockRequirements(character);
        if (!baseRequirements.success) {
            result.success = false;
            result.missingRequirements = result.missingRequirements.concat(baseRequirements.missingRequirements);
        }
        
        return result;
    }

    /**
     * Serialize the upgrade for saving
     * @returns {Object} Serialized upgrade data
     */
    serialize() {
        // Get the base serialized data from Action class
        const baseData = super.serialize();
        
        // Add upgrade-specific properties
        return {
            ...baseData,
            type: 'upgrade',  // Ensure type is preserved
            upgradeTarget: this.upgradeTarget,
            upgradeTargetId: this.upgradeTargetId,
            upgradeType: this.upgradeType,
            upgradeValue: this.upgradeValue,
            tier: this.tier,
            category: this.category
        };
    }

    /**
     * Deserialize saved data into this upgrade
     * @param {Object} data - Saved upgrade data
     */
    deserialize(data) {
        // First apply the base action properties
        super.deserialize(data);
        
        // Then apply upgrade-specific properties
        this.upgradeTarget = data.upgradeTarget !== undefined ? data.upgradeTarget : this.upgradeTarget;
        this.upgradeTargetId = data.upgradeTargetId !== undefined ? data.upgradeTargetId : this.upgradeTargetId;
        this.upgradeType = data.upgradeType !== undefined ? data.upgradeType : this.upgradeType;
        this.upgradeValue = data.upgradeValue !== undefined ? data.upgradeValue : this.upgradeValue;
        this.tier = data.tier !== undefined ? data.tier : this.tier;
        this.category = data.category !== undefined ? data.category : this.category;
        
        // Ensure type is correctly set
        this.type = 'upgrade';
    }
}