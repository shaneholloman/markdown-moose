// src/types/index.ts
import * as vscode from 'vscode';

// Core plugin interface - what every plugin must implement
export interface Plugin {
    name: string;
    description: string;
    version: string;
    author?: string;
    commands: Command[];
    activate: (context: vscode.ExtensionContext) => void;
    deactivate: () => void;
}

// Core command interface - how plugins define their commands
export interface Command {
    id: string;
    title: string;
    execute: (...args: any[]) => Promise<void>;
}