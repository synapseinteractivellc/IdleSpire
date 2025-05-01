// ./js/models/action.js
// The model for an action in the game

class Action {
    /**
     * Create a new action
     * @param {string} id - Unique identifier for the action
     * @param {string} name - Display name for the action
     * @param {string} description - Description of the action
     * @param {Object} options - Additional options for the action
     */
    constructor(id, name, description, options = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        
        // Add action type - 'action' or 'upgrade'
        this.type = options.type || 'action';
        
        // Timing properties
        this.baseDuration = options.baseDuration || (this.type === 'upgrade' ? 1 : 5000); // Instant for upgrades by default
        this.currentProgress = options.currentProgress || 0; // 0-100 percentage
        this.lastUpdateTime = null; // Last time this action was updated
        this.isActive = false; // Whether this action is currently running
        this.completionCount = options.completionCount || 0;
        this.totalTimeSpent = options.totalTimeSpent || 0;
        
        // Action flags
        this.isRestAction = options.isRestAction || false;
        this.autoRestart = options.autoRestart !== undefined ? options.autoRestart : true;
        this.unlocked = options.unlocked !== undefined ? options.unlocked : false;
        this.cooldown = options.cooldown || 0; // Cooldown time in milliseconds
        this.cooldownEndTime = 0; // When cooldown ends (timestamp)
        this.maxCompletions = options.maxCompletions || Infinity; // Maximum allowed completions
        
        // Requirements and effects
        this.statCosts = options.statCosts || {}; // e.g., { stamina: 1 } for 1 stamina per second
        this.currencyCosts = options.currencyCosts || {}; // e.g., { gold: 5 } for 5 gold per second
        this.statRewards = options.statRewards || {}; // e.g., { health: 2 } for 2 health gained at completion
        this.currencyRewards = options.currencyRewards || {}; // e.g., { wood: 1 } for 1 wood gained
        this.progressRewards = options.progressRewards || {}; // Rewards given based on progress intervals
        this.skillExperience = options.skillExperience || {}; // Skill XP gained on completion
        
        // Unlocking requirements
        // Add this to the Action class constructor
        this.requirements = options.requirements || null;
        this.requiredClass = options.requiredClass || null;
        this.requiredSkills = options.requiredSkills || {}; // e.g., { woodcutting: 5 } for level 5 woodcutting
        this.requiredActions = options.requiredActions || {}; // e.g., { chopWood: 10 } for 10 completions
        this.requiredStats = options.requiredStats || {}; // e.g. { health: 20 } for health of 20
        this.requiredCurrency = options.requiredCurrency || {}; // e.g., { gold: 10 } for min 10 gold requirement
        this.requiredUpgrades = options.requiredUpgrades || {}; // e.g., { coinPurse: 1 } for requiring coin purse upgrade
        
        // Action modifiers
        this.modifiers = [];
        
        // Completion messages
        this.messages = options.messages || {
            start: `Started ${name}`,
            progress: `Continuing ${name}`,
            complete: `Completed ${name}`,
            cancel: `Cancelled ${name}`,
            fail: `Failed to complete ${name}`
        };
        
        // Random reward config
        this.randomRewards = options.randomRewards || []; // Array of {chance, reward, message} objects
        
        // For upgrades - what this upgrade affects
        this.upgradeTarget = options.upgradeTarget || null; // What resource/stat/action this upgrade affects
        this.upgradeEffect = options.upgradeEffect || {}; // The specific effect (e.g., { maxIncrease: 10 })
    }
    
    /**
     * Start the action
     * @returns {boolean} Whether the action was successfully started
     */
    start() {
        if (this.isActive || !this.canStart()) {
            return false;
        }
        
        this.isActive = true;
        this.lastUpdateTime = Date.now();
        return true;
    }
    
    /**
     * Stop the action
     * @param {boolean} completed - Whether the action was completed
     * @returns {Object} Information about the stopped action
     */
    stop(completed = false) {
        if (!this.isActive) {
            // Return a minimal result object instead of null
            return {
                id: this.id,
                completed: false,
                progress: this.currentProgress,
                message: this.messages.cancel
            };
        }
        
        const now = Date.now();
        const timeSpent = now - this.lastUpdateTime;
        this.totalTimeSpent += timeSpent;
        
        // If completed, apply completion effects
        if (completed) {
            this.completionCount++;
            
            // Apply cooldown if needed
            if (this.cooldown > 0) {
                this.cooldownEndTime = now + this.cooldown;
            }
        }
        
        const result = {
            id: this.id,
            completed: completed,
            timeSpent: timeSpent,
            progress: this.currentProgress,
            totalTimeSpent: this.totalTimeSpent,
            completionCount: this.completionCount,
            rewards: completed ? this.calculateRewards() : null,
            message: completed ? this.messages.complete : this.messages.cancel
        };
        
        this.isActive = false;
        
        return result;
    }
    
    /**
     * Update the action progress
     * @param {number} deltaTime - Time in milliseconds since last update
     * @param {Object} character - Character object with current resources
     * @returns {Object} Update result with progress changes and rewards
     */
    update(deltaTime, character) {
        if (!this.isActive) {
            return null;
        }
        
        const now = Date.now();
        
        // Apply time since last update
        if (!this.lastUpdateTime) {
            this.lastUpdateTime = now;
            return null;
        }
        
        // Calculate actual time to use for progress
        const timeDiff = now - this.lastUpdateTime;
        this.lastUpdateTime = now;
        
        // Check if character has enough resources to continue
        const costCheck = this.checkCosts(character, timeDiff);
        if (!costCheck.canContinue) {
            // Not enough resources to continue
            const result = this.stop(false);
            result.message = this.messages.fail;
            result.insufficientResources = costCheck.insufficientResources;
            return result;
        }
        
        // Calculate costs to apply (but don't apply them directly)
        const costs = this.calculateCosts(character, timeDiff);
        
        // Calculate modified duration (considering modifiers)
        const modifiedDuration = this.getModifiedDuration();
        
        // Calculate progress increment
        const progressIncrement = (timeDiff / modifiedDuration) * 100;
        const oldProgress = this.currentProgress;
        this.currentProgress = Math.min(100, this.currentProgress + progressIncrement);
        
        // Check for progress rewards
        const progressRewards = this.checkProgressRewards(oldProgress, this.currentProgress);
        
        // Check for completion
        let completed = false;
        let completionRewards = null;
        
        if (this.currentProgress >= 100) {
            // Action complete
            completed = true;
            completionRewards = this.calculateRewards();
            
            // Reset progress
            this.currentProgress = 0;
            
            // Special logic for rest actions - check if stats are full
            if (this.isRestAction) {
                // Check if health and stamina are at max or close to max (95%+)
                const healthFull = !character.stats.health || 
                    character.stats.health.current >= character.stats.health.max * 0.95;
                const staminaFull = !character.stats.stamina || 
                    character.stats.stamina.current >= character.stats.stamina.max * 0.95;
                
                // If both stats are full or nearly full, complete the rest action
                if (healthFull && staminaFull) {
                    this.completionCount++;
                    this.isActive = false;
                } else {
                    // Otherwise, keep resting
                    this.completionCount++;
                    this.isActive = true;
                }
            } else {
                // For non-rest actions, use standard auto-restart logic
                if (this.autoRestart && this.canStart() && this.completionCount < this.maxCompletions) {
                    this.completionCount++;
                    this.isActive = true;
                } else {
                    // Otherwise stop the action
                    this.stop(true);
                }
            }
        }
        
        // Return update information
        return {
            id: this.id,
            name: this.name,
            progress: this.currentProgress,
            progressChange: this.currentProgress - oldProgress,
            completed: completed,
            completionCount: this.completionCount,
            costs: costs,
            rewards: completed ? completionRewards : progressRewards,
            message: completed ? this.messages.complete : this.messages.progress
        };
    }
    
    /**
     * Check if the action can be started
     * @returns {boolean} Whether the action can be started
     */
    canStart() {
        // Check unlocked
        if (!this.unlocked) {
            return false;
        }
        
        // Check cooldown
        if (this.cooldownEndTime > Date.now()) {
            return false;
        }
        
        // Check max completions
        if (this.completionCount >= this.maxCompletions) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Calculate rewards for action completion
     * @returns {Object} Calculated rewards
     */
    calculateRewards() {
        // Start with base rewards
        const rewards = {
            stats: {...this.statRewards},
            currencies: {...this.currencyRewards},
            skillExp: {...this.skillExperience}
        };
        
        // Apply modifiers to rewards
        this.applyRewardModifiers(rewards);
        
        // Check for random rewards
        if (this.randomRewards.length > 0) {
            rewards.random = this.calculateRandomRewards();
        }
        
        return rewards;
    }
    
    /**
     * Calculate random rewards based on chance
     * @returns {Array} Array of random rewards that were triggered
     */
    calculateRandomRewards() {
        const triggeredRewards = [];
        
        this.randomRewards.forEach(rewardDef => {
            const roll = Math.random() * 100;
            if (roll <= rewardDef.chance) {
                triggeredRewards.push({
                    ...rewardDef.reward,
                    message: rewardDef.message
                });
            }
        });
        
        return triggeredRewards;
    }
    
    /**
     * Check if the character has enough resources to continue the action
     * @param {Object} character - Character object with current resources
     * @param {number} deltaTime - Time in milliseconds since last update
     * @returns {Object} Result of cost check
     */
    checkCosts(character, deltaTime) {
        const result = {
            canContinue: true,
            insufficientResources: []
        };
        
        // Calculate cost per millisecond
        const timeInSeconds = deltaTime / 1000;
        
        // Check stat costs
        for (const statId in this.statCosts) {
            const costRate = this.statCosts[statId];
            const totalCost = costRate * timeInSeconds;
            
            // Get current stat value
            const currentValue = character.stats?.[statId]?.current || 0;
            
            if (currentValue < totalCost) {
                result.canContinue = false;
                result.insufficientResources.push({
                    type: 'stat',
                    id: statId,
                    required: totalCost,
                    current: currentValue
                });
            }
        }
        
        // Check currency costs
        for (const currencyId in this.currencyCosts) {
            const costRate = this.currencyCosts[currencyId];
            const totalCost = costRate * timeInSeconds;
            
            // Get current currency value
            const currentValue = character.currencies?.[currencyId]?.current || 0;
            
            if (currentValue < totalCost) {
                result.canContinue = false;
                result.insufficientResources.push({
                    type: 'currency',
                    id: currencyId,
                    required: totalCost,
                    current: currentValue
                });
            }
        }
        
        return result;
    }
    
    /**
     * Calculate costs to apply to character resources
     * @param {Object} character - Character object with resources
     * @param {number} deltaTime - Time in milliseconds since last update
     * @returns {Object} Costs to apply
     */
    calculateCosts(character, deltaTime) {
        // Calculate cost per millisecond
        const timeInSeconds = deltaTime / 1000;
        
        const costs = {
            stats: {},
            currencies: {}
        };
        
        // Calculate stat costs
        for (const statId in this.statCosts) {
            const costRate = this.statCosts[statId];
            const totalCost = costRate * timeInSeconds;
            
            // Only include costs for stats the character has
            if (character.stats && character.stats[statId]) {
                costs.stats[statId] = totalCost;
            }
        }
        
        // Calculate currency costs
        for (const currencyId in this.currencyCosts) {
            const costRate = this.currencyCosts[currencyId];
            const totalCost = costRate * timeInSeconds;
            
            // Only include costs for currencies the character has
            if (character.currencies && character.currencies[currencyId]) {
                costs.currencies[currencyId] = totalCost;
            }
        }
        
        return costs;
    }
    
    /**
     * Check for rewards that should be given based on progress
     * @param {number} oldProgress - Previous progress percentage
     * @param {number} newProgress - New progress percentage
     * @returns {Object|null} Progress rewards to apply or null if none
     */
    checkProgressRewards(oldProgress, newProgress) {
        if (Object.keys(this.progressRewards).length === 0) {
            return null;
        }
        
        const rewards = {
            stats: {},
            currencies: {},
            skillExp: {}
        };
        
        let rewardsGiven = false;
        
        // Check if we've crossed any progress thresholds
        for (const threshold in this.progressRewards) {
            const thresholdValue = parseFloat(threshold);
            // If we've crossed this threshold in this update
            if (oldProgress < thresholdValue && newProgress >= thresholdValue) {
                const thresholdRewards = this.progressRewards[threshold];
                
                // Add stats from this threshold
                if (thresholdRewards.stats) {
                    for (const statId in thresholdRewards.stats) {
                        rewards.stats[statId] = (rewards.stats[statId] || 0) + thresholdRewards.stats[statId];
                        rewardsGiven = true;
                    }
                }
                
                // Add currencies from this threshold
                if (thresholdRewards.currencies) {
                    for (const currencyId in thresholdRewards.currencies) {
                        rewards.currencies[currencyId] = (rewards.currencies[currencyId] || 0) + thresholdRewards.currencies[currencyId];
                        rewardsGiven = true;
                    }
                }
                
                // Add skill experience from this threshold
                if (thresholdRewards.skillExp) {
                    for (const skillId in thresholdRewards.skillExp) {
                        rewards.skillExp[skillId] = (rewards.skillExp[skillId] || 0) + thresholdRewards.skillExp[skillId];
                        rewardsGiven = true;
                    }
                }
            }
        }
        
        return rewardsGiven ? rewards : null;
    }
    
    /**
     * Add a modifier to this action
     * @param {string} id - Unique identifier for the modifier
     * @param {string} type - Type of modifier (duration, cost, reward)
     * @param {number} value - Value of the modifier (multiplier or flat)
     * @param {string} source - Source of the modifier
     * @param {boolean} isMultiplier - Whether this is a multiplier (true) or flat modifier (false)
     * @param {number} duration - Duration in milliseconds (Infinity for permanent)
     */
    addModifier(id, type, value, source, isMultiplier = true, duration = Infinity) {
        // Remove any existing modifier with the same id
        this.modifiers = this.modifiers.filter(mod => mod.id !== id);
        
        // Add the new modifier
        this.modifiers.push({
            id: id,
            type: type,
            value: value,
            source: source,
            isMultiplier: isMultiplier,
            expiresAt: duration === Infinity ? Infinity : Date.now() + duration,
            addedAt: Date.now()
        });
    }
    
    /**
     * Remove a modifier by id
     * @param {string} id - ID of the modifier to remove
     * @returns {boolean} Whether the modifier was found and removed
     */
    removeModifier(id) {
        const initialLength = this.modifiers.length;
        this.modifiers = this.modifiers.filter(mod => mod.id !== id);
        return this.modifiers.length < initialLength;
    }
    
    /**
     * Clean up expired modifiers
     * @private
     */
    _cleanupModifiers() {
        const now = Date.now();
        this.modifiers = this.modifiers.filter(mod => mod.expiresAt === Infinity || mod.expiresAt > now);
    }
    
    /**
     * Get the modified duration including all duration modifiers
     * @returns {number} The modified duration in milliseconds
     */
    getModifiedDuration() {
        this._cleanupModifiers();
        
        let duration = this.baseDuration;
        let multiplier = 1.0;
        let flatReduction = 0;
        
        // Apply relevant modifiers
        this.modifiers.forEach(mod => {
            if (mod.type === 'duration') {
                if (mod.isMultiplier) {
                    multiplier *= mod.value;
                } else {
                    flatReduction += mod.value;
                }
            }
        });
        
        // Apply flat reduction first, then multiplier
        duration = Math.max(1, duration - flatReduction);
        duration *= multiplier;
        
        return Math.max(1, duration); // Ensure at least 1ms duration
    }
    
    /**
     * Apply reward modifiers to a set of rewards
     * @param {Object} rewards - Rewards object to modify
     * @private
     */
    applyRewardModifiers(rewards) {
        this._cleanupModifiers();
        
        // Get all reward modifiers
        const rewardModifiers = this.modifiers.filter(mod => mod.type === 'reward');
        
        if (rewardModifiers.length === 0) {
            return;
        }
        
        // Apply to stats
        for (const statId in rewards.stats) {
            let value = rewards.stats[statId];
            let multiplier = 1.0;
            let flatBonus = 0;
            
            rewardModifiers.forEach(mod => {
                // Apply general stat modifiers
                if (mod.target === 'all_stats' || mod.target === statId) {
                    if (mod.isMultiplier) {
                        multiplier *= mod.value;
                    } else {
                        flatBonus += mod.value;
                    }
                }
            });
            
            // Apply modifiers to value
            value = (value + flatBonus) * multiplier;
            rewards.stats[statId] = value;
        }
        
        // Apply to currencies
        for (const currencyId in rewards.currencies) {
            let value = rewards.currencies[currencyId];
            let multiplier = 1.0;
            let flatBonus = 0;
            
            rewardModifiers.forEach(mod => {
                // Apply general currency modifiers
                if (mod.target === 'all_currencies' || mod.target === currencyId) {
                    if (mod.isMultiplier) {
                        multiplier *= mod.value;
                    } else {
                        flatBonus += mod.value;
                    }
                }
            });
            
            // Apply modifiers to value
            value = (value + flatBonus) * multiplier;
            rewards.currencies[currencyId] = value;
        }
        
        // Apply to skill experience
        for (const skillId in rewards.skillExp) {
            let value = rewards.skillExp[skillId];
            let multiplier = 1.0;
            let flatBonus = 0;
            
            rewardModifiers.forEach(mod => {
                // Apply general skill exp modifiers
                if (mod.target === 'all_skills' || mod.target === skillId) {
                    if (mod.isMultiplier) {
                        multiplier *= mod.value;
                    } else {
                        flatBonus += mod.value;
                    }
                }
            });
            
            // Apply modifiers to value
            value = (value + flatBonus) * multiplier;
            rewards.skillExp[skillId] = value;
        }
    }
    
    /**
     * Check if the character meets the requirements to unlock this action
     * @param {Object} character - Character to check against
     * @returns {Object} Result with success flag and reason if failed
     */
    checkUnlockRequirements(character) {
        const result = {
            success: true,
            missingRequirements: []
        };
        
        // Check class requirement
        if (this.requiredClass && character.class !== this.requiredClass) {
            result.success = false;
            result.missingRequirements.push({
                type: 'class',
                required: this.requiredClass,
                current: character.class
            });
        }
        
        // Check skill requirements
        for (const skillId in this.requiredSkills) {
            const requiredLevel = this.requiredSkills[skillId];
            const currentLevel = character.skills?.[skillId]?.level || 0;
            
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
        
        // Check action completion requirements
        for (const actionId in this.requiredActions) {
            const requiredCompletions = this.requiredActions[actionId];
            const currentCompletions = character.actions?.[actionId]?.completionCount || 0;
            
            if (currentCompletions < requiredCompletions) {
                result.success = false;
                result.missingRequirements.push({
                    type: 'action',
                    id: actionId,
                    required: requiredCompletions,
                    current: currentCompletions
                });
            }
        }
        
        return result;
    }
    
    /**
     * Serialize the action for saving
     * @returns {Object} Serialized action data
     */
    serialize() {
        return {
            id: this.id,
            currentProgress: this.currentProgress,
            completionCount: this.completionCount,
            totalTimeSpent: this.totalTimeSpent,
            unlocked: this.unlocked,
            cooldownEndTime: this.cooldownEndTime,
            modifiers: this.modifiers.map(mod => ({...mod})),
            isActive: this.isActive,
            lastUpdateTime: this.lastUpdateTime
        };
    }
    
    /**
     * Deserialize saved data into this action
     * @param {Object} data - Saved action data
     */
    deserialize(data) {
        this.currentProgress = data.currentProgress !== undefined ? data.currentProgress : 0;
        this.completionCount = data.completionCount !== undefined ? data.completionCount : 0;
        this.totalTimeSpent = data.totalTimeSpent !== undefined ? data.totalTimeSpent : 0;
        this.unlocked = data.unlocked !== undefined ? data.unlocked : false;
        this.cooldownEndTime = data.cooldownEndTime !== undefined ? data.cooldownEndTime : 0;
        this.isActive = data.isActive !== undefined ? data.isActive : false;
        this.lastUpdateTime = data.lastUpdateTime !== undefined ? data.lastUpdateTime : null;
        
        this.modifiers = [];
        if (data.modifiers && Array.isArray(data.modifiers)) {
            this.modifiers = data.modifiers.map(mod => ({...mod}));
        }
    }
}