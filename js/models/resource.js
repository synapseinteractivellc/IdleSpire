// ./js/models/resource.js
// The model for a resource object in the game

class Resource {
    /**
     * Create a new resource
     * @param {string} id - Unique identifier for the resource
     * @param {string} name - Display name for the resource
     * @param {string} description - Description of the resource
     * @param {number} initialValue - Starting value of the resource
     * @param {number} maxValue - Maximum value of the resource
     * @param {number} gainRate - Rate of gain per second
     * @param {Object} options - Additional options
     */
    constructor(id, name, description, initialValue = 0, maxValue = 100, gainRate = 0, options = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.current = initialValue;
        this.max = maxValue;
        this.gainRate = gainRate;
        this.unlocked = options.unlocked || initialValue > 0;
        this.visible = options.visible || initialValue > 0;
        this.type = options.type || "basic";
        this.color = options.color || "#FFFFFF";
        this.priority = options.priority || 0;
        this.modifiers = [];
        this.lastUpdated = Date.now();
        this.lifetimeGained = initialValue;
    }

    /**
     * Add a modifier to the resource
     * @param {string} id - Unique identifier for the modifier
     * @param {string} type - Type of modifier (skill, item, upgrade, etc.)
     * @param {number} value - Modifier value (1.0 = no change for multipliers)
     * @param {string} source - Source of the modifier
     * @param {number} duration - Duration in ms (Infinity for permanent)
     * @param {string} operation - How to apply the modifier (add, multiply)
     */
    addModifier(id, type, value, source, duration = Infinity, operation = "multiply") {
        // Remove any existing modifier with the same ID
        this.removeModifier(id);
        
        const modifier = {
            id: id,
            type: type,
            value: value,
            source: source,
            operation: operation,
            expiresAt: duration === Infinity ? Infinity : Date.now() + duration,
            addedAt: Date.now()
        };
        
        this.modifiers.push(modifier);
    }

    /**
     * Remove a modifier by ID
     * @param {string} id - ID of the modifier to remove
     * @returns {boolean} Whether the modifier was removed
     */
    removeModifier(id) {
        const initialLength = this.modifiers.length;
        this.modifiers = this.modifiers.filter(m => m.id !== id);
        return this.modifiers.length < initialLength;
    }

    /**
     * Clean up expired modifiers
     * @private
     */
    _cleanupModifiers() {
        const now = Date.now();
        this.modifiers = this.modifiers.filter(m => m.expiresAt === Infinity || m.expiresAt > now);
    }

    /**
     * Calculate the effective gain rate with all modifiers applied
     * @returns {number} The effective gain rate
     */
    getEffectiveGainRate() {
        // Clean up expired modifiers
        this._cleanupModifiers();
        
        let baseValue = this.gainRate;
        let flatBonus = 0;
        let multiplier = 1.0;
        
        // Apply modifiers based on their operation type
        for (const mod of this.modifiers) {
            if (mod.operation === "add") {
                flatBonus += mod.value;
            } else if (mod.operation === "multiply") {
                multiplier *= mod.value;
            }
        }
        
        return (baseValue + flatBonus) * multiplier;
    }

    /**
     * Add a value to the resource
     * @param {number} amount - Amount to add
     * @param {boolean} respectMax - Whether to respect the maximum value
     * @returns {number} The amount actually added
     */
    add(amount, respectMax = true) {
        if (amount <= 0) return 0;
        
        const oldValue = this.current;
        
        if (respectMax) {
            this.current = Math.min(this.current + amount, this.max);
        } else {
            this.current += amount;
        }
        
        // Track lifetime gains
        this.lifetimeGained += (this.current - oldValue);
        
        // Mark resource as unlocked when gained
        if (!this.unlocked && this.current > 0) {
            this.unlocked = true;
            if (!this.visible) {
                this.visible = true;
            }
        }
        
        return this.current - oldValue;
    }

    /**
     * Subtract a value from the resource
     * @param {number} amount - Amount to subtract
     * @param {boolean} allowNegative - Whether to allow values below zero
     * @returns {boolean} Whether the subtraction was successful
     */
    subtract(amount, allowNegative = false) {
        if (amount <= 0) return true;
        
        if (!allowNegative && this.current < amount) {
            return false;
        }
        
        this.current -= amount;
        
        if (!allowNegative) {
            this.current = Math.max(0, this.current);
        }
        
        return true;
    }

    /**
     * Check if there is enough of the resource
     * @param {number} amount - Amount to check
     * @returns {boolean} Whether there is enough
     */
    hasEnough(amount) {
        return this.current >= amount;
    }

    /**
     * Set the maximum value of the resource
     * @param {number} newMax - New maximum value
     * @param {boolean} adjustCurrent - Whether to adjust current value proportionally
     */
    setMax(newMax, adjustCurrent = false) {
        if (newMax <= 0) return;
        
        if (adjustCurrent && this.max > 0) {
            // Maintain the same percentage of max
            const ratio = this.current / this.max;
            this.current = ratio * newMax;
        } else if (this.current > newMax) {
            // Cap the current value to the new max
            this.current = newMax;
        }
        
        this.max = newMax;
    }

    /**
     * Increase the maximum value by a certain amount
     * @param {number} amount - Amount to increase the max by
     * @param {boolean} increaseCurrent - Whether to also increase current by same amount
     */
    increaseMax(amount, increaseCurrent = false) {
        if (amount <= 0) return;
        
        this.max += amount;
        
        if (increaseCurrent) {
            this.current += amount;
        }
    }

    /**
     * Set the gain rate of the resource
     * @param {number} newRate - New gain rate per second
     */
    setGainRate(newRate) {
        this.gainRate = newRate;
    }

    /**
     * Add a flat bonus to the gain rate
     * @param {number} amount - Amount to add to gain rate
     */
    addGainRateBonus(amount) {
        this.addModifier(
            `gainrate_bonus_${Date.now()}`,
            "bonus",
            amount,
            "System",
            Infinity,
            "add"
        );
    }

    /**
     * Multiply the gain rate by a factor
     * @param {number} factor - Factor to multiply gain rate by
     * @param {string} source - Source of the multiplier
     * @param {number} duration - Duration in ms (Infinity for permanent)
     * @returns {string} ID of the created modifier
     */
    multiplyGainRate(factor, source = "System", duration = Infinity) {
        const id = `gainrate_multiplier_${Date.now()}`;
        this.addModifier(
            id,
            "multiplier",
            factor,
            source,
            duration,
            "multiply"
        );
        return id;
    }

    /**
     * Set the visibility of the resource
     * @param {boolean} visible - Whether the resource should be visible
     */
    setVisible(visible) {
        this.visible = visible;
    }

    /**
     * Update the resource based on elapsed time
     * @param {number} deltaTime - Elapsed time in milliseconds
     * @returns {number} Amount gained during update
     */
    update(deltaTime) {
        const secondsElapsed = deltaTime / 1000;
        const effectiveGainRate = this.getEffectiveGainRate();
        
        if (effectiveGainRate === 0) {
            this.lastUpdated = Date.now();
            return 0;
        }
        
        const gain = effectiveGainRate * secondsElapsed;
        let amountGained = 0;
        
        if (gain > 0) {
            amountGained = this.add(gain);
        } else {
            this.subtract(-gain);
            amountGained = gain;
        }
        
        this.lastUpdated = Date.now();
        return amountGained;
    }

    /**
     * Get all active modifiers for this resource
     * @returns {Array} Array of active modifiers
     */
    getActiveModifiers() {
        this._cleanupModifiers();
        return [...this.modifiers];
    }

    /**
     * Serialize the resource for saving
     * @returns {Object} Serialized resource data
     */
    serialize() {
        return {
            id: this.id,
            current: this.current,
            max: this.max,
            gainRate: this.gainRate,
            unlocked: this.unlocked,
            visible: this.visible,
            type: this.type,
            color: this.color,
            priority: this.priority,
            modifiers: this.modifiers.map(m => ({...m})),
            lifetimeGained: this.lifetimeGained
        };
    }

    /**
     * Deserialize saved data into this resource
     * @param {Object} data - Saved resource data
     */
    deserialize(data) {
        this.current = data.current !== undefined ? data.current : 0;
        this.max = data.max !== undefined ? data.max : 100;
        this.gainRate = data.gainRate !== undefined ? data.gainRate : 0;
        this.unlocked = data.unlocked !== undefined ? data.unlocked : false;
        this.visible = data.visible !== undefined ? data.visible : false;
        this.type = data.type || this.type;
        this.color = data.color || this.color;
        this.priority = data.priority !== undefined ? data.priority : 0;
        this.lifetimeGained = data.lifetimeGained !== undefined ? data.lifetimeGained : this.current;
        
        this.modifiers = [];
        if (data.modifiers && Array.isArray(data.modifiers)) {
            this.modifiers = data.modifiers.map(m => ({...m}));
        }
    }
}