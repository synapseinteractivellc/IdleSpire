// ./js/models/character.js
// The model for a character in the game

class Character {
    /**
     * Create a new character
     * @param {Object} data - Character initialization data
     */
    constructor(data = {}) {
        // Unique identifier
        this.id = data.id || `char_${Date.now()}`;
        
        // Basic character info
        this.name = data.name || 'Unnamed';
        this.class = data.class ? data.class.toLowerCase() : 'waif';
        this.level = data.level || 0;
        this.experience = data.experience || 0;
        this.xpToNextLevel = data.expToNextLevel || 100;
        
        // Timestamps
        this.created = data.created || Date.now();
        this.lastPlayed = data.lastPlayed || Date.now();
        this.offlineTime = data.offlineTime || 0;
        
        // Core game systems
        this.stats = data.stats || {};
        this.skills = data.skills || {};
        this.currencies = data.currencies || {};
        
        // Action and progression systems
        this.actions = data.actions || {};
        this.quests = data.quests || {};
        this.actionQueue = data.actionQueue || [];
        
        // Home and progression
        this.home = data.home || {};
        
        // Achievement tracking
        this.characterAchievements = data.characterAchievements || {};
    }

    /**
     * Update the character's last played timestamp
     */
    updateLastPlayed() {
        this.lastPlayed = Date.now();
    }

    /**
     * Add offline time
     * @param {number} time - Offline time in milliseconds
     */
    addOfflineTime(time) {
        this.offlineTime += time;
    }

    /**
     * Serialize the character for saving
     * @returns {Object} Serialized character data
     */
    serialize() {
        return {
            id: this.id,
            name: this.name,
            class: this.class,
            created: this.created,
            lastPlayed: this.lastPlayed,
            offlineTime: this.offlineTime,
            stats: this.stats,
            skills: this.skills,
            currencies: this.currencies,
            actions: this.actions,
            quests: this.quests,
            actionQueue: this.actionQueue,
            home: this.home,
            characterAchievements: this.characterAchievements
        };
    }

    /**
     * Deserialize saved data into the character
     * @param {Object} data - Saved character data
     */
    deserialize(data) {
        Object.assign(this, data);
    }

    /**
     * Add an achievement
     * @param {string} achievementId - ID of the achievement
     * @param {Object} achievementData - Achievement data
     */
    addAchievement(achievementId, achievementData) {
        this.characterAchievements[achievementId] = achievementData;
    }

    /**
     * Add experience points to the character
     * @param {number} amount - Amount of XP to add
     * @returns {boolean} - whether leveling up
     */
    addXP(amount) {
        if (amount <= 0) return false;

        this.experience += amount;
        
        // Check if character can level up
        let leveledUp = false;
        while (this.experience >= this.xpToNextLevel) {
            leveledUp = this.levelUp();
            return leveledUp;
        }
    }

    /**
     * Level up the character
     * Increases level and calculates new XP threshold
     * @returns {boolean} - whether leveling up
     */
    levelUp() {
        // Recheck that we should be leveling up
        if (this.experience < this.xpToNextLevel) return false;

        // Subtract XP required for this level
        this.experience -= this.xpToNextLevel;
        
        // Increase level
        this.level++;
        
        // Calculate XP required for next level (can be customized)
        // Simple exponential growth model
        this.xpToNextLevel = Math.floor(100 * Math.pow(1.23, this.level));
        
        return true;    
    }
}