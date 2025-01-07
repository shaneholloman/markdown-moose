// src/extension.ts
import * as vscode from 'vscode';
import { loadPlugins } from './plugins';

export function activate(context: vscode.ExtensionContext) {
    console.log('Activating markdown-moose extension');
    const plugins = loadPlugins();
    console.log('Loaded plugins:', plugins.map(p => p.name));

    for (const plugin of plugins) {
        try {
            plugin.activate(context);
            console.log(`Loaded plugin: ${plugin.name} v${plugin.version}`);
        } catch (error) {
            console.error(`Failed to activate plugin ${plugin.name}:`, error);
        }
    }
}

export function deactivate() {
    const plugins = loadPlugins();
    for (const plugin of plugins) {
        try {
            plugin.deactivate();
        } catch (error) {
            console.error(`Failed to deactivate plugin ${plugin.name}:`, error);
        }
    }
}
