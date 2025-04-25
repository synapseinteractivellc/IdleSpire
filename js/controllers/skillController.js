// ./js/controllers/skillController.js
// The controller interface for skills

class SkillController {
    /**
     * Create a new SkillController
     * @param {EventController} eventController - The event controller for pub/sub
     * @param {GameState} gameState - The game state management object
     */
    constructor(eventController, gameState) {
        this.eventController = eventController;
        this.gameState = gameState;
        this.skills = {};
        
        // Track skills by category for easier UI access
        this.skillsByCategory = {
            'Physical': [],
            'Magic': [],
            'Knowledge': [],
            'Crafting': []
        };
        
        // Subscribe to events
        this.subscribeToEvents();
    }
    
    /**
     * Initialize the skill controller
     */
    init() {
        console.log('Initializing SkillController...');

    }
    
    /**
     * Subscribe to game events
     */
    subscribeToEvents() {
        // Listen for character creation to initialize skills
        this.eventController.on('character:created', data => {
            this.setupInitialSkills(data);
        });
        
        // Listen for skill XP gained from actions
        this.eventController.on('skill:exp-gained', data => {
            this.addSkillXP(data.id, data.amount);
        });
        
        // Listen for save loaded
        this.eventController.on('save:loaded', () => {
            this.loadSkillsFromGameState();
        });
    }
    
    /**
     * Set up initial skills for a new character
     * @param {Object} characterData - Character data
     */
    setupInitialSkills(characterData) {
        // Clear existing skills
        this.skills = {};
        Object.keys(this.skillsByCategory).forEach(category => {
            this.skillsByCategory[category] = [];
        });
        
        // Create basic skills
        this.createBasicSkills();
        
        // Create class-specific skills if character data is provided
        if (characterData) {
            this.createClassSkills(characterData.class);
        }
    }
    
    /**
     * Create the basic skills that all characters have
     */
    createBasicSkills() {
        // Survival skill (unlocked by default)
        this.createSkill(
            'survival',
            'Survival',
            'Your ability to survive in harsh conditions and find basic necessities.',
            {
                category: 'Physical',
                unlocked: true,
                maxLevel: 5,
                priority: 1,
                bonuses: [
                    { level: 1, type: 'stat_max', target: 'health', value: 2 },
                    { level: 3, type: 'stat_regen', target: 'health', value: 0.1 },
                    { level: 5, type: 'action_unlock', target: 'forage', value: true }
                ]
            }
        );
        
        // Scavenging skill (unlocked at first)
        this.createSkill(
            'scavenging',
            'Scavenging',
            'Your ability to find useful items and resources in urban environments.',
            {
                category: 'Physical',
                unlocked: true,
                maxLevel: 5,
                priority: 2,
                bonuses: [
                    { level: 1, type: 'currency_max', target: 'gold', value: 5 },
                    { level: 3, type: 'action_modifier', target: 'beg', value: 1.5 },
                    { level: 5, type: 'action_unlock', target: 'scavenge', value: true }
                ]
            }
        );
    }
    
    /**
     * Create class-specific skills based on character class
     * @param {string} characterClass - The character's class
     */
    createClassSkills(characterClass) {
        // Convert to lowercase for case-insensitive comparison
        const className = characterClass.toLowerCase();
        
        if (className === 'waif') {
            // Waif-specific skills
            this.createSkill(
                'stealth',
                'Stealth',
                'Your ability to move undetected and avoid attention.',
                {
                    category: 'Physical',
                    unlocked: true,
                    maxLevel: 5,
                    priority: 3,
                    bonuses: [
                        { level: 3, type: 'action_unlock', target: 'pickpocket', value: true }
                    ]
                }
            );
        } else if (className === 'vagabond') {
            // Vagabond-specific skills
            this.createSkill(
                'toughness',
                'Toughness',
                'Your ability to endure physical hardship and pain.',
                {
                    category: 'Physical',
                    unlocked: true,
                    maxLevel: 5,
                    priority: 3,
                    bonuses: [
                        { level: 1, type: 'stat_max', target: 'stamina', value: 3 },
                        { level: 3, type: 'stat_regen', target: 'stamina', value: 0.1 }
                    ]
                }
            );
        }
        
        // Additional class-specific skills can be added here as needed
    }
    
    /**
     * Create a new skill
     * @param {string} id - Unique identifier for the skill
     * @param {string} name - Display name for the skill
     * @param {string} description - Description of the skill
     * @param {Object} options - Additional options for the skill
     * @returns {Skill} The created skill
     */
    createSkill(id, name, description, options = {}) {
        // Check if skill already exists
        if (this.skills[id]) {
            // If it exists, update any properties that might need updating
            const existingSkill = this.skills[id];
            
            // We could optionally update description or other properties here if needed
            // existingSkill.description = description;
            
            // Return existing skill instead of creating a new one
            return existingSkill;
        }

        // Create the skill
        const skill = new Skill(id, name, description, options);
        
        // Add to skills dictionary
        this.skills[id] = skill;
        
        // Add to category list
        const category = skill.category;
        if (this.skillsByCategory[category]) {
            this.skillsByCategory[category].push(skill);
            
            // Sort skills within category by priority
            this.skillsByCategory[category].sort((a, b) => a.priority - b.priority);
        }
        
        // Add to character if one exists
        const character = this.gameState.getActiveCharacter();
        if (character) {
            character.skills = character.skills || {};
            character.skills[id] = skill.serialize();
        }
        
        // Emit skill added event
        this.eventController.emit('skill:added', {
            id: id,
            name: name,
            description: description,
            category: skill.category,
            level: skill.currentLevel,
            maxLevel: skill.maxLevel,
            xp: skill.xp,
            xpToNextLevel: skill.xpToNextLevel,
            progress: skill.getLevelProgress(),
            unlocked: skill.unlocked
        });
        
        return skill;
    }
    
    /**
     * Add experience to a skill
     * @param {string} skillId - ID of the skill
     * @param {number} amount - Amount of XP to add
     * @returns {boolean} Whether leveling up occurred
     */
    addSkillXP(skillId, amount) {
        const skill = this.skills[skillId];
        if (!skill) return false;
        
        // Log XP gain
        console.log(`Adding ${amount} XP to skill: ${skill.name}`);
        
        // Add XP and check if leveled up
        const leveledUp = skill.addXP(amount);
        
        // Emit skill XP updated event
        this.eventController.emit('skill:updated', {
            id: skillId,
            name: skill.name,
            level: skill.currentLevel,
            maxLevel: skill.maxLevel,
            xp: skill.xp,
            xpToNextLevel: skill.xpToNextLevel,
            progress: skill.getLevelProgress()
        });
        
        // Update character data
        this.updateCharacterSkillData(skillId, skill);
        
        // Handle level up if it occurred
        if (leveledUp) {
            this.handleSkillLevelUp(skill);
        }
        
        return leveledUp;
    }
    
    /**
     * Handle skill level up event
     * @param {Skill} skill - The skill that leveled up
     */
    handleSkillLevelUp(skill) {
        console.log(`Skill ${skill.name} leveled up to ${skill.currentLevel}!`);
        
        // Emit skill level up event
        this.eventController.emit('skill:leveled-up', {
            id: skill.id,
            name: skill.name,
            level: skill.currentLevel,
            maxLevel: skill.maxLevel
        });
        
        // Get active bonuses for the current level
        const newBonuses = skill.getActiveBonuses().filter(bonus => 
            bonus.level === skill.currentLevel
        );
        
        // Apply new bonuses that were unlocked at this level
        this.applySkillBonuses(skill, newBonuses);
        
        // Check if any skills should be unlocked
        this.checkSkillUnlocks(skill);
    }
    
    /**
     * Apply skill bonuses
     * @param {Skill} skill - The skill that provided the bonuses
     * @param {Array} bonuses - List of bonuses to apply
     */
    applySkillBonuses(skill, bonuses) {
        if (!bonuses || bonuses.length === 0) return;
        
        for (const bonus of bonuses) {
            // Apply based on bonus type
            switch (bonus.type) {
                case 'stat_max':
                    // Increase max stat value
                    this.eventController.emit('resource:max-increase', {
                        type: 'stat',
                        id: bonus.target,
                        amount: bonus.value,
                        source: `${skill.name} Skill`
                    });
                    break;
                    
                case 'stat_regen':
                    // Increase stat regeneration rate
                    this.eventController.emit('resource:regen-increase', {
                        type: 'stat',
                        id: bonus.target,
                        amount: bonus.value,
                        source: `${skill.name} Skill`
                    });
                    break;
                    
                case 'currency_max':
                    // Increase max currency value
                    this.eventController.emit('resource:max-increase', {
                        type: 'currency',
                        id: bonus.target,
                        amount: bonus.value,
                        source: `${skill.name} Skill`
                    });
                    break;
                    
                case 'action_modifier':
                    // Add modifier to action
                    this.eventController.emit('action:add-modifier', {
                        actionId: bonus.target,
                        modifierId: `skill_${skill.id}_${skill.currentLevel}`,
                        type: 'reward',
                        value: bonus.value,
                        source: `${skill.name} Skill`
                    });
                    break;
                    
                case 'action_unlock':
                    // Unlock an action
                    this.eventController.emit('action:unlock', {
                        actionId: bonus.target,
                        source: `${skill.name} Skill`
                    });
                    break;
            }
            
            // Emit bonus applied event
            this.eventController.emit('skill:bonus-applied', {
                skillId: skill.id,
                skillName: skill.name,
                bonusType: bonus.type,
                target: bonus.target,
                value: bonus.value
            });
        }
    }
    
    /**
     * Check if any skills should be unlocked based on this skill's level
     * @param {Skill} skill - The skill that leveled up
     */
    checkSkillUnlocks(skill) {
        // This would likely use a configuration/unlock requirements system
        // For now, implementing a basic version
        
        // Example: If survival reaches level 3, unlock 'hunting' skill
        if (skill.id === 'survival' && skill.currentLevel >= 3) {
            const huntingSkill = this.skills['hunting'];
            
            // If hunting doesn't exist yet, create it
            if (!huntingSkill) {
                this.createSkill(
                    'hunting',
                    'Hunting',
                    'Your ability to track and hunt animals for food.',
                    {
                        category: 'Physical',
                        unlocked: true,
                        maxLevel: 5,
                        priority: 4,
                        bonuses: [
                            { level: 2, type: 'stat_max', target: 'stamina', value: 2 },
                            { level: 4, type: 'action_unlock', target: 'hunt', value: true }
                        ]
                    }
                );
                
                // Emit skill unlocked event
                this.eventController.emit('skill:unlocked', {
                    id: 'hunting',
                    name: 'Hunting',
                    unlockedBy: skill.name
                });
            }
        }
        
        // More unlock logic can be added here
    }
    
    /**
     * Update skill data in character object
     * @param {string} skillId - ID of the skill to update
     * @param {Skill} skill - Skill object
     */
    updateCharacterSkillData(skillId, skill) {
        const character = this.gameState.getActiveCharacter();
        if (!character) return;
        
        character.skills = character.skills || {};
        character.skills[skillId] = skill.serialize();
    }
    
    /**
     * Load skills from game state
     */
    loadSkillsFromGameState() {
        const character = this.gameState.getActiveCharacter();
        if (!character || !character.skills) return;
        
        // Clear existing skills
        this.skills = {};
        Object.keys(this.skillsByCategory).forEach(category => {
            this.skillsByCategory[category] = [];
        });
        
        // Load each skill from character data
        for (const skillId in character.skills) {
            const skillData = character.skills[skillId];
            
            // Skip if no data
            if (!skillData) continue;
            
            // Create skill object based on ID
            if (skillId === 'survival') {
                this.createSkill(
                    'survival',
                    'Survival',
                    'Your ability to survive in harsh conditions and find basic necessities.',
                    {
                        category: 'Physical',
                        maxLevel: 5,
                        priority: 1,
                        unlocked: true,
                        bonuses: [
                            { level: 1, type: 'stat_max', target: 'health', value: 2 },
                            { level: 3, type: 'stat_regen', target: 'health', value: 0.1 },
                            { level: 5, type: 'action_unlock', target: 'forage', value: true }
                        ]
                    }
                );
            } else if (skillId === 'scavenging') {
                this.createSkill(
                    'scavenging',
                    'Scavenging',
                    'Your ability to find useful items and resources in urban environments.',
                    {
                        category: 'Physical',
                        maxLevel: 5,
                        priority: 2,
                        unlocked: true,
                        bonuses: [
                            { level: 1, type: 'currency_max', target: 'gold', value: 5 },
                            { level: 3, type: 'action_modifier', target: 'beg', value: 1.5 },
                            { level: 5, type: 'action_unlock', target: 'scavenge', value: true }
                        ]
                    }
                );
            } else if (skillId === 'stealth') {
                this.createSkill(
                    'stealth',
                    'Stealth',
                    'Your ability to move undetected and avoid attention.',
                    {
                        category: 'Physical',
                        maxLevel: 5,
                        priority: 3,
                        unlocked: true,
                        bonuses: [
                            { level: 3, type: 'action_unlock', target: 'pickpocket', value: true }
                        ]
                    }
                );
            } else if (skillId === 'toughness') {
                this.createSkill(
                    'toughness',
                    'Toughness',
                    'Your ability to endure physical hardship and pain.',
                    {
                        category: 'Physical',
                        maxLevel: 5,
                        priority: 3,
                        unlocked: true,
                        bonuses: [
                            { level: 1, type: 'stat_max', target: 'stamina', value: 3 },
                            { level: 3, type: 'stat_regen', target: 'stamina', value: 0.1 }
                        ]
                    }
                );
            } else if (skillId === 'hunting') {
                this.createSkill(
                    'hunting',
                    'Hunting',
                    'Your ability to track and hunt animals for food.',
                    {
                        category: 'Physical',
                        maxLevel: 5,
                        priority: 4,
                        unlocked: true,
                        bonuses: [
                            { level: 2, type: 'stat_max', target: 'stamina', value: 2 },
                            { level: 4, type: 'action_unlock', target: 'hunt', value: true }
                        ]
                    }
                );
            }
            // Add more skill types as needed
            
            // Deserialize saved data into the skill
            if (this.skills[skillId]) {
                this.skills[skillId].deserialize(skillData);
            }
        }
        
        // Apply active bonuses for all skills
        this.applyAllSkillBonuses();
        
        // Notify UI of all skills
        Object.values(this.skills).forEach(skill => {
            this.eventController.emit('skill:loaded', {
                id: skill.id,
                name: skill.name,
                description: skill.description,
                category: skill.category,
                level: skill.currentLevel,
                maxLevel: skill.maxLevel,
                xp: skill.xp,
                xpToNextLevel: skill.xpToNextLevel,
                progress: skill.getLevelProgress(),
                unlocked: skill.unlocked
            });
        });
    }
    
    /**
     * Apply all active skill bonuses
     */
    applyAllSkillBonuses() {
        for (const skillId in this.skills) {
            const skill = this.skills[skillId];
            const activeBonus = skill.getActiveBonuses();
            
            // Apply all active bonuses for this skill
            this.applySkillBonuses(skill, activeBonus);
        }
    }
    
    /**
     * Get all skills in a specific category
     * @param {string} category - The category to get skills for
     * @returns {Array} List of skills in the category
     */
    getSkillsByCategory(category) {
        return this.skillsByCategory[category] || [];
    }
    
    /**
     * Get all categories with at least one unlocked skill
     * @returns {Array} List of active categories
     */
    getActiveCategories() {
        const activeCategories = [];
        
        for (const category in this.skillsByCategory) {
            const skills = this.skillsByCategory[category];
            if (skills.some(skill => skill.unlocked)) {
                activeCategories.push(category);
            }
        }
        
        return activeCategories;
    }
    
    /**
     * Check if a skill is unlocked
     * @param {string} skillId - ID of the skill to check
     * @returns {boolean} Whether the skill is unlocked
     */
    isSkillUnlocked(skillId) {
        return this.skills[skillId]?.unlocked || false;
    }
    
    /**
     * Unlock a skill
     * @param {string} skillId - ID of the skill to unlock
     * @param {string} source - Source of the unlock
     * @returns {boolean} Whether the unlock was successful
     */
    unlockSkill(skillId, source = 'System') {
        const skill = this.skills[skillId];
        if (!skill || skill.unlocked) {
            return false;
        }
        
        skill.unlocked = true;
        skill.visible = true;
        
        // Update character data
        this.updateCharacterSkillData(skillId, skill);
        
        // Emit skill unlocked event
        this.eventController.emit('skill:unlocked', {
            id: skillId,
            name: skill.name,
            unlockedBy: source
        });
        
        return true;
    }
}