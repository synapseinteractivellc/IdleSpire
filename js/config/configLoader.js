// ./js/config/configLoader.js
// Utility for loading configurations into the game

class ConfigLoader {
    /**
     * Initialize the config loader
     * @param {EventController} eventController - The event controller for notifications
     */
    constructor(eventController) {
        this.eventController = eventController;
    }
    
    /**
     * Load all action configurations into the given action controller
     * @param {ActionController} actionController - The action controller to load actions into
     * @param {Object} actionConfig - The action configuration data
     * @param {Character} character - The character to check requirements against
     */
    loadActions(actionController, actionConfig, character) {
        try {
            console.log('Loading action configurations...');
            
            // Count for logging
            let totalActions = 0;
            let loadedActions = 0;
            
            // Process each category of actions
            for (const category in actionConfig) {
                const actions = actionConfig[category];
                
                for (const actionId in actions) {
                    totalActions++;
                    const actionData = actions[actionId];
                    
                    // For initial load, we don't check requirements for basic actions
                    // They should be available immediately
                    if (category === 'basic') {
                        // Create the action in the controller
                        const action = actionController.createAction(
                            actionData.id,
                            actionData.name,
                            actionData.description,
                            actionData
                        );
                        
                        if (action) {
                            loadedActions++;
                        }
                        continue;
                    }
                    
                    // For non-basic actions, check if we should unlock based on requirements
                    if (character) {
                        if (category === character.class || category === 'tier1') {
                            // For class-specific actions, add them to the controller but unlocked=false
                            // Set initial unlock state based on whether requirements are met
                            const requirementsMet = this.checkRequirements(character, actionData.requirements);
                            
                            // Clone the action data and modify the unlocked status
                            const modifiedActionData = { ...actionData };
                            modifiedActionData.unlocked = requirementsMet;
                            
                            // Log for debugging
                            console.log(`Adding action ${actionId} (unlocked: ${requirementsMet})`);
                            if (!requirementsMet && actionData.requirements?.skills) {
                                console.log(`Required skills for ${actionId}:`, actionData.requirements.skills);
                                for (const skillId in actionData.requirements.skills) {
                                    const requiredLevel = actionData.requirements.skills[skillId];
                                    const currentLevel = character.skills?.[skillId]?.currentLevel || 0;
                                    console.log(`- ${skillId}: required ${requiredLevel}, current ${currentLevel}`);
                                }
                            }
                            
                            // Create the action in the controller
                            const action = actionController.createAction(
                                modifiedActionData.id,
                                modifiedActionData.name,
                                modifiedActionData.description,
                                modifiedActionData
                            );
                            
                            if (action) {
                                loadedActions++;
                            }
                        }
                    }
                }
            }
            
            console.log(`Loaded ${loadedActions} of ${totalActions} actions`);
            
            // If there's a rest action, set it
            if (actionController.actions['rest_abandoned']) {
                actionController.restAction = actionController.actions['rest_abandoned'];
            }
            
            return true;
        } catch (error) {
            console.error('Failed to load action configurations:', error);
            return false;
        }
    }
    
    /**
     * Check if requirements are met
     * @param {Character} character - The character to check against
     * @param {Object} requirements - The requirements object
     * @returns {boolean} - Whether all requirements are met
     */
    checkRequirements(character, requirements) {
        if (!requirements) return true; // No requirements means they're met
        
        // Check skill requirements
        if (requirements.skills) {
            for (const skillId in requirements.skills) {
                const requiredLevel = requirements.skills[skillId];
                // Get skill level from character - we need to look at the structure carefully
                let currentLevel = 0;
                
                // Check if the skill exists
                if (character.skills && character.skills[skillId]) {
                    // Look for currentLevel or level property
                    if (character.skills[skillId].currentLevel !== undefined) {
                        currentLevel = character.skills[skillId].currentLevel;
                    } else if (character.skills[skillId].level !== undefined) {
                        currentLevel = character.skills[skillId].level;
                    }
                }
                
                console.log(`Checking skill ${skillId}: required ${requiredLevel}, current ${currentLevel}`);
                
                if (currentLevel < requiredLevel) {
                    return false;
                }
            }
        }
        
        // Check class requirements
        if (requirements.classes && requirements.classes.length > 0) {
            if (!requirements.classes.includes(character.class.toLowerCase())) {
                return false;
            }
        }
        
        // Check action completion requirements
        if (requirements.actions) {
            for (const actionId in requirements.actions) {
                const requiredCompletions = requirements.actions[actionId];
                const currentCompletions = character.actions?.[actionId]?.completionCount || 0;
                
                if (currentCompletions < requiredCompletions) {
                    return false;
                }
            }
        }
        
        // All requirements passed
        return true;
    }
}