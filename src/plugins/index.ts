// src/plugins/index.ts
import * as fs from 'fs';
import * as path from 'path';
import { Plugin } from '../types';

export function loadPlugins(): Plugin[] {
    const pluginsDir = path.join(__dirname);
    const items = fs.readdirSync(pluginsDir);
    const plugins: Plugin[] = [];

    for (const item of items) {
        if (item === 'index.ts' || item === 'index.js') continue;

        const pluginDir = path.join(pluginsDir, item);
        if (fs.statSync(pluginDir).isDirectory()) {
            try {
                const plugin = require(path.join(pluginDir, 'index')).default;
                if (isValidPlugin(plugin)) {
                    plugins.push(plugin);
                }
            } catch (error) {
                console.error(`Failed to load plugin from ${pluginDir}:`, error);
            }
        }
    }

    return plugins;
}

function isValidPlugin(plugin: any): plugin is Plugin {
    return (
        plugin &&
        typeof plugin.name === 'string' &&
        typeof plugin.description === 'string' &&
        typeof plugin.version === 'string' &&
        Array.isArray(plugin.commands) &&
        typeof plugin.activate === 'function' &&
        typeof plugin.deactivate === 'function'
    );
}