import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { getSetting } from './settings-loader';

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
 * Gets the configured image download path for a document
 * @param document The current document
 * @returns The resolved image path
 */
export async function getImageDownloadPath(document: vscode.TextDocument): Promise<string> {
    const documentDir = path.dirname(document.uri.fsPath);
    const configuredPath = await getSetting<string>(
        'imageDownloader',
        'path',
        document,
        './img'
    );

    const validPath = validateImagePath(documentDir, configuredPath);
    if (validPath) {
        return validPath;
    }

    console.log('Invalid path in settings, using default "./img"');
    return './img';
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
