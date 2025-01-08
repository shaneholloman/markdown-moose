/**
 * Plugin settings type definitions
 */

export interface PluginSettingDefinition {
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

export interface PluginSettings {
    [key: string]: PluginSettingDefinition;
}

// Type for VSCode configuration contribution
export interface ConfigurationContribution {
    title: string;
    properties: {
        [key: string]: {
            type: string;
            default: any;
            description: string;
            enum?: string[];
            items?: {
                type: string;
            };
            minimum?: number;
            maximum?: number;
            pattern?: string;
        };
    };
}
