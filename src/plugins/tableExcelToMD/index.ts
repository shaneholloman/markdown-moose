/**
 * Markdown Moose Table Generator
 *
 * Prompts the user for 2 dimensions and then creates a table 
 *
 * @module TableExcelToMD
 */

import * as vscode from 'vscode';
import { Plugin, Command } from '../../types';

export class TableExcelToMD implements Plugin {
    public name = 'TableExcelToMD';
    public description = 'Takes in an excel pasted (Tab delimited) table selection and converts to Markdown';
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
        this.excelToMD = this.excelToMD.bind(this);

        this.commands = [
            {
                id: 'markdown-moose.TableExcelToMD',
                title: 'Convert Excel/Tab delimited table to Markdown',
                execute: this.excelToMD
            }
        ];

        
    }

    public activate(context: vscode.ExtensionContext): void {
        this.outputChannel = vscode.window.createOutputChannel('Markdown Moose');
        context.subscriptions.push(this.outputChannel);

        this.log('Activating TableExcelToMD plugin...');
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
        this.log('TableExcelToMD plugin activated successfully');
    }

    public deactivate(): void {
        // Cleanup if needed
    }

    /**
     * Main command handler for inserting table
     */
    public async excelToMD(): Promise<void> {
        this.log('excelToMD called');
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
    // Read excel format table line by line
    const lines = selectedText.trim().split('\n');
    const rows = lines.map(line => line.split('\t'));

    let table = '';
    rows.forEach((row, i) => {
        table += `| ${row.join(' | ')} |\n`;
        if (i === 0) {
            table += `| ${row.map(() => '---').join(' | ')} |\n`;
        }
    });
    
    // Replace with Markdown table
    edit.delete(editor.document.uri, selection);
    edit.insert(editor.document.uri, selection.start, table);

    await vscode.workspace.applyEdit(edit);
    vscode.window.showInformationMessage(`Moose: Formatted Table`);
        
    }
}

export default new TableExcelToMD();
