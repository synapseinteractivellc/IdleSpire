// ./js/config/actions.js
// Configuration file for all game actions

const ActionConfig = {
    // Basic actions available to all classes
    basic: {
        // Beggar action
        beg: {
            id: 'beg',
            name: 'Beg',
            description: 'Beg for coins in the street.',
            type: 'action',
            baseDuration: 4000, // 4 seconds
            unlocked: true,
            autoRestart: true,
            statCosts: {
                'stamina': 0.5 // 0.5 stamina per second
            },
            currencyRewards: {
                'gold': 5
            },
            skillExperience: {
                'survival': 100
            },
            randomRewards: [
                {
                    chance: 10, // 10% chance
                    reward: {
                        currencies: { 'gold': 4 }
                    },
                    message: 'A kind noble gives you extra coins!'
                }
            ],
            messages: {
                start: 'You begin begging for coins...',
                progress: 'You continue begging for coins...',
                complete: 'You received some coins from begging.',
                cancel: 'You stop begging.',
                fail: 'You\'re too tired to continue begging.'
            },
            requirements: {
                // No requirements for this action
            }
        },
        
        // Rest action
        rest_abandoned: {
            id: 'rest_abandoned',
            name: 'Rest in Abandoned Building',
            description: 'Find shelter and rest in an abandoned building.',
            type: 'action',
            baseDuration: 5000, // 5 seconds
            unlocked: true,
            autoRestart: false,
            isRestAction: true,
            progressRewards: {
                "20": {
                    stats: {
                        'health': 0.5,
                        'stamina': 1
                    }
                },
                "40": {
                    stats: {
                        'health': 0.5,
                        'stamina': 1
                    }
                },
                "60": {
                    stats: {
                        'health': 0.5,
                        'stamina': 1
                    }
                },
                "80": {
                    stats: {
                        'health': 0.5,
                        'stamina': 1
                    }
                },
                "99": {
                    stats: {
                        'health': 0.5,
                        'stamina': 1
                    }
                }
            },
            messages: {
                start: 'You find an abandoned building to rest in...',
                progress: 'You continue resting...',
                complete: 'You feel somewhat refreshed.',
                cancel: 'You stop resting.',
                fail: 'You were unable to rest.'
            },
            requirements: {
                // No requirements for this action
            }
        }
    },
    
    // Waif class-specific actions
    waif: {
        pickpocket: {
            id: 'pickpocket',
            name: 'Pickpocket',
            description: 'Steal small items from passers-by.',
            type: 'action',
            baseDuration: 6000, // 6 seconds
            unlocked: false,
            autoRestart: true,
            statCosts: {
                'stamina': 0.8 // 0.8 stamina per second
            },
            currencyRewards: {
                'gold': 10
            },
            skillExperience: {
                'stealth': 150
            },
            randomRewards: [
                {
                    chance: 5, // 5% chance
                    reward: {
                        currencies: { 'gold': 15 }
                    },
                    message: 'You find a wealthy merchant and make off with extra coins!'
                }
            ],
            messages: {
                start: 'You begin looking for a mark to pickpocket...',
                progress: 'You stalk your target carefully...',
                complete: 'Success! You steal some coins without being noticed.',
                cancel: 'You abort the pickpocketing attempt.',
                fail: 'You\'re too tired to focus on pickpocketing.'
            },
            requirements: {
                skills: {
                    'stealth': 3
                }
            }
        }
    },
    
    // Vagabond class-specific actions
    vagabond: {
        scavenge: {
            id: 'scavenge',
            name: 'Scavenge',
            description: 'Search through refuse for useful items.',
            type: 'action',
            baseDuration: 8000, // 8 seconds
            unlocked: false,
            autoRestart: true,
            statCosts: {
                'stamina': 0.6 // 0.6 stamina per second
            },
            currencyRewards: {
                'gold': 8
            },
            skillExperience: {
                'survival': 150
            },
            randomRewards: [
                {
                    chance: 10, // 10% chance
                    reward: {
                        currencies: { 'gold': 8 }
                    },
                    message: 'You find something valuable among the refuse!'
                }
            ],
            messages: {
                start: 'You begin searching through discarded items...',
                progress: 'You continue digging through the refuse...',
                complete: 'You found some useful items!',
                cancel: 'You stop scavenging.',
                fail: 'You\'re too tired to continue scavenging.'
            },
            requirements: {
                skills: {
                    'survival': 2
                }
            }
        }
    },
    
    // Tier 1 actions (unlocked after reaching certain progression)
    tier1: {
        forage: {
            id: 'forage',
            name: 'Forage for Food',
            description: 'Search the area for edible plants and berries.',
            type: 'action',
            baseDuration: 10000, // 10 seconds
            unlocked: false,
            autoRestart: true,
            statCosts: {
                'stamina': 0.7 // 0.7 stamina per second
            },
            currencyRewards: {
                'gold': 8
            },
            statRewards: {
                'health': 2
            },
            skillExperience: {
                'survival': 200
            },
            randomRewards: [
                {
                    chance: 8, // 8% chance
                    reward: {
                        stats: { 'health': 5 }
                    },
                    message: 'You found some particularly nutritious herbs!'
                }
            ],
            messages: {
                start: 'You begin searching for edible plants...',
                progress: 'You continue foraging...',
                complete: 'You gathered some edible plants.',
                cancel: 'You stop foraging.',
                fail: 'You\'re too tired to continue foraging.'
            },
            requirements: {
                skills: {
                    'survival': 5
                }
            }
        }
    }
};