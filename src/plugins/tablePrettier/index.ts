/**
 * Markdown Moose Table Generator
 *
 * Prompts the user for 2 dimensions and then creates a table 
 *
 * @module TablePrettify
 */


///TODO
//
// Make the table hyphens go across the whole column
//
// Like |---------|
// not  | ---     |





import * as vscode from 'vscode';
import { Plugin, Command } from '../../types';

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
    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);
    if (!selectedText.trim()) {
        vscode.window.showErrorMessage('No table selected');
        return;
    }

    const lines = selectedText.split('\n').filter(line => line.includes('|'));
    if (!lines.length) {
        vscode.window.showErrorMessage('No table found in selection');
        return;
    }
    
    // Parse rows and columns
    const rows = lines.map(line => line.split('|').map(cell => cell.trim()));
    const colCount = Math.max(...rows.map(row => row.length));
    const colWidths = new Array(colCount).fill(0);

    // Calculate max column width
    rows.forEach(row => {
        row.forEach((cell, i) => {
            colWidths[i] = Math.max(colWidths[i], cell.length);
        });
    });

    // Build new table string
    const formattedLines = rows.map(row =>
        row.map((cell, i) => cell.padEnd(colWidths[i])).join(' | ')
    );
    const table = formattedLines.join('\n');

    // Replace with prettified table
    edit.delete(editor.document.uri, selection);
    edit.insert(editor.document.uri, selection.start, table);

    await vscode.workspace.applyEdit(edit);
    vscode.window.showInformationMessage(`Moose: Formatted Table`);
        
    }
}

export default new TablePrettify();
