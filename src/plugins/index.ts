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

        // Load Table Prettier
        try {
            log('Loading Table Prettier plugin...');
            const TablePrettifyPlugin = require('./tablePrettier').default;
    
            if (isValidPlugin(TablePrettifyPlugin)) {
                log(`Plugin ${TablePrettifyPlugin.name} is valid, adding to list`);
                plugins.push(TablePrettifyPlugin);
            } else {
                const error = 'Invalid TablePrettify ';
                outputChannel?.appendLine(`ERROR: ${error}`);
                log(error);
            }
        } catch (error) {
            const errorMessage = `Failed to load TablePrettify plugin: ${error}`;
            outputChannel?.appendLine(`ERROR: ${errorMessage}`);
            log(errorMessage);
    
            if (error instanceof Error) {
                outputChannel?.appendLine(`Stack trace: ${error.stack}`);
            }
        }

        // Load Excel to MD plugin
        try {
            log('Loading TableExcelToMD plugin...');
            const TableExcelToMDPlugin = require('./tableExcelToMD').default;
    
            if (isValidPlugin(TableExcelToMDPlugin)) {
                log(`Plugin ${TableExcelToMDPlugin.name} is valid, adding to list`);
                plugins.push(TableExcelToMDPlugin);
            } else {
                const error = 'Invalid TableExcelToMD ';
                outputChannel?.appendLine(`ERROR: ${error}`);
                log(error);
            }
        } catch (error) {
            const errorMessage = `Failed to load TableExcelToMD plugin: ${error}`;
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
