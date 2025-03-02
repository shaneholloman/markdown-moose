/**
 * Markdown Moose Table Generator
 *
 * Prompts the user for 2 dimensions and then creates a table 
 *
 * @module TablePrettify
 */

import * as vscode from 'vscode';
import { Plugin, Command } from '../../types';
import { PluginSettings } from '../../types/settings';
// TODO import { XXX, XXX } from './types';
import { getSetting } from '../../utils/settings-loader';

export class TablePrettify implements Plugin {
    public name = 'TablePrettify';
    public description = 'Takes in a markdown table selection and formats it nice';
    public version = '1.0.0';
    public author = 'Max Gernhoefer';
    public commands: Command[];
    // public settings: PluginSettings;
    private outputChannel?: vscode.OutputChannel;

    private log(message: string) {
        console.log(message);
        this.outputChannel?.appendLine(message);
    }

    constructor() {
        this.prettyTable = this.prettyTable.bind(this);

        this.commands = [
            {
                id: 'markdown-moose.TablePrettify',
                title: 'Prettify Markdown Table',
                execute: this.prettyTable
            }
        ];

        //No settings for this plugin
        // this.settings = {
        //     overwriteExisting: {
        //         type: 'boolean',
        //         default: false,
        //         description: 'Whether to overwrite existing alt text'
        //     }
        // };
    }

    public activate(context: vscode.ExtensionContext): void {
        this.outputChannel = vscode.window.createOutputChannel('Markdown Moose');
        context.subscriptions.push(this.outputChannel);

        this.log('Activating Table Prettier plugin...');
        for (const command of this.commands) {
            this.log(`Registering command: ${command.id}`);
            try {
                const disposable = vscode.commands.registerCommand(
                    command.id,
                    command.execute
                );
                context.subscriptions.push(disposable);
                this.log(`Successfully registered command: ${command.id}`);
            } catch (error) {
                const errorMessage = `Failed to register command ${command.id}: ${error}`;
                this.outputChannel?.appendLine(`ERROR: ${errorMessage}`);
                if (error instanceof Error) {
                    this.outputChannel?.appendLine(`Stack trace: ${error.stack}`);
                }
                throw error;
            }
        }
        this.log('Table Prettier plugin activated successfully');
    }

    public deactivate(): void {
        // Cleanup if needed
    }

    /**
     * Main command handler for inserting table
     */
    public async prettyTable(): Promise<void> {
        this.log('prettyTable called');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Moose: No active editor');
            return;
        }
    
        const edit = new vscode.WorkspaceEdit();
    
        //
        // Meat of plugin goes here
        //
    
        //Get user selection (whole table)

        //Format nicely

        //Replace table selected in document with nice table
        const table = ''

        edit.insert(editor.document.uri, editor.selection.active, table);
        await vscode.workspace.applyEdit(edit);
        vscode.window.showInformationMessage(`Moose: Formatted Table`);
        
    }
}

export default new TablePrettify();
