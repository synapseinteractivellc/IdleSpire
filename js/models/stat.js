// ./js/models/stat.js
// The model for a stat object in the game

class Stat extends Resource {
    /**
     * Create a new stat
     * @param {string} id - Unique identifier for the stat
     * @param {string} name - Display name for the stat
     * @param {string} description - Description of the stat
     * @param {number} initialValue - Starting value of the stat
     * @param {number} maxValue - Maximum value of the stat
     * @param {number} gainRate - Rate of gain per second
     * @param {Object} options - Additional options
     * @param {number} options.baseValue - Base value before modifiers
     * @param {number} options.regenRate - Rate of regeneration (if different from gainRate)
     */
    constructor(id, name, description, initialValue = 0, maxValue = 100, gainRate = 0, options = {}) {
        super(id, name, description, initialValue, maxValue, gainRate, options);
        
        // Stats have specific properties
        this.baseValue = options.baseValue || initialValue;
        this.regenRate = options.regenRate || gainRate;
    }

    /**
     * Set regeneration rate for the stat
     * @param {number} rate - New regeneration rate
     */
    setRegenRate(rate) {
        this.regenRate = rate;
        this.setGainRate(rate); // Update gain rate
    }

    /**
     * Get current percentage of the stat
     * @returns {number} Percentage value (0-100)
     */
    getPercentage() {
        return (this.current / this.max) * 100;
    }

    /**
     * Serialize the stat for saving
     * @returns {Object} Serialized stat data
     */
    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            baseValue: this.baseValue,
            regenRate: this.regenRate
        };
    }

    /**
     * Deserialize saved data into this stat
     * @param {Object} data - Saved stat data
     */
    deserialize(data) {
        super.deserialize(data);
        
        this.baseValue = data.baseValue !== undefined ? data.baseValue : this.baseValue;
        this.regenRate = data.regenRate !== undefined ? data.regenRate : this.regenRate;
    }
}