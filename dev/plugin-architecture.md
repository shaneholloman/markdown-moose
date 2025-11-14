# Plugin Architecture Evolution

## Current State

The extension currently bundles all plugins into a single `extension.js` file:

```tree
markdown-moose-0.3.4.vsix
└─ extension/
   └─ dist/
      └─ extension.js (314.76 KB)
```

Plugins are loaded at startup via `require()` in `loadPlugins()`, which means:

- All plugin code is included in the main bundle
- Bundle size grows with each new plugin
- All plugins load whether used or not

## Proposed Architecture

Transform the extension into a true plugin host:

### Core Extension

- Plugin loader system
- Plugin API and interfaces
- Utility functions
- Type definitions
- Settings management
- Plugin discovery/registry

### Modular Plugins

- Each plugin as separate npm package
- Dynamic loading via import()
- Independent versioning
- Self-contained dependencies
- Loaded only when activated

### Structure Example

```tree
markdown-moose/
├─ core/
│  ├─ plugin-loader.ts
│  ├─ plugin-api.ts
│  ├─ utilities/
│  └─ types/
├─ plugins/
│  ├─ @markdown-moose/table-tools/
│  ├─ @markdown-moose/link-manager/
│  └─ @markdown-moose/image-tools/
└─ extension.ts
```

## Benefits

1. Development

    - Easier plugin development
    - Independent testing
    - Faster build times
    - Clear separation of concerns
    - Better debugging

2. Performance

    - Smaller initial bundle
    - On-demand plugin loading
    - Reduced memory footprint
    - Faster startup time

3. Extensibility

    - Community plugin development
    - Plugin marketplace potential
    - Independent plugin updates
    - Better dependency management

## Implementation Steps

1. Core Refactoring

    - Create plugin host infrastructure
    - Define stable plugin API
    - Implement dynamic loading
    - Setup plugin registry

2. Plugin Migration

    - Convert existing plugins to packages
    - Implement lazy loading
    - Add plugin metadata
    - Create plugin templates

3. Package Management

    - Setup plugin namespace (@markdown-moose)
    - Define package structure
    - Create plugin publishing process
    - Version management strategy

4. Documentation

    - Plugin development guide
    - API documentation
    - Best practices
    - Migration guide

## Considerations

1. VSCode Extension Guidelines

    - Maintain single entry point
    - Handle activation events
    - Manage extension context
    - Resource cleanup

2. Performance

    - Plugin load time
    - Memory management
    - Dependency sharing
    - Bundle optimization

3. User Experience

    - Plugin discovery
    - Installation process
    - Settings management
    - Error handling

4. Development Experience

    - Plugin scaffolding
    - Testing framework
    - Debug tooling
    - Hot reload support

## Next Steps

1. Prototype

    - Create minimal plugin host
    - Convert one plugin to package
    - Test dynamic loading
    - Measure performance

2. Infrastructure

    - Setup plugin registry
    - Create development tools
    - Define package standards
    - Setup CI/CD

3. Documentation

    - Architecture guidelines
    - Plugin development guide
    - API documentation
    - Best practices

4. Migration

    - Plan staged migration
    - Convert existing plugins
    - Test compatibility
    - Performance testing

## Plugin Lifecycle

### Activation Events

- On specific commands
- On language detection (markdown)
- On workspace contains
- On custom conditions
- On configuration changes

### Loading Sequence

1. Extension Startup
    - Core loads minimal plugin registry
    - Plugin metadata available
    - No plugin code loaded yet

2. Plugin Discovery
    - Scan for installed plugins
    - Read plugin manifests
    - Register commands/capabilities
    - Still no plugin code loaded

3. Dynamic Loading
    - Plugin loaded when activation event triggers
    - Import() fetches plugin package
    - Plugin initializes and registers
    - Resources released when plugin deactivates

4. Error Handling
    - Failed plugin load doesn't affect others
    - Graceful degradation
    - User notification
    - Automatic retry options

### Plugin States

- Discovered: Plugin known but not loaded
- Loading: Import in progress
- Active: Plugin running
- Error: Failed to load/initialize
- Deactivated: Cleanup complete

## Plugin Communication

### Event System

- Core event bus for plugin communication
- Plugin-to-plugin events
- Plugin-to-core events
- Event filtering and prioritization
- Async event handling

### Shared Services

1. Core Services
    - Settings management
    - File system operations
    - Workspace utilities
    - Command registration
    - Status bar items

2. Plugin Services
    - Register shared capabilities
    - Service discovery
    - Version compatibility
    - Service lifecycle management

### Data Sharing

1. Plugin Data
    - Isolated storage per plugin
    - Shared data spaces
    - Data access controls
    - Change notifications

2. State Management
    - Plugin state persistence
    - Workspace state
    - Global state
    - State synchronization

3. Resource Sharing
    - Shared UI components
    - Common utilities
    - Resource pooling
    - Reference counting
