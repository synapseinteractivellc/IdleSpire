// ./js/controllers/homeController.js
// The controller interface for homes

class HomeController {
    /**
     * Create a new HomeController
     * @param {EventController} eventController - The event controller for pub/sub
     * @param {GameState} gameState - The game state management object
     */
    constructor(eventController, gameState) {
        this.eventController = eventController;
        this.gameState = gameState;
        
        // Collection of available homes
        this.homes = {};
        
        // Subscribe to events
        this.subscribeToEvents();
    }
    
    /**
     * Initialize the home controller
     */
    init() {
        console.log('Initializing HomeController...');
    }
    
    /**
     * Subscribe to game events
     */
    subscribeToEvents() {
        // Listen for character creation to initialize homes
        this.eventController.on('character:needHomes', () => {
            this.setupInitialHomes();
        });
        
        // Listen for home transition attempts
        this.eventController.on('home:transition', (data) => {
            this.transitionHome(data.homeId);
        });
        
        // Listen for save loaded
        this.eventController.on('save:loaded', () => {
            this.loadHomesFromGameState();
        });
    }
    
    /**
     * Set up initial homes for a new character
     */
    setupInitialHomes() {
        // Clear existing homes
        this.homes = {};
        
        // Create starting homes
        const street = this.createHome('street', 'Street', 'Living on the streets, your first home.', {
            type: 'street',
            maxFloorSpace: 0,
            unlocked: true,
            requirements: {},
            effects: {}
        });
        
        const abandoned_building = this.createHome('abandoned_building', 'Abandoned Building', 'A dilapidated building you\'ve found shelter in.', {
            type: 'abandoned',
            maxFloorSpace: 10,
            unlocked: false,
            requirements: {
                skills: {
                    'survival': 3
                },
                classes: ['waif', 'vagabond']
            },
            effects: {}
        });

        this.transitionHome(street.id);
    }
    
    /**
     * Create a new home
     * @param {string} id - Unique identifier for the home
     * @param {string} name - Display name for the home
     * @param {string} description - Description of the home
     * @param {Object} options - Home configuration options
     * @returns {Home} The created home
     */
    createHome(id, name, description, options = {}) {
        // Prevent duplicate homes
        if (this.homes[id]) {
            console.warn(`Home with id ${id} already exists`);
            return this.homes[id];
        }
        
        // Create the home
        const home = new Home(id, name, description, options);
        
        // Add to homes collection
        this.homes[id] = home;
        
        // Emit home added event
        this.eventController.emit('home:added', {
            id: home.id,
            name: home.name,
            description: home.description,
            type: home.type,
            maxFloorSpace: home.maxFloorSpace,
            unlocked: home.unlocked
        });
        
        return home;
    }
    
    /**
     * Attempt to transition to a new home
     * @param {string} homeId - ID of the home to transition to
     * @returns {boolean} Whether the home transition was successful
     */
    transitionHome(homeId) {
        const character = this.gameState.getActiveCharacter();
        if (!character) return false;
        
        const newHome = this.homes[homeId];
        if (!newHome) {
            console.error(`Home with id ${homeId} not found`);
            return false;
        }
        
        // Check unlock requirements
        const requirementCheck = newHome.checkUnlockRequirements(character);
        if (!requirementCheck.success) {
            // Emit event with requirement details
            this.eventController.emit('home:transition-failed', {
                homeId: homeId,
                missingRequirements: requirementCheck.missingRequirements
            });
            return false;
        }
        
        /*
        // If current home exists, check furniture compatibility
        const currentHome = character.home;
        if (currentHome) {
            const home = this.homes[currentHome.id];
            const compatibilityCheck = home.checkFurnitureCompatibility(newHome);
            
            if (!compatibilityCheck.compatible) {
                // Emit event with incompatible furniture details
                this.eventController.emit('home:transition-warning', {
                    currentHomeId: home.id,
                    newHomeId: homeId,
                    incompatibleItems: compatibilityCheck.incompatibleItems
                });
                
                // Optionally, you might want to add a way for the user to confirm the transition
                return false;
            }
        }
        */
       
        // Update character's home
        character.home = {
            id: newHome.id,
            type: newHome.type,
            name: newHome.name,
            description: newHome.description,
            usedFloorSpace: newHome.usedFloorSpace,
            maxFloorSpace: newHome.maxFloorSpace
        };
        
        // Emit successful transition event
        this.eventController.emit('home:transitioned', {
            homeId: homeId,
            name: newHome.name,
            description: newHome.description,
            usedFloorSpace: newHome.usedFloorSpace,
            maxFloorSpace: newHome.maxFloorSpace
        });
        
        return true;
    }
    
    /**
     * Load homes from game state after save is loaded
     */
    loadHomesFromGameState() {
        const character = this.gameState.getActiveCharacter();
        if (!character) return;
        
        // Check if character has home data
        if (character.home) {
            // We have saved home data, so we need to ensure those homes exist
            const currentHomeId = character.home.id;
            
            // Check if we already have this home in our collection
            if (!this.homes[currentHomeId]) {
                // We don't have the homes yet, so create them
                // Clear existing homes first
                this.homes = {};
                
                // Create the initial homes without transitioning
                // This is a version of setupInitialHomes without the transition
                this.createHome('street', 'Street', 'Living on the streets, your first home.', {
                    type: 'street',
                    maxFloorSpace: 0,
                    unlocked: true,
                    requirements: {},
                    effects: {}
                });
                
                this.createHome('abandoned_building', 'Abandoned Building', 'A dilapidated building you\'ve found shelter in.', {
                    type: 'abandoned',
                    maxFloorSpace: 10,
                    unlocked: false,
                    requirements: {
                        skills: {
                            'survival': 3
                        },
                        classes: ['waif', 'vagabond']
                    },
                    effects: {}
                });
                
                // Add other homes as needed
            }
            
            // Now update the homes with saved data
            if (this.homes[currentHomeId]) {
                // Update home properties from character data
                this.homes[currentHomeId].type = character.home.type || this.homes[currentHomeId].type;
                this.homes[currentHomeId].usedFloorSpace = character.home.usedFloorSpace || this.homes[currentHomeId].usedFloorSpace;
                this.homes[currentHomeId].unlocked = true; // If it's in save data, it should be unlocked
                
                // If there's furniture data, update it
                if (character.home.furniture && Array.isArray(character.home.furniture)) {
                    this.homes[currentHomeId].furniture = character.home.furniture;
                }
                
                // If there are any other properties to copy, do it here
                if (character.home.effects) this.homes[currentHomeId].effects = character.home.effects;
                
                // Notify that the home has been loaded
                this.eventController.emit('home:loaded', {
                    homeId: currentHomeId,
                    name: this.homes[currentHomeId].name,
                    description: this.homes[currentHomeId].description,
                    usedFloorSpace: this.homes[currentHomeId].usedFloorSpace,
                    maxFloorSpace: this.homes[currentHomeId].maxFloorSpace
                });
            } else {
                console.warn(`Home ${currentHomeId} not found in homes collection after initialization. This shouldn't happen.`);
            }
        } else {
            // No saved home data, initialize with defaults
            this.setupInitialHomes();
        }
    }
    
    /**
     * Get a specific home by ID
     * @param {string} homeId - ID of the home to retrieve
     * @returns {Home|null} The home object or null if not found
     */
    getHome(homeId) {
        return this.homes[homeId] || null;
    }
    
    /**
     * Get all available homes
     * @returns {Object} Dictionary of available homes
     */
    getAllHomes() {
        return this.homes;
    }
}