// ./js/models/skill.js
// The model for a skill object in the game

class Skill {
    /**
     * Create a new skill
     * @param {string} id - Unique identifier for the skill
     * @param {string} name - Display name for the skill
     * @param {string} description - Description of the skill
     * @param {Object} options - Additional options
     * @param {string} options.category - Skill category (Physical, Magic, Knowledge, Crafting)
     * @param {number} options.maxLevel - Maximum level this skill can reach
     * @param {number} options.currentLevel - Current level of the skill
     * @param {number} options.xp - Current experience points
     * @param {number} options.xpToNextLevel - XP required for next level
     * @param {number} options.priority - Priority for ordering within category
     * @param {boolean} options.unlocked - Whether this skill is unlocked
     */
    constructor(id, name, description, options = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.category = options.category || 'Physical';
        this.maxLevel = options.maxLevel || 5;
        this.currentLevel = options.currentLevel || 0;
        this.xp = options.xp || 0;
        this.xpToNextLevel = options.xpToNextLevel || 100;
        this.priority = options.priority || 0;
        this.unlocked = options.unlocked !== undefined ? options.unlocked : false;
        this.visible = options.visible !== undefined ? options.visible : this.unlocked;
        
        // Track total XP earned for this skill
        this.totalXpGained = this.xp;
        
        // Bonuses provided by this skill at different levels
        this.bonuses = options.bonuses || [];
    }

    /**
     * Add experience points to the skill
     * @param {number} amount - Amount of XP to add
     * @returns {boolean} - Whether leveling up occurred
     */
    addXP(amount) {
        if (amount <= 0) return false;
        if (this.currentLevel >= this.maxLevel) return false;

        this.xp += amount;
        this.totalXpGained += amount;
        
        return this.checkLevelUp();
    }

    /**
     * Check if skill can level up with current XP
     * @returns {boolean} - Whether leveling up occurred
     */
    checkLevelUp() {
        if (this.currentLevel >= this.maxLevel) return false;
        
        let leveledUp = false;
        
        // Keep leveling up while we have enough XP
        while (this.xp >= this.xpToNextLevel && this.currentLevel < this.maxLevel) {
            this.xp -= this.xpToNextLevel;
            this.currentLevel++;
            leveledUp = true;
            
            // Calculate new XP required for next level (increases with each level)
            this.calculateXpToNextLevel();
        }
        
        return leveledUp;
    }

    /**
     * Calculate XP required for next level
     * Uses an exponential formula that increases XP requirements at higher levels
     */
    calculateXpToNextLevel() {
        // Base formula: 100 * (level ^ 1.5)
        // Level 1: 100, Level 2: 283, Level 5: 1118, Level 10: 3162, Level 20: 8944
        this.xpToNextLevel = Math.floor(100 * Math.pow(this.currentLevel + 1, 1.5));
    }

    /**
     * Get the percentage progress to next level
     * @returns {number} - Percentage between 0-100
     */
    getLevelProgress() {
        if (this.currentLevel >= this.maxLevel) return 0;
        return (this.xp / this.xpToNextLevel) * 100;
    }

    /**
     * Get active bonuses for the current level
     * @returns {Array} - List of active bonuses
     */
    getActiveBonuses() {
        return this.bonuses.filter(bonus => this.currentLevel >= bonus.level);
    }

    /**
     * Serialize the skill for saving
     * @returns {Object} - Serialized skill data
     */
    serialize() {
        return {
            id: this.id,
            currentLevel: this.currentLevel,
            xp: this.xp,
            xpToNextLevel: this.xpToNextLevel,
            unlocked: this.unlocked,
            visible: this.visible,
            totalXpGained: this.totalXpGained
        };
    }

    /**
     * Deserialize saved data into this skill
     * @param {Object} data - Saved skill data
     */
    deserialize(data) {
        this.currentLevel = data.currentLevel !== undefined ? data.currentLevel : this.currentLevel;
        this.xp = data.xp !== undefined ? data.xp : this.xp;
        this.xpToNextLevel = data.xpToNextLevel !== undefined ? data.xpToNextLevel : this.xpToNextLevel;
        this.unlocked = data.unlocked !== undefined ? data.unlocked : this.unlocked;
        this.visible = data.visible !== undefined ? data.visible : this.visible;
        this.totalXpGained = data.totalXpGained !== undefined ? data.totalXpGained : this.totalXpGained;
    }
}