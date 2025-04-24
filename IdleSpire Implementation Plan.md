# IdleSpire Implementation Plan

## Project Overview
IdleSpire is a 2D fantasy idle/clicker RPG where players progress through six tiers as warriors, mages, or crafters. The game features automated advancement, strategic choices, and an expanding world. Players begin in a single city and unlock new regions as they advance.

## Architecture
The game follows an MVC (Model-View-Controller) architecture:
- **Models**: Data structures representing game entities (Character, Currency, Resource, Skill, etc.)
- **Views**: UI components for displaying game state
- **Controllers**: Logic for handling game mechanics and connecting models with views

## Implementation Phases

## Phase 1: Core Infrastructure (Week 1)

#### 1.1 Event System
- [X] Implement `EventController` for pub/sub communication between components
- [X] Test event emission and subscription
- [X] Implement event debugging/monitoring via `TestEventController`

#### 1.2 Game State Management
- [X] Complete `GameState` class to hold all game data
- [X] Implement game state initialization for new players
- [X] Set up game state update mechanisms

#### 1.3 Save/Load System
- [X] Implement `SaveController` to persist game state to localStorage
- [X] Add auto-save functionality
- [X] Implement offline progress calculations
- [ ] Implement save migration system for future updates

#### 1.4 Basic UI Framework
- [X] Set up UI navigation between different game screens
- [X] Implement welcome screen and character creation UI
- [X] Create main game UI shell with panels for:
  - [X] Currency display
  - [X] Stats display
  - [X] Action log
  - [X] Main content area

## Phase 2: Core Game Systems (Week 2)

#### 2.1 Resource System
- [X] Complete `Resource` base class with properties for value, max, gain rate
- [X] Implement `Currency` class extending Resource
- [X] Implement `Stat` class extending Resource
- [X] Set up UI binding for resources
- [X] Implement resource modifiers system
- [X] Create `ResourceController` for managing resources

#### 2.2 Character System
- [~] Implement `Character` class (placeholder created, needs implementation)
- [~] Implement `CharacterController` (placeholder created, needs implementation)
- [X] Create character creation and initialization process

#### 2.3 Game Loop
- [X] Implement main game tick system
- [X] Create resource accumulation logic
- [X] Set up offline progression calculation

#### 2.4 Action System
- [~] Implement `Action` class (placeholder created, needs implementation)
- [~] Implement `ActionController` (placeholder created, needs implementation)
- [ ] Create UI for selecting and performing actions

## Phase 3: Game Content (Week 3)

#### 3.1 Basic Skills
- [~] Implement `Skill` class (placeholder created, needs implementation)
- [~] Implement `SkillController` (placeholder created, needs implementation)
- [ ] Create initial set of skills for each class path

#### 3.2 Basic Actions
- [ ] Create tier 1 actions for resource gathering
- [ ] Implement action prerequisites and unlocking logic
- [ ] Set up action rewards and skill experience gains

#### 3.3 Progression System
- [ ] Implement tier advancement system
- [ ] Create unlock conditions for new actions and areas
- [ ] Set up progression indicators in UI

#### 3.4 Upgrades
- [~] Implement `Upgrade` class (placeholder created, needs implementation)
- [~] Implement `UpgradeController` (placeholder created, needs implementation)
- [ ] Create initial set of upgrades for each resource type

## Phase 4: Enhancements and Polish (Week 4)

#### 4.1 Home System
- [~] Implement `Home` class (placeholder created, needs implementation)
- [~] Implement `HomeController` (placeholder created, needs implementation)
- [ ] Create home upgrade UI

#### 4.2 UI Refinements
- [X] Implement status indicators and tooltips
- [ ] Add animations for actions and rewards
- [X] Create progress notifications

#### 4.3 Balance and Tuning
- [ ] Balance resource gain rates
- [ ] Tune skill progression curves
- [ ] Adjust action completion times

#### 4.4 Testing and Bug Fixes
- [X] Implement testing framework (TestEventController)
- [ ] Perform cross-browser testing
- [ ] Fix identified bugs
- [ ] Optimize performance

## Current Next Steps
Based on the implementation plan and the current state, the next priorities appear to be:

1. Complete the `Character` and `CharacterController` implementations
2. Implement the `Action` and `ActionController` classes
3. Create the action selection and performance UI
4. Implement the `Skill` and `SkillController` classes
5. Create initial set of skills and actions

## Detailed Implementation Tasks

### Event System Implementation
1. Verify the existing `EventController` implementation
2. Create standard event types (resource updates, unlocks, etc.)
3. Implement event debugging/monitoring

### Game State Management
1. Define the complete game state structure
2. Implement methods for accessing and modifying game state
3. Add validation to prevent invalid state changes

### Character System
1. Implement character class selection
2. Create starting profiles for different character types
3. Set up character progression tracking

### Resource System
1. Implement base resource gain calculation
2. Create modifier system for resource gain rates
3. Set up resource caps and overflow handling

### Action System
1. Create action queue system
2. Implement parallel actions when applicable
3. Add action cancellation and priority

### Progression System
1. Define requirements for each progression tier
2. Create unlock triggers for new content
3. Implement progression rewards

## Technology Stack
- Vanilla JavaScript for game logic
- HTML5 and CSS3 for UI
- LocalStorage for game save persistence
- GitHub Pages for deployment

## Development Guidelines
1. Focus on completing one system at a time before moving to the next
2. Use event-driven communication between components
3. Maintain separation of concerns with strict MVC boundaries
4. Write clean, documented code with appropriate comments
5. Test each component in isolation before integration

## Initial Milestone: Playable MVP
The minimum viable product should include:
- Character creation
- Basic resource accumulation
- Simple actions that can be performed
- Resource spending on basic upgrades
- Save/load functionality
- Tier 1 progression

This MVP should be achieved by the end of Phase 2 implementation.