import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

interface MooseConfig {
    imageDownloader: {
        path: string;
    };
}

/**
 * Validates if a path is within the workspace
 * @param basePath The base path to resolve against
 * @param targetPath The path to validate
 * @returns boolean indicating if path is safe
 */
export function isPathWithinWorkspace(basePath: string, targetPath: string): boolean {
    const resolvedPath = path.resolve(basePath, targetPath);
    const workspacePath = path.resolve(basePath);
    return resolvedPath.startsWith(workspacePath);
}

/**
 * Validates the image download path
 * @param basePath The base path to resolve against
 * @param imagePath The path to validate
 * @returns string with the validated path or null if invalid
 */
export function validateImagePath(basePath: string, imagePath: string): string | null {
    // Don't allow absolute paths
    if (path.isAbsolute(imagePath)) {
        return null;
    }

    // Check if path would escape workspace
    if (!isPathWithinWorkspace(basePath, imagePath)) {
        return null;
    }

    return imagePath;
}

/**
 * Loads and parses the .moose config file if it exists
 * @param workspaceRoot The workspace root path
 * @returns The parsed config or null if file doesn't exist
 */
async function loadMooseConfig(workspaceRoot: string): Promise<MooseConfig | null> {
    try {
        const configPath = path.join(workspaceRoot, '.moose');
        const content = await fs.readFile(configPath, 'utf8');

        try {
            return JSON.parse(content);
        } catch (e) {
            // Invalid JSON in .moose file
            vscode.window.showErrorMessage('Invalid JSON in .moose config file. Using workspace settings instead.');
            return null;
        }
    } catch (e) {
        // File doesn't exist, which is fine
        return null;
    }
}

/**
 * Gets the image download path from various config sources
 * @param document The current document
 * @returns The resolved image path
 */
export async function getImageDownloadPath(document: vscode.TextDocument): Promise<string> {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    const documentDir = path.dirname(document.uri.fsPath);

    let imagePath = './img'; // Default path

    // Try .moose config first
    if (workspaceFolder) {
        const mooseConfig = await loadMooseConfig(workspaceFolder.uri.fsPath);
        if (mooseConfig?.imageDownloader?.path) {
            const validPath = validateImagePath(documentDir, mooseConfig.imageDownloader.path);
            if (validPath) {
                imagePath = validPath;
            } else {
                vscode.window.showWarningMessage('Invalid path in .moose config. Using workspace settings.');
            }
        }
    }

    // Try workspace/user settings
    const config = vscode.workspace.getConfiguration('moose.imageDownloader', document.uri);
    const configPath = config.get<string>('path');

    if (configPath) {
        const validPath = validateImagePath(documentDir, configPath);
        if (validPath) {
            imagePath = validPath;
        } else {
            vscode.window.showWarningMessage('Invalid path in settings. Using default "./img".');
        }
    }

    return imagePath;
}

/**
 * Ensures the image directory exists, with fallback paths if creation fails
 * @param basePath The base directory path
 * @param imagePath The desired image directory path
 * @returns The actual path where images can be saved
 */
export async function ensureImageDirectory(basePath: string, imagePath: string): Promise<string> {
    const fullPath = path.join(basePath, imagePath);

    try {
        await fs.mkdir(fullPath, { recursive: true });
        return imagePath;
    } catch (e) {
        vscode.window.showWarningMessage(`Failed to create directory ${imagePath}. Trying "./img" instead.`);

        // Try default ./img
        try {
            const defaultPath = './img';
            await fs.mkdir(path.join(basePath, defaultPath), { recursive: true });
            return defaultPath;
        } catch (e) {
            vscode.window.showWarningMessage('Failed to create "./img". Using current directory.');
            return '.';
        }
    }
}
