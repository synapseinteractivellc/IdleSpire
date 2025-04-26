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
        this.resourceController = new ResourceController(this.eventController, this.gameState);
        this.characterController = new CharacterController(this.eventController, this.gameState);
        this.saveController = new SaveController(this.eventController, this.gameState);
        this.actionLogController = new ActionLogController(this.eventController);
        this.actionController = new ActionController(this.eventController, this.gameState);
        this.skillController = new SkillController(this.eventController, this.gameState);
        this.upgradeController = new UpgradeController(this.eventController, this.gameState);
        
        // Create test controller if in development mode
        // this.testEventController = new TestEventController(this.eventController);
        
        // Game tick variables
        this.lastUpdate = Date.now();
        this.gameLoopId = null;
        
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
        this.resourceController.init();
        this.saveController.init();
        this.actionLogController.init();
        this.actionController.init();
        this.skillController.init();
        this.characterController.init();
        
        // Initialize test controller in development mode
        // this.testEventController.init();
        
        console.log('Game initialization complete');
        
        // Check for existing save
        const hasSave = this.saveController.loadGame();
        
        // If save exists, go to game screen, otherwise show welcome
        if (hasSave) {
            this.showGameScreen();
            
            // Load resources from save data
            const character = this.gameState.getActiveCharacter();
            if (character) {
                this.resourceController.loadFromSaveData(character);
            }
        } else {
            // Trigger welcome screen
            this.setupInitialUI();
        }
        
        // Start the game loop
        this.startGameLoop();
    }
    
    /**
     * Start the game loop
     */
    startGameLoop() {
        if (this.gameLoopId !== null) {
            cancelAnimationFrame(this.gameLoopId);
        }
        
        const gameLoop = () => {
            const now = Date.now();
            const deltaTime = now - this.lastUpdate;
            
            // Only update if at least 16ms passed (60fps max)
            if (deltaTime >= 16) {
                this.update(deltaTime);
                this.lastUpdate = now;
            }
            
            this.gameLoopId = requestAnimationFrame(gameLoop);
        };
        
        this.gameLoopId = requestAnimationFrame(gameLoop);
        console.log('Game loop started');
    }
    
    /**
     * Stop the game loop
     */
    stopGameLoop() {
        if (this.gameLoopId !== null) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
            console.log('Game loop stopped');
        }
    }
    
    /**
     * Update game state
     * @param {number} deltaTime - Time elapsed since last update in ms
     */
    update(deltaTime) {
        // Update resources
        this.resourceController.updateResources(deltaTime);

        // Update actions
        this.actionController.updateActions(deltaTime);
        
        // Other update logic will go here as it's implemented
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

        console.log('Game state saved with character:', character);
        
        // Emit character creation event
        this.eventController.emit('character:created', characterData);
        
        // Show game container, hide welcome container
        this.showGameScreen();
        
        // Log a test event
        // this.testEventController.logMessage('Game state initialized with character: ' + characterData.name);
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();

    const characterNameInput = document.getElementById('character-name');
    const classSelectionGroup = document.getElementById('class-selection-group');
    const classChoices = document.querySelectorAll('.class-choice');
    const characterInfo = document.getElementById('character-info');
    const startButton = document.getElementById('start-game');
    
    // Initially hide elements
    if (classSelectionGroup) {
        classSelectionGroup.style.opacity = '0';
        classSelectionGroup.style.transform = 'translateY(20px)';
        classSelectionGroup.style.pointerEvents = 'none';
    }
    
    if (characterInfo) {
        characterInfo.style.opacity = '0';
        characterInfo.style.transform = 'translateY(20px)';
        characterInfo.style.pointerEvents = 'none';
    }
    
    if (startButton) {
        startButton.style.opacity = '0';
        startButton.style.transform = 'translateY(20px)';
        startButton.style.pointerEvents = 'none';
    }
    
    // Show class selection when name is entered
    if (characterNameInput) {
        characterNameInput.addEventListener('input', (event) => {
            if (event.target.value.trim().length >= 2) { // Require at least 2 characters
                // Show class selection with animation
                classSelectionGroup.style.transition = 'opacity 0.9s ease, transform 0.9s ease';
                classSelectionGroup.style.opacity = '1';
                classSelectionGroup.style.transform = 'translateY(0)';
                classSelectionGroup.style.pointerEvents = 'auto';
            } else {
                // Hide class selection if name is too short
                classSelectionGroup.style.opacity = '0';
                classSelectionGroup.style.transform = 'translateY(20px)';
                classSelectionGroup.style.pointerEvents = 'none';
                
                // Also hide subsequent elements
                characterInfo.style.opacity = '0';
                characterInfo.style.transform = 'translateY(20px)';
                characterInfo.style.pointerEvents = 'none';
                
                startButton.style.opacity = '0';
                startButton.style.transform = 'translateY(20px)';
                startButton.style.pointerEvents = 'none';
            }
        });
        
        // Check initial state (in case of page refresh with filled input)
        if (characterNameInput.value.trim().length >= 2) {
            classSelectionGroup.style.opacity = '1';
            classSelectionGroup.style.transform = 'translateY(0)';
            classSelectionGroup.style.pointerEvents = 'auto';
        }
    }
    
    // Show character info when a class is selected
    if (classChoices.length > 0) {
        classChoices.forEach(choice => {
            choice.addEventListener('click', () => {
                // Remove active class from all buttons
                classChoices.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                choice.classList.add('active');
                
                // Show character info with animation
                characterInfo.style.transition = 'opacity 0.9s ease, transform 0.9s ease';
                characterInfo.style.opacity = '1';
                characterInfo.style.transform = 'translateY(0)';
                characterInfo.style.pointerEvents = 'auto';
                
                // Show start button after a delay
                setTimeout(() => {
                    startButton.style.transition = 'opacity 0.9s ease, transform 0.9s ease';
                    startButton.style.opacity = '1';
                    startButton.style.transform = 'translateY(0)';
                    startButton.style.pointerEvents = 'auto';
                }, 900); // 0.9s delay before showing the button
            });
        });
        
        // Check if a class is already selected (page refresh case)
        const activeClass = document.querySelector('.class-choice.active');
        if (activeClass) {
            characterInfo.style.opacity = '1';
            characterInfo.style.transform = 'translateY(0)';
            characterInfo.style.pointerEvents = 'auto';
            
            startButton.style.opacity = '1';
            startButton.style.transform = 'translateY(0)';
            startButton.style.pointerEvents = 'auto';
        }
    }
});