// ./js/game.js
// Main game file

class Game {
    constructor() {
        // Create the event controller - the central messaging system
        this.eventController = new EventController();
        
        // Create the game state
        this.gameState = new GameState();
        
        // Create controllers
        this.uiController = new UIController(this.eventController);
        this.gameController = new GameController(this.eventController);
        this.saveController = new SaveController(this.eventController, this.gameState);
        this.actionLogController = new ActionLogController(this.eventController);
        
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
        this.uiController.init();
        this.gameController.init();
        this.saveController.init();
        this.actionLogController.init();
        
        // Initialize test controller in development mode
        this.testEventController.init();
        
        console.log('Game initialization complete');
        
        // Check for existing save
        const hasSave = this.saveController.loadGame();
        
        // If save exists, go to game screen, otherwise show welcome
        if (hasSave) {
            this.showGameScreen();
        } else {
            // Trigger welcome screen
            this.setupInitialUI();
        }
    }

    /**
     * Show the game screen and hide welcome screen
     */
    showGameScreen() {
        document.getElementById('welcome-container').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        
        // Update UI with character info
        this.updateCharacterInfo();
    }

    /**
     * Update character info in UI
     */
    updateCharacterInfo() {
        const character = this.gameState.getActiveCharacter();
        
        if (character) {
            // Update character info in UI
            const characterInfo = document.getElementById('game-character-info');
            if (characterInfo) {
                // For now, we're just showing basic info
                characterInfo.textContent = `${character.name} the Level 1 ${character.class}`;
            }
            
            // Initialize UI with character data
            this.initializeUIFromCharacter(character);
        }
    }
    
    /**
     * Initialize UI elements from character data
     * @param {Object} character - The character data
     */
    initializeUIFromCharacter(character) {
        // Initialize stats
        for (const statId in character.stats) {
            const stat = character.stats[statId];
            this.gameController.addNewStat(
                statId,
                statId.charAt(0).toUpperCase() + statId.slice(1), // Capitalize first letter
                statId,
                stat.current,
                stat.max,
                stat.gainRate || 0
            );
        }
        
        // Initialize currencies
        for (const currencyId in character.currencies) {
            const currency = character.currencies[currencyId];
            this.gameController.addNewCurrency(
                currencyId,
                currencyId.charAt(0).toUpperCase() + currencyId.slice(1), // Capitalize first letter
                currencyId,
                currency.current,
                currency.max,
                currency.gainRate || 0
            );
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
        
        // Initialize game state with character
        const character = this.gameState.initializeWithCharacter(characterData);
        
        // Save the game state
        this.saveController.saveGame();
        
        // Emit character creation event
        this.eventController.emit('character:created', characterData);
        
        // Show game container, hide welcome container
        this.showGameScreen();
        
        // Log a test event
        this.testEventController.logMessage('Game state initialized with character: ' + characterData.name);
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});