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
import { PluginSettings } from '../../types/settings';
import { getSetting } from '../../utils/settings-loader';
import { join } from 'path';

export class TablePrettify implements Plugin {
    public name = 'TablePrettify';
    public description = 'Takes in a markdown table selection and formats it nice';
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
        this.prettyTable = this.prettyTable.bind(this);

        this.commands = [
            {
                id: 'markdown-moose.TablePrettify',
                title: 'Prettify Markdown Table',
                execute: this.prettyTable
            }
        ];

        //Add a space margin to a table header line row
        this.settings = {
            headerRowPadSpace: {
                type: 'boolean',
                default: false,
                description: 'Pad hyphenated space by 1 in header seperator row'
            }
        };
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

    
    //load settings value
    const document = editor.document;
    const headerRowPadSpace = await getSetting<boolean>(
        'imageAlt',
        'headerRowPadSpace',
        document,
        false
    );


    // Calculate max column width
    rows.forEach(row => {
        row.forEach((cell, i) => {
            colWidths[i] = Math.max(colWidths[i], cell.length);
        });
    });

    // Build new table string
    const formattedLines = rows.map((row) => {
        // Check if this is a separator row (must contain hyphens)
        const isSeparator = row.some(cell => cell.includes('-')) && 
                           row.every(cell => !cell || /^[-:\s]+$/.test(cell));
        
        var joinCharacter = "|";
        if(headerRowPadSpace) {
            joinCharacter = " | "
        }
        if(true){
        }
        if (isSeparator) {
            // For separator rows, create a cell with dashes that fills the column width
            return row.map((cell, i) => {
                // Preserve alignment colons if present
                const hasLeftColon = cell.startsWith(':');
                const hasRightColon = cell.endsWith(':');
                const dashes = '-'.repeat(colWidths[i]);
                
                if (hasLeftColon && hasRightColon) return `:${dashes}:`;
                if (hasLeftColon) return `:${dashes}`;
                if (hasRightColon) return `${dashes}:`;
                return dashes;
            }).join(joinCharacter);
        } else {
            // Normal row formatting
            return row.map((cell, i) => cell.padEnd(colWidths[i])).join(joinCharacter);
        }
    });
    const table = formattedLines.join('\n');

    // Replace with prettified table
    edit.delete(editor.document.uri, selection);
    edit.insert(editor.document.uri, selection.start, table);

    await vscode.workspace.applyEdit(edit);
    vscode.window.showInformationMessage(`Moose: Formatted Table`);
        
    }
}

export default new TablePrettify();
