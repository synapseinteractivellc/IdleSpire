// ./js/models/currency.js
// The model for a currency object in the game

class Currency extends Resource {
    /**
     * Create a new currency
     * @param {string} id - Unique identifier for the currency
     * @param {string} name - Display name for the currency
     * @param {string} description - Description of the currency
     * @param {number} initialValue - Starting value of the currency
     * @param {number} maxValue - Maximum value of the currency
     * @param {number} gainRate - Rate of gain per second
     * @param {Object} options - Additional options
     * @param {string} options.type - Currency type (gold, gems, etc.)
     * @param {boolean} options.isPremium - Whether this is a premium currency
     */
    constructor(id, name, description, initialValue = 0, maxValue = 100, gainRate = 0, options = {}) {
        // Set options.type to ensure the Currency has the right type property
        options.type = options.type || id; // Default to ID if not specified
        
        super(id, name, description, initialValue, maxValue, gainRate, options);
        
        // Currency-specific properties
        this.isPremium = options.isPremium || false;
        this.lifetimeEarned = initialValue;
        this.lifetimeSpent = 0;
    }

    /**
     * Earn currency and track lifetime stats
     * @param {number} amount - Amount to earn
     * @param {boolean} respectMax - Whether to respect the maximum value
     * @returns {number} - Amount actually earned
     */
    earn(amount, respectMax = true) {
        if (amount <= 0) {
            return 0;
        }

        const amountAdded = this.add(amount, respectMax);
        this.lifetimeEarned += amountAdded;
        return amountAdded;
    }

    /**
     * Spend currency and track lifetime stats
     * @param {number} amount - Amount to spend
     * @returns {boolean} - Whether the spending was successful
     */
    spend(amount) {
        if (amount <= 0) {
            return false;
        }

        if (this.current < amount) {
            return false;
        }

        this.subtract(amount);
        this.lifetimeSpent += amount;
        return true;
    }

    /**
     * Serialize the currency for saving
     * @returns {Object} Serialized currency data
     */
    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            isPremium: this.isPremium,
            lifetimeEarned: this.lifetimeEarned,
            lifetimeSpent: this.lifetimeSpent
        };
    }

    /**
     * Deserialize saved data into this currency
     * @param {Object} data - Saved currency data
     */
    deserialize(data) {
        super.deserialize(data);
        
        this.isPremium = data.isPremium !== undefined ? data.isPremium : this.isPremium;
        this.lifetimeEarned = data.lifetimeEarned !== undefined ? data.lifetimeEarned : this.lifetimeEarned;
        this.lifetimeSpent = data.lifetimeSpent !== undefined ? data.lifetimeSpent : 0;
    }
}