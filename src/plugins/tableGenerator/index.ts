/**
 * Markdown Moose Table Generator
 *
 * Prompts the user for 2 dimensions and then creates a table 
 *
 * @module TableGen
 */

import * as vscode from 'vscode';
import { Plugin, Command } from '../../types';

export class TableGen implements Plugin {
    public name = 'TableGen';
    public description = 'Inserts a markdown table at the cursor based on user input';
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
        this.insertTable = this.insertTable.bind(this);

        this.commands = [
            {
                id: 'markdown-moose.insertTable',
                title: 'Insert Markdown Table',
                execute: this.insertTable
            }
        ];

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
     * Main command handler for inserting table
     * Great reference for tables here:
     * https://www.codecademy.com/resources/docs/markdown/tables
     * 
     */
    public async insertTable(): Promise<void> {
        this.log('insertTable called');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Moose: No active editor');
            return;
        }
    
        const edit = new vscode.WorkspaceEdit();
    
        // Prompt the user for X x Y dimensions for the new table
        const xInput = await vscode.window.showInputBox({
            prompt: 'Enter the number of columns for the table',
            validateInput: (value) => {
                return isNaN(Number(value)) || Number(value) <= 0 ? 'Please enter a valid number greater than 0' : null;
            }
        });
    
        const yInput = await vscode.window.showInputBox({
            prompt: 'Enter the number of rows for the table',
            validateInput: (value) => {
                return isNaN(Number(value)) || Number(value) <= 0 ? 'Please enter a valid number greater than 0' : null;
            }
        });
    
        const x = xInput ? parseInt(xInput, 10) : 0;
        const y = yInput ? parseInt(yInput, 10) : 0;
    
        if (x > 0 && y > 0) {
            // Generate the table markdown
            let table = '';
            table += '| ' + '   |'.repeat(x) + '\n';
            table += '| ' + '---|'.repeat(x) + '\n';
            for (let i = 0; i < y; i++) {
                table += '| ' + '   |'.repeat(x) + '\n';
            }
    
            // Insert the table at the current cursor position
            edit.insert(editor.document.uri, editor.selection.active, table);
            await vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage(`Moose: Inserted table ${x}x${y}.`);
        } else {
            vscode.window.showInformationMessage('Moose: No dimensions given');
        }
    }
}

export default new TableGen();
