/**
 * Markdown Moose Image Downloader Plugin
 *
 * Downloads remote images from markdown files to the local directory and updates
 * the markdown to use relative paths. Supports various image URL formats including
 * Next.js image URLs.
 *
 * @module ImageDownloader
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import fetch from 'node-fetch';
import { Plugin, Command } from '../../types';
import { CleanUrl } from './types';
import { PluginSettings } from '../../types/settings';
import { getSetting } from '../../utils/settings-loader';
import { getImageDownloadPath, ensureImageDirectory } from '../../utils/image-utils';

export class ImageDownloader implements Plugin {
    public name = 'imageDownloader';  // Match the settings namespace in package.json
    public description = 'Downloads remote images from markdown files to local directory and updates links automatically';
    public version = '1.0.0';
    public author = 'Shane Holloman';
    public commands: Command[];
    public settings: PluginSettings;
    private outputChannel?: vscode.OutputChannel;

    private log(message: string) {
        console.log(message);
        this.outputChannel?.appendLine(message);
    }

    constructor() {
        // Ensure proper binding of methods
        this.downloadImages = this.downloadImages.bind(this);

        this.commands = [
            {
                id: 'markdown-moose.downloadImages',
                title: 'Download Images from Markdown',
                execute: this.downloadImages
            }
        ];

        this.settings = {
            path: {
                type: 'string',
                default: './img',
                description: 'Default path for downloaded images (relative to markdown file)',
                pattern: '^[^/\\\\].*$', // Must be relative path
            },
            overwriteExisting: {
                type: 'boolean',
                default: true,
                description: 'Whether to overwrite existing images'
            },
            skipLargeImages: {
                type: 'boolean',
                default: false,
                description: 'Skip downloading images larger than maxImageSize'
            },
            maxImageSize: {
                type: 'number',
                default: 5242880, // 5MB
                description: 'Maximum image size in bytes (when skipLargeImages is true)',
                minimum: 0
            }
        };
    }

    public activate(context: vscode.ExtensionContext): void {
        // Get the shared output channel
        this.outputChannel = vscode.window.createOutputChannel('Markdown Moose');
        context.subscriptions.push(this.outputChannel);

        this.log('Activating Image Downloader plugin...');
        for (const command of this.commands) {
            this.log(`Registering command: ${command.id}`);
            try {
                const disposable = vscode.commands.registerCommand(
                    command.id,
                    this.downloadImages  // Use bound method directly
                );
                context.subscriptions.push(disposable);
                this.log(`Successfully registered command: ${command.id}`);
            } catch (error) {
                const errorMessage = `Failed to register command ${command.id}: ${error}`;
                this.outputChannel?.appendLine(`ERROR: ${errorMessage}`);
                if (error instanceof Error) {
                    this.outputChannel?.appendLine(`Stack trace: ${error.stack}`);
                }
                throw error; // Re-throw to ensure activation fails properly
            }
        }
        this.log('Image Downloader plugin activated successfully');
    }

    public deactivate(): void {
        // Cleanup if needed
    }

    /**
     * Cleans and parses an image URL to extract filename and handle special cases.
     * Supports Next.js image URLs by extracting the original image URL from query params.
     *
     * @param url - The image URL to clean and parse
     * @returns CleanUrl object containing the URL and filename, or null if parsing fails
     */
    private cleanImageUrl(url: string): CleanUrl | null {
        try {
            const parsedUrl = new URL(url);

            // For next.js image URLs, get the actual image URL
            if (parsedUrl.pathname.includes('_next/image')) {
                const originalUrl = new URL(parsedUrl.searchParams.get('url')!);
                const filename = originalUrl.pathname.split('/').pop()!;
                return {
                    url: url,
                    filename: decodeURIComponent(filename)
                };
            }

            // For regular URLs, get the last path segment and decode it
            const filename = parsedUrl.pathname.split('/').pop()!;
            return {
                url: url,
                filename: decodeURIComponent(filename)
            };
        } catch (e) {
            const errorMessage = `Error parsing URL ${url}: ${e}`;
            this.outputChannel?.appendLine(`ERROR: ${errorMessage}`);
            return null;
        }
    }

    /**
     * Extracts all image URLs from markdown content using regex.
     * Only matches standard markdown image syntax with http(s) URLs.
     *
     * @param markdown - The markdown content to parse
     * @returns Array of CleanUrl objects for each valid image URL found
     */
    private extractImageUrls(markdown: string): CleanUrl[] {
        const imageRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
        const matches = [...markdown.matchAll(imageRegex)];
        return matches
            .map(match => this.cleanImageUrl(match[1]))
            .filter((url): url is CleanUrl => url !== null);
    }

    /**
     * Downloads an image from a URL and saves it to the specified path.
     * Handles HTTP errors and file system operations.
     *
     * @param url - The URL to download the image from
     * @param destPath - The local file system path to save the image to
     * @throws Error if download fails or file cannot be written
     */
    private async downloadImage(url: string, destPath: string, document: vscode.TextDocument): Promise<void> {
        this.log(`Downloading image from: ${url}`);
        this.log(`Saving to: ${destPath}`);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.statusText}`);
        }

        // Check file size if skipLargeImages is enabled
        const skipLargeImages = await getSetting<boolean>(
            'imageDownloader',
            'skipLargeImages',
            document,
            false
        );

        if (skipLargeImages) {
            const maxSize = await getSetting<number>(
                'imageDownloader',
                'maxImageSize',
                document,
                5242880
            );

            const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
            if (contentLength > maxSize) {
                throw new Error(`Image size (${contentLength} bytes) exceeds maximum allowed size (${maxSize} bytes)`);
            }
        }

        // Check if file exists and overwrite setting
        const overwriteExisting = await getSetting<boolean>(
            'imageDownloader',
            'overwriteExisting',
            document,
            true
        );

        try {
            await fs.access(destPath);
            if (!overwriteExisting) {
                throw new Error('File exists and overwrite is disabled');
            }
        } catch (error: any) {
            // File doesn't exist, which is fine
            if (error.message !== 'File exists and overwrite is disabled') {
                // Create the file
                const buffer = await response.buffer();
                await fs.writeFile(destPath, buffer);
                this.log('Successfully downloaded and saved image');
            } else {
                throw error;
            }
        }
    }

    /**
     * Main command handler for downloading images from the active markdown document.
     * Shows progress indicator while downloading and updates markdown content with local paths.
     *
     * @throws Error if no active editor or document is not markdown
     */
    public async downloadImages(): Promise<void> {
        this.log('downloadImages called');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Moose: No active editor');
            return;
        }

        const document = editor.document;
        if (document.languageId !== 'markdown') {
            vscode.window.showErrorMessage('Moose: Active file is not markdown');
            return;
        }

        const text = document.getText();
        const imageUrls = this.extractImageUrls(text);

        if (imageUrls.length === 0) {
            vscode.window.showInformationMessage('Moose: No images found in markdown');
            return;
        }

        this.log(`Found image URLs: ${JSON.stringify(imageUrls, null, 2)}`);
        const documentDir = path.dirname(document.uri.fsPath);

        // Get configured image path and ensure directory exists
        const configuredPath = await getImageDownloadPath(document);
        const imagePath = await ensureImageDirectory(documentDir, configuredPath);

        // Get plugin settings
        const skipLargeImages = await getSetting<boolean>(
            'imageDownloader',
            'skipLargeImages',
            document,
            false
        );

        let downloaded = 0;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Moose: Downloading Images",
            cancellable: false
        }, async (progress) => {
            const increment = 100 / imageUrls.length;

            for (const {url: imageUrl, filename} of imageUrls) {
                progress.report({
                    message: `Downloading ${filename}...`,
                    increment
                });
                try {
                    const destPath = path.join(documentDir, imagePath, filename);
                    await this.downloadImage(imageUrl, destPath, document);
                    downloaded++;

                    const edit = new vscode.WorkspaceEdit();
                    const content = document.getText();
                    // Simple URL replacement
                    const newContent = content.replace(
                        imageUrl,
                        imagePath === '.' ? `./${filename}` : `${imagePath}/${filename}`
                    );

                    edit.replace(
                        document.uri,
                        new vscode.Range(
                            document.positionAt(0),
                            document.positionAt(content.length)
                        ),
                        newContent
                    );
                    await vscode.workspace.applyEdit(edit);

                } catch (error) {
                    const errorMessage = `Failed to download ${imageUrl}: ${error}`;
                    this.outputChannel?.appendLine(`ERROR: ${errorMessage}`);
                    vscode.window.showErrorMessage(`Moose: Failed to download ${imageUrl}`);
                }
            }
        });

        vscode.window.showInformationMessage(`Moose: Downloaded ${downloaded} images`);
    }
}

export default new ImageDownloader();
