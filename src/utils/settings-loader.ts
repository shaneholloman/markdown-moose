import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Gets a setting value respecting the configuration hierarchy:
 * 1. .moose config file (highest priority)
 * 2. VSCode workspace/user settings
 * 3. Default value
 */
export async function getSetting<T>(
    pluginName: string,
    settingKey: string,
    document: vscode.TextDocument,
    defaultValue: T
): Promise<T> {
    // Try .moose config first
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (workspaceFolder) {
        try {
            const mooseConfigPath = path.join(workspaceFolder.uri.fsPath, '.moose');
            const content = await fs.readFile(mooseConfigPath, 'utf8');
            const mooseConfig = JSON.parse(content);

            if (mooseConfig?.[pluginName]?.[settingKey] !== undefined) {
                console.log(`Using ${settingKey} from .moose config:`, mooseConfig[pluginName][settingKey]);
                return mooseConfig[pluginName][settingKey];
            }
        } catch (e) {
            // .moose file doesn't exist or is invalid, which is fine
            console.log('No valid .moose config found, falling back to VSCode settings');
        }
    }

    // Try VSCode settings next
    const config = vscode.workspace.getConfiguration('moose', document.uri);
    const value = config.get<T>(`${pluginName}.${settingKey}`);

    if (value !== undefined) {
        console.log(`Using ${settingKey} from VSCode settings:`, value);
        return value;
    }

    // Use default value as last resort
    console.log(`Using default value for ${settingKey}:`, defaultValue);
    return defaultValue;
}
