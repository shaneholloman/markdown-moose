/**
 * Markdown Moose Table Generator
 *
 * Prompts the user for 2 dimensions and then creates a table 
 *
 * @module TableGen
 */

import * as vscode from 'vscode';
import { Plugin, Command } from '../../types';
import { PluginSettings } from '../../types/settings';
// TODO import { XXX, XXX } from './types';
import { getSetting } from '../../utils/settings-loader';

export class TableGen implements Plugin {
    public name = 'TableGen';
    public description = 'Inserts a markdown table at the cursor based on user input';
    public version = '1.0.0';
    public author = 'Max Gernhoefer';
    public commands: Command[];
    public settings: PluginSettings;
    private outputChannel?: vscode.OutputChannel;

    private log(message: string) {
        console.log(message);
        this.outputChannel?.appendLine(message);
    }

    constructor() {
        this.insertTable = this.insertTable.bind(this);

        this.commands = [
            {
                id: 'markdown-moose.insertTable',
                title: 'Insert Markdown Table',
                execute: this.insertTable
            }
        ];

        this.settings = {
            overwriteExisting: {
                type: 'boolean',
                default: false,
                description: 'Whether to overwrite existing alt text'
            }
        };
    }

    public activate(context: vscode.ExtensionContext): void {
        this.outputChannel = vscode.window.createOutputChannel('Markdown Moose');
        context.subscriptions.push(this.outputChannel);

        this.log('Activating Table Generator plugin...');
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
        this.log('Table Generator plugin activated successfully');
    }

    public deactivate(): void {
        // Cleanup if needed
    }

    /**
     * Main command handler for updating image alt text
     */
    public async insertTable(): Promise<void> {
        this.log('insertTable called');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Moose: No active editor');
            return;
        }

        const edit = new vscode.WorkspaceEdit();
        let x = 0;
        let y = 0;

        if (x + y > 0) {
            await vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage('Moose: Inserted table '+x+'X'+y+'.');
        } else {
            vscode.window.showInformationMessage('Moose: No dimensions given');
        }
    }
}

export default new TableGen();
