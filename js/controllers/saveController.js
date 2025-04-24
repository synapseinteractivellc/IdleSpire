// ./js/controllers/saveController.js
// The controller interface for saves

class SaveController {
  constructor(eventController, gameState) {
      this.eventController = eventController;
      this.gameState = gameState;
      this.SAVE_KEY = 'idleSpireGameSave';
      this.autosaveInterval = null;
      this.AUTOSAVE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
      
      // Subscribe to events
      this.subscribeToEvents();
  }
  
  /**
   * Initialize the save controller
   */
  init() {
      console.log('Initializing SaveController...');
      
      // Try to load existing save
      this.loadGame();
      
      // Setup autosave
      this.startAutosave();
      
      // Setup UI button event listeners
      this.setupEventListeners();
  }
  
  /**
   * Subscribe to game events
   */
  subscribeToEvents() {
      // Listen for game events that should trigger a save
      this.eventController.on('character:created', () => {
          this.saveGame();
      });
      
      // You can add more event subscriptions here as needed
  }
  
  /**
   * Setup event listeners for save-related UI elements
   */
  setupEventListeners() {
      const saveButton = document.getElementById('save-button');
      if (saveButton) {
          saveButton.addEventListener('click', () => {
              const success = this.saveGame();
              if (success) {
                  this.eventController.emit('ui:notification', {
                      message: 'Game saved successfully!',
                      type: 'success'
                  });
              }
          });
      }
      
      const wipeButton = document.getElementById('wipe-button');
      if (wipeButton) {
          wipeButton.addEventListener('click', () => {
              if (confirm('Are you sure you want to wipe your save data? This cannot be undone.')) {
                  this.wipeSave();
                  this.eventController.emit('ui:notification', {
                      message: 'Save data wiped. Refreshing game...',
                      type: 'warning'
                  });
                  
                  // Give time for notification to display before refresh
                  setTimeout(() => {
                      window.location.reload();
                  }, 1500);
              }
          });
      }
  }
  
  /**
   * Start the autosave interval
   */
  startAutosave() {
      // Clear any existing interval first
      this.stopAutosave();
      
      // Start new interval
      this.autosaveInterval = setInterval(() => {
          const success = this.saveGame();
          if (success) {
              console.log('Game autosaved');
              this.eventController.emit('save:autosaved', {
                  timestamp: Date.now()
              });
          }
      }, this.AUTOSAVE_INTERVAL_MS);
      
      console.log('Autosave started with interval:', this.AUTOSAVE_INTERVAL_MS, 'ms');
  }
  
  /**
   * Stop the autosave interval
   */
  stopAutosave() {
      if (this.autosaveInterval) {
          clearInterval(this.autosaveInterval);
          this.autosaveInterval = null;
          console.log('Autosave stopped');
      }
  }
  
  /**
   * Save game data to localStorage
   * @returns {boolean} Whether the save was successful
   */
  saveGame() {
      try {
          // Update the last saved timestamp
          this.gameState.lastSaved = Date.now();
          
          // Get the serialized game state
          const serializedState = this.gameState.serialize();
          
          // Save to localStorage
          localStorage.setItem(this.SAVE_KEY, JSON.stringify(serializedState));
          
          // Emit save event
          this.eventController.emit('save:saved', {
              timestamp: this.gameState.lastSaved
          });
          
          return true;
      } catch (error) {
          console.error('Failed to save game:', error);
          
          // Emit save error event
          this.eventController.emit('save:error', {
              error: error.message,
              action: 'save'
          });
          
          return false;
      }
  }
  
  /**
   * Load game data from localStorage
   * @returns {boolean} Whether the load was successful
   */
  loadGame() {
      try {
          const savedData = localStorage.getItem(this.SAVE_KEY);
          
          if (!savedData) {
              console.log('No save data found');
              return false;
          }
          
          // Parse the saved data
          const parsedData = JSON.parse(savedData);
          
          // Validate the data structure
          if (!this.validateSaveData(parsedData)) {
              console.error('Save data validation failed');
              return false;
          }
          
          // Deserialize into the game state
          const success = this.gameState.deserialize(parsedData);
          
          if (success) {
              // Calculate offline progress
              this.calculateOfflineProgress();
              
              // Emit load event
              this.eventController.emit('save:loaded', {
                  timestamp: Date.now()
              });
              
              console.log('Game loaded successfully');
              return true;
          } else {
              console.error('Failed to deserialize game state');
              return false;
          }
      } catch (error) {
          console.error('Failed to load game:', error);
          
          // Emit load error event
          this.eventController.emit('save:error', {
              error: error.message,
              action: 'load'
          });
          
          return false;
      }
  }
  
  /**
   * Calculate and apply offline progress
   */
  calculateOfflineProgress() {
      const character = this.gameState.getActiveCharacter();
      if (!character) return;
      
      const lastSaved = this.gameState.lastSaved;
      const now = Date.now();
      const offlineTime = now - lastSaved;
      
      // Only process offline time if it's significant (more than 1 minute)
      if (offlineTime < 60000) return;
      
      console.log('Calculating offline progress for', offlineTime / 1000, 'seconds');
      
      // Store the offline time for reference
      character.offlineTime = offlineTime;
      
      // Calculate resource accumulation during offline time
      this.processOfflineResourceGains(character, offlineTime);
      
      // Emit offline progress event
      this.eventController.emit('game:offline-progress', {
          offlineTime: offlineTime,
          offlineTimeInMinutes: Math.floor(offlineTime / 60000)
      });
  }
  
  /**
   * Process resource gains during offline time
   * @param {Object} character - The character to process
   * @param {number} offlineTime - The amount of offline time in milliseconds
   */
  processOfflineResourceGains(character, offlineTime) {
      const offlineSeconds = offlineTime / 1000;
      
      // Process stat gains
      for (const statId in character.stats) {
          const stat = character.stats[statId];
          if (stat.gainRate && stat.gainRate > 0) {
              const gain = stat.gainRate * offlineSeconds;
              stat.current = Math.min(stat.current + gain, stat.max);
              
              // Emit stat update event
              this.eventController.emit('stat:updated', {
                  id: statId,
                  current: stat.current,
                  max: stat.max,
                  gainRate: stat.gainRate
              });
          }
      }
      
      // Process currency gains
      for (const currencyId in character.currencies) {
          const currency = character.currencies[currencyId];
          if (currency.gainRate && currency.gainRate > 0) {
              const gain = currency.gainRate * offlineSeconds;
              currency.current = Math.min(currency.current + gain, currency.max);
              
              // Emit currency update event
              this.eventController.emit('currency:updated', {
                  id: currencyId,
                  current: currency.current,
                  max: currency.max,
                  gainRate: currency.gainRate
              });
          }
      }
  }
  
  /**
   * Validate the structure of loaded save data
   * @param {Object} data - The save data to validate
   * @returns {boolean} Whether the data is valid
   */
  validateSaveData(data) {
      // Minimum validation to check that we have a proper save structure
      if (!data) return false;
      
      // Check version
      if (!data.version) return false;
      
      // Check for essential top-level properties
      const requiredProps = ['lastSaved', 'characters', 'world'];
      for (const prop of requiredProps) {
          if (!data.hasOwnProperty(prop)) return false;
      }
      
      // Check for characters structure
      if (!data.characters.list || !data.characters.active) return false;
      
      // Check that active character exists in the list
      if (!data.characters.list[data.characters.active]) return false;
      
      return true;
  }
  
  /**
   * Wipe save data
   */
  wipeSave() {
      localStorage.removeItem(this.SAVE_KEY);
      console.log('Save data wiped');
      
      // Emit wipe event
      this.eventController.emit('save:wiped', {
          timestamp: Date.now()
      });
  }
  
  /**
   * Export save data as a string
   * @returns {string} JSON string of save data
   */
  exportSave() {
      const saveData = localStorage.getItem(this.SAVE_KEY);
      return saveData || '';
  }
  
  /**
   * Import save data from a string
   * @param {string} saveData - JSON string of save data
   * @returns {boolean} Whether the import was successful
   */
  importSave(saveData) {
      try {
          // Validate the data before importing
          const parsed = JSON.parse(saveData);
          if (!this.validateSaveData(parsed)) {
              return false;
          }
          
          // Import the data
          localStorage.setItem(this.SAVE_KEY, saveData);
          
          // Reload the game
          this.loadGame();
          
          // Emit import event
          this.eventController.emit('save:imported', {
              timestamp: Date.now()
          });
          
          return true;
      } catch (error) {
          console.error('Failed to import save:', error);
          
          // Emit import error event
          this.eventController.emit('save:error', {
              error: error.message,
              action: 'import'
          });
          
          return false;
      }
  }
}