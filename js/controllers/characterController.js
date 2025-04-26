// ./js/controllers/characterController.js
// The controller interface for characters

class CharacterController {
    /**
     * Create a new CharacterController
     * @param {EventController} eventController - The event controller for pub/sub
     * @param {GameState} gameState - The game state management object
     */
    constructor(eventController, gameState, resourceController) {
        this.eventController = eventController;
        this.gameState = gameState;
        
        // Subscribe to events
        this.subscribeToEvents();
    }

    /**
     * Initialize the character controller
     */
    init() {
        console.log('Initializing CharacterController...');
    }

    /**
     * Subscribe to game events
     */
    subscribeToEvents() {
        // Listen for character creation
        this.eventController.on('character:created', (characterData) => {
            this.handleCharacterCreation(characterData);
        });

        // Listen for level up events
        this.eventController.on('character:level-up', (levelUpData) => {
            this.handleCharacterLevelUp(levelUpData);
        });

        // Listen for XP gain events
        this.eventController.on('character:xp-gained', (xpData) => {
            this.handleXPGain(xpData);
        });
    }

    /**
     * Handle character creation process
     * @param {Object} characterData - Data for character creation
     * @returns {Character} The created character
     */
    handleCharacterCreation(characterData) {
        // Get the active character from game state
        const character = this.gameState.getActiveCharacter();
        
        if (!character) {
            console.error('No active character found during creation');
            return null;
        }

        // Initialize basic resources
        this.initializeCharacterResources(character);

        // Initialize character basic actions
        this.initializeCharacterActions(character);

        // Initialize character basic upgrades
        this.initializeCharacterUpgrades(character);

        return character;
    }

    /**
     * Initialize default resources for characters
     * @param {Character} character - The character to initialize
     */
    initializeCharacterResources(character) {
        if (!character) return;
        this.eventController.emit('character:needResources', character);
    }

    /**
     * Initialize default actions for characters
     * @param {Character} character - The character to initialize
     */
    initializeCharacterActions(character) {  
        if (!character) return;
        this.eventController.emit('character:needActions', character);
    }

    /** 
     * Initialize default upgrades for characters
     * @param {Character} character - The character to initialize
     */
    initializeCharacterUpgrades(character) {
        if (!character) return;
        this.eventController.emit('character:needUpgrades', character);
    }

    /**
     * Handle character level up event
     * @param {Object} levelUpData - Data about the level up
     */
    handleCharacterLevelUp(levelUpData) {
        // Log the level up
        console.log(`Character ${levelUpData.characterName} leveled up from ${levelUpData.previousLevel} to ${levelUpData.newLevel}`);
    }

    /**
     * Handle XP gain event
     * @param {Object} xpData - Data about XP gained
     */
    handleXPGain(xpData) {
        // Potential additional XP handling logic
        console.log(`Character gained ${xpData.amount} XP. Total: ${xpData.newTotal}`);
        
        const character = this.gameState.getActiveCharacter();
        if (!character) return;

        let leveledUp = false;
        leveledUp = character.addXP(xpData);

        if (leveledUp) {
            // Potentially trigger additional celebrations or checks
            this.eventController.emit('character:level-up', {
                characterId: character.id,
                newLevel: character.level,
                characterName: character.name
            });
        }
    }
}