// ./js/controllers/saveController.js
// The controller interface for saves

class SaveController {
    
}

/*
// Save game data
function saveGame(gameState) {
  // Add timestamp to track when the save was created
  gameState.lastSaved = Date.now();
  
  try {
    // Convert to JSON string and save to localStorage
    localStorage.setItem('idleSpireGameSave', JSON.stringify(gameState));
    return true;
  } catch (error) {
    console.error('Failed to save game:', error);
    return false;
  }
}

// Load game data
function loadGame() {
  try {
    const savedGame = localStorage.getItem('idleSpireGameSave');
    if (!savedGame) {
      return null; // No save found
    }
    
    const parsedSave = JSON.parse(savedGame);
    
    // Version check for migrations
    if (parsedSave.version !== CURRENT_SAVE_VERSION) {
      return migrateSave(parsedSave);
    }
    
    return parsedSave;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
}

*/