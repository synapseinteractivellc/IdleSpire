// ./js/models/gameState.js
// The model for the gameState object in the game

class GameState {
    
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