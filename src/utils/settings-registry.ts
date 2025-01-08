import * as vscode from 'vscode';
import { PluginSettings, ConfigurationContribution } from '../types/settings';

/**
 * Registry for managing plugin settings contributions
 */
export class SettingsRegistry {
    private static instance: SettingsRegistry;
    private settings: Map<string, PluginSettings> = new Map();

    private constructor() {}

    /**
     * Get the singleton instance of SettingsRegistry
     */
    static getInstance(): SettingsRegistry {
        if (!SettingsRegistry.instance) {
            SettingsRegistry.instance = new SettingsRegistry();
        }
        return SettingsRegistry.instance;
    }

    /**
     * Register settings for a plugin
     * @param pluginName Name of the plugin
     * @param settings Plugin's settings definitions
     */
    registerPluginSettings(pluginName: string, settings: PluginSettings): void {
        // Validate plugin name format
        const normalizedName = pluginName.toLowerCase().replace(/\s+/g, '-');
        this.settings.set(normalizedName, settings);
    }

    /**
     * Generate VSCode configuration contribution for all registered settings
     */
    generatePackageJsonContribution(): ConfigurationContribution {
        const properties: { [key: string]: any } = {};

        for (const [pluginName, settings] of this.settings) {
            for (const [settingKey, definition] of Object.entries(settings)) {
                const fullKey = `moose.${pluginName}.${settingKey}`;
                properties[fullKey] = {
                    type: definition.type,
                    default: definition.default,
                    description: definition.description,
                    ...(definition.enum && { enum: definition.enum }),
                    ...(definition.items && { items: definition.items }),
                    ...(definition.minimum !== undefined && { minimum: definition.minimum }),
                    ...(definition.maximum !== undefined && { maximum: definition.maximum }),
                    ...(definition.pattern && { pattern: definition.pattern })
                };
            }
        }

        return {
            title: 'Markdown Moose',
            properties
        };
    }

    /**
     * Get a specific setting value for a plugin
     * @param pluginName Name of the plugin
     * @param settingKey Setting key to retrieve
     * @param document Optional document for workspace-specific settings
     */
    getSetting<T>(pluginName: string, settingKey: string, document?: vscode.TextDocument): T | undefined {
        const normalizedName = pluginName.toLowerCase().replace(/\s+/g, '-');
        const fullKey = `moose.${normalizedName}.${settingKey}`;
        const config = vscode.workspace.getConfiguration('', document?.uri);
        return config.get<T>(fullKey);
    }

    /**
     * Clear all registered settings (mainly for testing)
     */
    clear(): void {
        this.settings.clear();
    }
}
