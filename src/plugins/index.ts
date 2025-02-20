// src/plugins/index.ts
import * as vscode from 'vscode';
import { Plugin } from '../types';

export function loadPlugins(extensionPath?: string, outputChannel?: vscode.OutputChannel): Plugin[] {
    const log = (message: string) => {
        console.log(message);
        outputChannel?.appendLine(message);
    };

    log('Loading plugins...');
    const plugins: Plugin[] = [];

    // Load image downloader plugin
    try {
        log('Loading image downloader plugin...');
        const imageDownloaderPlugin = require('./imageDownloader').default;

        if (isValidPlugin(imageDownloaderPlugin)) {
            log(`Plugin ${imageDownloaderPlugin.name} is valid, adding to list`);
            plugins.push(imageDownloaderPlugin);
        } else {
            const error = 'Invalid image downloader plugin';
            outputChannel?.appendLine(`ERROR: ${error}`);
            log(error);
        }
    } catch (error) {
        const errorMessage = `Failed to load image downloader plugin: ${error}`;
        outputChannel?.appendLine(`ERROR: ${errorMessage}`);
        log(errorMessage);

        if (error instanceof Error) {
            outputChannel?.appendLine(`Stack trace: ${error.stack}`);
        }
    }

    // Load image alt plugin
    try {
        log('Loading image alt plugin...');
        const imageAltPlugin = require('./imageAlt').default;

        if (isValidPlugin(imageAltPlugin)) {
            log(`Plugin ${imageAltPlugin.name} is valid, adding to list`);
            plugins.push(imageAltPlugin);
        } else {
            const error = 'Invalid image alt plugin';
            outputChannel?.appendLine(`ERROR: ${error}`);
            log(error);
        }
    } catch (error) {
        const errorMessage = `Failed to load image alt plugin: ${error}`;
        outputChannel?.appendLine(`ERROR: ${errorMessage}`);
        log(errorMessage);

        if (error instanceof Error) {
            outputChannel?.appendLine(`Stack trace: ${error.stack}`);
        }
    }

    
    // Load tableGenPlugin
    try {
        log('Loading Table Generator plugin...');
        const tableGenPlugin = require('./tableGenerator').default;

        if (isValidPlugin(tableGenPlugin)) {
            log(`Plugin ${tableGenPlugin.name} is valid, adding to list`);
            plugins.push(tableGenPlugin);
        } else {
            const error = 'Invalid tableGen ';
            outputChannel?.appendLine(`ERROR: ${error}`);
            log(error);
        }
    } catch (error) {
        const errorMessage = `Failed to load tableGen plugin: ${error}`;
        outputChannel?.appendLine(`ERROR: ${errorMessage}`);
        log(errorMessage);

        if (error instanceof Error) {
            outputChannel?.appendLine(`Stack trace: ${error.stack}`);
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
