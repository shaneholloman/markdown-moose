# Plugin Settings Contribution Refactor Plan

## Overview

Currently, plugin settings are hardcoded in package.json. We need to allow plugins to dynamically contribute their settings to the extension's configuration system.

## Current Structure

```typescript
// Current Plugin interface
interface Plugin {
    name: string;
    description: string;
    version: string;
    author?: string;
    commands: Command[];
    activate: (context: vscode.ExtensionContext) => void;
    deactivate: () => void;
}
```

## Planned Changes

### 1. Update Plugin Interface

```typescript
interface PluginSettingDefinition {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    default: any;
    description: string;
    enum?: string[];        // For dropdown options
    items?: {              // For array types
        type: string;
    };
    minimum?: number;      // For number types
    maximum?: number;
    pattern?: string;      // For string validation
}

interface PluginSettings {
    [key: string]: PluginSettingDefinition;
}

interface Plugin {
    name: string;
    description: string;
    version: string;
    author?: string;
    commands: Command[];
    settings?: PluginSettings;  // New field
    activate: (context: vscode.ExtensionContext) => void;
    deactivate: () => void;
}
```

### 2. Create Settings Registry

```typescript
// src/utils/settings-registry.ts
class SettingsRegistry {
    private static instance: SettingsRegistry;
    private settings: Map<string, PluginSettings> = new Map();

    static getInstance(): SettingsRegistry {
        if (!SettingsRegistry.instance) {
            SettingsRegistry.instance = new SettingsRegistry();
        }
        return SettingsRegistry.instance;
    }

    registerPluginSettings(pluginName: string, settings: PluginSettings): void {
        this.settings.set(pluginName, settings);
    }

    generatePackageJsonContribution(): any {
        // Generate VSCode configuration contribution
    }
}
```

### 3. Modify Extension Loading

1. Update extension.ts to collect settings during plugin loading:

    ```typescript
    export function activate(context: vscode.ExtensionContext) {
        const plugins = loadPlugins();
        const registry = SettingsRegistry.getInstance();

        for (const plugin of plugins) {
            if (plugin.settings) {
                registry.registerPluginSettings(plugin.name, plugin.settings);
            }
            plugin.activate(context);
        }
    }
    ```

2. Create settings utility for plugins:

    ```typescript
    // src/utils/plugin-settings.ts
    export function getPluginSetting<T>(
        context: vscode.ExtensionContext,
        pluginName: string,
        settingKey: string
    ): T {
        const fullKey = `moose.${pluginName}.${settingKey}`;
        return vscode.workspace.getConfiguration().get<T>(fullKey);
    }
    ```

### 4. Update Image Downloader Plugin

    ```typescript
    export class ImageDownloader implements Plugin {
        public settings: PluginSettings = {
            path: {
                type: 'string',
                default: './img',
                description: 'Default path for downloaded images (relative to markdown file)'
            }
            // Add more settings as needed
        };

        // Update settings usage in downloadImages method
        public async downloadImages(): Promise<void> {
            const configuredPath = getPluginSetting<string>(
                this.context,
                'imageDownloader',
                'path'
            );
            // ... rest of the method
        }
    }
    ```

## Implementation Steps

1. Create New Files:
   - src/utils/settings-registry.ts
   - src/utils/plugin-settings.ts
   - src/types/settings.ts (for interfaces)

2. Update Existing Files:
   - src/types/index.ts (add settings interfaces)
   - src/extension.ts (add settings registration)
   - src/plugins/imageDownloader/index.ts (migrate to new system)

3. Testing Requirements:
   - Settings registration works
   - VSCode recognizes contributed settings
   - Settings are accessible to plugins
   - .moose config still overrides VSCode settings
   - Settings validation works
   - Default values work

## Considerations

1. Backward Compatibility:
   - Maintain support for existing .moose config
   - Handle migration of existing user settings

2. Performance:
   - Settings registration happens once at activation
   - Cache setting values where appropriate

3. Error Handling:
   - Validate setting definitions
   - Handle missing or invalid settings gracefully
   - Provide clear error messages

4. Documentation Updates Needed:
   - Update DEVELOPMENT.md with settings contribution guide
   - Update README.md with new configuration options
   - Add JSDoc comments to new utilities

## Future Enhancements

1. Settings Validation:
   - Add custom validation functions
   - Support complex setting types
   - Add setting dependencies

2. UI Integration:
   - Custom setting editors
   - Setting quick picks
   - Setting previews

3. Settings Migration:
   - Version tracking for settings
   - Migration helpers for breaking changes

## Notes

- Keep settings simple initially
- Focus on type safety
- Maintain clear separation between core and plugin settings
- Consider adding setting change events
- Plan for i18n of setting descriptions
