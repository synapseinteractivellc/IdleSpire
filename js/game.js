// ./js/game.js
// Main game file

class Game {
    constructor() {
        // Create the event controller - the central messaging system
        this.eventController = new EventController();
        
        // Create other controllers
        this.uiController = new UIController(this.eventController);
        this.gameController = new GameController(this.eventController);
        
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
        
        // Initialize test controller in development mode
        this.testEventController.init();
        
        console.log('Game initialization complete');
        
        // Trigger welcome screen
        this.setupInitialUI();
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
        
        // Emit character creation event
        this.eventController.emit('character:created', characterData);
        
        // Show game container, hide welcome container
        document.getElementById('welcome-container').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        
        // Update character info in UI
        const characterInfo = document.getElementById('game-character-info');
        if (characterInfo) {
            characterInfo.textContent = `${characterName} the Level 1 ${selectedClass}`;
        }
        
        // Initialize game state
        this.setupGameState(characterData);
    }
    
    /**
     * Setup initial game state after character creation
     * @param {Object} characterData - The character data
     */
    setupGameState(characterData) {
        // TODO: Initialize GameState with character data
        
        // For testing, let's create some sample stats and currencies
        this.gameController.addNewStat('health', 'Health', 'health', 10, 10, 0.1);
        this.gameController.addNewStat('stamina', 'Stamina', 'stamina', 5, 10, 0.2);
        
        this.gameController.addNewCurrency('gold', 'Gold', 'gold', 0, 100, 0.5);
        
        // Log a test event
        this.testEventController.logMessage('Game state initialized with character: ' + characterData.name);
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});