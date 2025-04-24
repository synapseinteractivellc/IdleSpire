// ./js/models/gameState.js
// The model for the gameState object in the game

class GameState {
  constructor() {
      // Save format version for migration support
      this.version = "1.0.0";
      
      // Timestamp tracking
      this.lastSaved = Date.now();
      this.createdAt = Date.now();
      
      // Account settings
      this.accountSettings = {
          audioVolume: 0.7,
          musicVolume: 0.5
      };
      
      // Account-wide progression
      this.accountProgress = {
          maxCharacterSlots: 1,
          hasFoundedGuild: false
      };
      
      // World state
      this.world = {
          unlockedRegions: ["startingCity"],
          worldEvents: {}
      };
      
      // Characters
      this.characters = {
          active: null,
          list: {}
      };
  }
  
  /**
   * Initialize a new game state with character data
   * @param {Object} characterData - Basic character creation data
   * @returns {Object} - The new character object
   */
  initializeWithCharacter(characterData) {
      // Generate a unique ID for the character
      const characterId = 'char_' + Date.now();
      
      // Create the character
      const character = {
          id: characterId,
          name: characterData.name,
          class: characterData.class.toLowerCase(),
          created: Date.now(),
          lastPlayed: Date.now(),
          offlineTime: 0,
          
          // Starting stats based on character class
          stats: {
              health: {current: 10, max: 10, gainRate: 0},
              stamina: {current: 10, max: 10, gainRate: 0}
          },
          
          // Starting skills
          skills: {
              survival: {level: 0, exp: 0, maxLevel: 5, xpToNext: 100}
          },
          
          // Starting currencies
          currencies: {
              gold: {current: 0, max: 10, gainRate: 0}
          },
          
          // Available actions
          actions: {
              beg: {
                  timesPerformed: 0,
                  currentProgress: 0,
              }
          },
          
          // Empty quest log
          quests: {},
          
          // Empty action queue
          actionQueue: [],
          
          // Basic home
          home: {
              type: "street",
              level: 0
          },
          
          // Achievement tracking
          characterAchievements: {}
      };
      
      // Add the character to the list
      this.characters.list[characterId] = character;
      
      // Set as active character
      this.characters.active = characterId;
      
      return character;
  }
  
  /**
   * Get the active character
   * @returns {Object|null} - The active character object or null if none
   */
  getActiveCharacter() {
      if (!this.characters.active || !this.characters.list[this.characters.active]) {
          return null;
      }
      
      return this.characters.list[this.characters.active];
  }
  
  /**
   * Get a stat from the active character
   * @param {string} statId - The ID of the stat to get
   * @returns {Object|null} - The stat object or null if not found
   */
  getStat(statId) {
      const character = this.getActiveCharacter();
      if (!character || !character.stats[statId]) {
          return null;
      }
      
      return character.stats[statId];
  }
  
  /**
   * Update a stat on the active character
   * @param {string} statId - The ID of the stat to update
   * @param {Object} updates - The properties to update
   * @returns {boolean} - Whether the update was successful
   */
  updateStat(statId, updates) {
      const character = this.getActiveCharacter();
      if (!character || !character.stats[statId]) {
          return false;
      }
      
      // Update the stat with the provided values
      Object.assign(character.stats[statId], updates);
      
      return true;
  }
  
  /**
   * Get a currency from the active character
   * @param {string} currencyId - The ID of the currency to get
   * @returns {Object|null} - The currency object or null if not found
   */
  getCurrency(currencyId) {
      const character = this.getActiveCharacter();
      if (!character || !character.currencies[currencyId]) {
          return null;
      }
      
      return character.currencies[currencyId];
  }
  
  /**
   * Update a currency on the active character
   * @param {string} currencyId - The ID of the currency to update
   * @param {Object} updates - The properties to update
   * @returns {boolean} - Whether the update was successful
   */
  updateCurrency(currencyId, updates) {
      const character = this.getActiveCharacter();
      if (!character || !character.currencies[currencyId]) {
          return false;
      }
      
      // Update the currency with the provided values
      Object.assign(character.currencies[currencyId], updates);
      
      return true;
  }
  
  /**
   * Convert the game state to a JSON-friendly format for saving
   * @returns {Object} - The serialized game state
   */
  serialize() {
      // Create a deep copy of the game state to avoid modifying the original
      return JSON.parse(JSON.stringify(this));
  }
  
  /**
   * Restore the game state from a serialized object
   * @param {Object} savedState - The serialized game state
   * @returns {boolean} - Whether the restore was successful
   */
  deserialize(savedState) {
      try {
          // Copy saved properties to this instance
          Object.assign(this, savedState);
          return true;
      } catch (error) {
          console.error('Failed to deserialize game state:', error);
          return false;
      }
  }
}

/*
{
  "version": "1.0.0",                  // Save format version for migration support
  "lastSaved": 1714022400000,          // Timestamp for tracking saves
  "accountSettings": {                  // Account-wide settings
    "audioVolume": 0.7,
    "musicVolume": 0.5,
    // other settings
  },
  "accountProgress": {                  // Account-wide progression
    "maxCharacterSlots": 1,            // Starts at 1, increases with progression
    "hasFoundedGuild": false,          // Unlocks multiple characters
    "guildHall": {                     // Only exists after founding guild
      "level": 1,
      "upgrades": {
        "skillGainMultiplier": 1.0,
        // other guild upgrades
      },
      // other guild hall properties
    },
    "accountWideAchievements": {
      // Achievement tracking
    }
  },
  "world": {                           // Shared world state
    "unlockedRegions": ["startingCity"],
    "worldEvents": {},
    // other world properties
  },
  "characters": {                      // Array of character objects
    "active": "char_12345",            // ID of currently active character
    "list": {                          // Object of character objects by ID
      "char_12345": {
        "id": "char_12345",            // Unique identifier
        "name": "Adventurer",
        "created": 1713936000000,      // Creation timestamp
        "lastPlayed": 1714022400000,   // Last played timestamp
        "offlineTime": 3600000,        // Milliseconds of accumulated offline time
        "class": "waif",
        "stats": {
          "health": {current: 10, max: 10},
          "stamina": {current: 10, max: 10},
          // other stats
        },
        "skills": {
          "survival": {"level": 0, "exp": 0, "maxLevel": 5, "xpToNext": 100},
          // other skills
        },
        "currencies": {
          "gold": {current: 0, max: 10},
          // other currencies
        },
        "actions": {
            "beg": {
              "timesPerformed": 0,
              "currentProgress": 0,
            },
        },
        "quests": {
          // quest progress
        },
        "actionQueue": {
          // current and queued actions
        },
        "home": {
          // home properties and upgrades
        },
        "characterAchievements": {
          // character-specific achievements
        }
        // other character properties
      }
      // additional characters would be added here after unlocking
    }
  }
}
*/