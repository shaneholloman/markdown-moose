// src/extension.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { loadPlugins } from './plugins';
import { SettingsRegistry } from './utils/settings-registry';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    try {
        // Create output channel
        outputChannel = vscode.window.createOutputChannel('Markdown Moose');
        context.subscriptions.push(outputChannel);

        const log = (message: string) => {
            console.log(message);
            outputChannel.appendLine(message);
        };

        log('=== Markdown Moose Extension Activation ===');
        log(`Extension path: ${context.extensionPath}`);
        log(`Extension directory exists: ${fs.existsSync(context.extensionPath)}`);

        const extensionContents = fs.readdirSync(context.extensionPath);
        log(`Extension directory contents: ${JSON.stringify(extensionContents, null, 2)}`);

        const distPath = path.join(context.extensionPath, 'dist');
        log(`Dist path exists: ${fs.existsSync(distPath)}`);
        if (fs.existsSync(distPath)) {
            log(`Dist directory contents: ${JSON.stringify(fs.readdirSync(distPath), null, 2)}`);

            const pluginsPath = path.join(distPath, 'plugins');
            if (fs.existsSync(pluginsPath)) {
                log(`Plugins directory contents: ${JSON.stringify(fs.readdirSync(pluginsPath), null, 2)}`);
            }
        }

        log('Loading plugins...');
        const plugins = loadPlugins(context.extensionPath, outputChannel);
        log('Plugin loading complete');

        if (plugins.length === 0) {
            const error = 'No plugins were loaded!';
            outputChannel.appendLine(`ERROR: ${error}`);
            throw new Error(error);
        }

        log(`Found plugins: ${JSON.stringify(plugins.map(p => ({
            name: p.name,
            version: p.version,
            commands: p.commands.map(c => ({
                id: c.id,
                title: c.title
            }))
        })), null, 2)}`);

        // Register plugin settings first
        const registry = SettingsRegistry.getInstance();
        for (const plugin of plugins) {
            if (plugin.settings) {
                try {
                    registry.registerPluginSettings(plugin.name, plugin.settings);
                    log(`Registered settings for plugin: ${plugin.name} ${JSON.stringify(plugin.settings, null, 2)}`);
                } catch (error) {
                    outputChannel.appendLine(`ERROR: Failed to register settings for plugin ${plugin.name}: ${error}`);
                }
            }
        }

        // Then activate plugins
        for (const plugin of plugins) {
            try {
                log(`Activating plugin: ${plugin.name}`);
                log(`Plugin commands before activation: ${JSON.stringify(plugin.commands, null, 2)}`);
                plugin.activate(context);
                log(`Successfully activated plugin: ${plugin.name} v${plugin.version}`);
                log(`Plugin commands after activation: ${JSON.stringify(plugin.commands, null, 2)}`);
            } catch (error) {
                outputChannel.appendLine(`ERROR: Failed to activate plugin ${plugin.name}: ${error}`);
                outputChannel.appendLine(`ERROR: Plugin state at failure: ${JSON.stringify(plugin, null, 2)}`);
            }
        }
    } catch (error) {
        outputChannel.appendLine(`ERROR: Failed to activate Markdown Moose extension: ${error}`);
        throw error; // Re-throw to ensure VSCode knows activation failed
    }
}

export function deactivate() {
    // Can't access context here, but we can use __dirname since we're just cleaning up
    const plugins = loadPlugins(path.join(__dirname, '..'), outputChannel);
    for (const plugin of plugins) {
        try {
            plugin.deactivate();
        } catch (error) {
            console.error(`Failed to deactivate plugin ${plugin.name}:`, error);
        }
    }

    // Clear settings registry
    SettingsRegistry.getInstance().clear();
}
