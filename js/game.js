// ./js/game.js
// Main game file

class Game {
    constructor() {
        // Create the event controller - the central messaging system
        this.eventController = new EventController();
        
        // Create game state
        this.gameState = new GameState();
        
        // Create other controllers
        this.saveController = new SaveController(this.eventController, this.gameState);
        this.uiController = new UIController(this.eventController);
        this.gameController = new GameController(this.eventController, this.gameState);
        
        // Create test controller if in development mode
        this.testEventController = new TestEventController(this.eventController);
        
        // Initialize all controllers
        this.init();
    }
    
    /**
     * Initialize the game
     */
    init() {
        console.log('Initializing IdleSpire game...');
        
        // Initialize controllers
        this.saveController.init();
        this.uiController.init();
        this.gameController.init();
        
        // Initialize test controller in development mode
        this.testEventController.init();
        
        console.log('Game initialization complete');
        
        // First check if we have a saved game
        const hasExistingSave = this.saveController.loadGame();
        
        if (hasExistingSave) {
            // If we have a save, go straight to game
            document.getElementById('welcome-container').classList.add('hidden');
            document.getElementById('game-container').classList.remove('hidden');
            
            // Update UI based on loaded game state
            this.updateUIFromGameState();
        } else {
            // If no save, show character creation
            this.setupInitialUI();
        }
    }
    
    /**
     * Setup initial UI and event listeners
     */
    setupInitialUI() {
        // Elements
        const welcomeContainer = document.getElementById('welcome-container');
        const gameContainer = document.getElementById('game-container');
        const characterForm = document.getElementById('character-form');
        const classButtons = document.querySelectorAll('.class-choice');
        
        // Setup character creation form submission
        if (characterForm) {
            characterForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.handleCharacterCreation(event);
            });
        }
        
        // Setup class selection buttons
        classButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                classButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                button.classList.add('active');
            });
        });
    }
    
    /**
     * Handle character creation form submission
     * @param {Event} event - The form submission event
     */
    handleCharacterCreation(event) {
        const form = event.target;
        const characterName = form.querySelector('#character-name').value;
        const selectedClass = form.querySelector('.class-choice.active').dataset.class;
        
        // Create a new character
        const characterData = {
            name: characterName,
            class: selectedClass
        };
        
        console.log('Creating character:', characterData);
        
        // Initialize game state with character data
        this.setupGameState(characterData);
        
        // Show game container, hide welcome container
        document.getElementById('welcome-container').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        
        // Update character info in UI
        const characterInfo = document.getElementById('game-character-info');
        if (characterInfo) {
            characterInfo.textContent = `${characterName} the Level 1 ${selectedClass}`;
        }
        
        // Emit character creation event
        this.eventController.emit('character:created', characterData);
    }

    /**
     * Setup initial game state after character creation
     * @param {Object} characterData - The character data
     */
    setupGameState(characterData) {
        // Initialize game state with new character
        const character = this.gameState.initializeWithCharacter(characterData);
        
        // Save the initial game state
        this.saveController.saveGame();
        
        // Initialize UI with character data
        this.updateUIFromGameState();
        
        // Log a test event
        this.testEventController.logMessage('Game state initialized with character: ' + characterData.name);
    }

    /**
     * Update UI elements based on current game state
     */
    updateUIFromGameState() {
        const character = this.gameState.getActiveCharacter();
        
        if (!character) {
            console.error('No active character found in game state');
            return;
        }
        
        // Update character info in header
        const characterInfo = document.getElementById('game-character-info');
        if (characterInfo) {
            characterInfo.textContent = `${character.name} the Level 1 ${character.class}`;
        }
        
        // Add stats to UI
        for (const statId in character.stats) {
            const stat = character.stats[statId];
            this.gameController.addNewStat(
                statId,
                statId.charAt(0).toUpperCase() + statId.slice(1), // Capitalize the stat name
                statId,
                stat.current,
                stat.max,
                stat.gainRate
            );
        }
        
        // Add currencies to UI
        for (const currencyId in character.currencies) {
            const currency = character.currencies[currencyId];
            this.gameController.addNewCurrency(
                currencyId,
                currencyId.charAt(0).toUpperCase() + currencyId.slice(1), // Capitalize the currency name
                currencyId,
                currency.current,
                currency.max,
                currency.gainRate
            );
        }
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});