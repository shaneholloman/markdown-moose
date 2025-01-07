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

export class ImageDownloader implements Plugin {
    public name = 'Markdown Moose Image Downloader';
    public description = 'Downloads remote images from markdown files to local directory and updates links automatically';
    public version = '1.0.0';
    public author = 'Shane Holloman';
    public commands: Command[];

    constructor() {
        this.commands = [
            {
                id: 'markdown-moose.downloadImages',
                title: 'Download Images from Markdown',
                execute: this.downloadImages.bind(this)
            }
        ];
    }

    public activate(context: vscode.ExtensionContext): void {
        for (const command of this.commands) {
            const disposable = vscode.commands.registerCommand(
                command.id,
                command.execute
            );
            context.subscriptions.push(disposable);
        }
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
            console.error('Error parsing URL:', url, e);
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
    private async downloadImage(url: string, destPath: string): Promise<void> {
        console.log('Downloading image from:', url);
        console.log('Saving to:', destPath);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.statusText}`);
        }

        const buffer = await response.buffer();
        await fs.writeFile(destPath, buffer);
        console.log('Successfully downloaded and saved image');
    }

    /**
     * Main command handler for downloading images from the active markdown document.
     * Shows progress indicator while downloading and updates markdown content with local paths.
     *
     * @throws Error if no active editor or document is not markdown
     */
    public async downloadImages(): Promise<void> {
        console.log('downloadImages called');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const document = editor.document;
        if (document.languageId !== 'markdown') {
            vscode.window.showErrorMessage('Active file is not markdown');
            return;
        }

        const text = document.getText();
        const imageUrls = this.extractImageUrls(text);

        if (imageUrls.length === 0) {
            vscode.window.showInformationMessage('No images found in markdown');
            return;
        }

        console.log('Found image URLs:', imageUrls);
        const documentDir = path.dirname(document.uri.fsPath);
        let downloaded = 0;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Downloading Images",
            cancellable: false
        }, async (progress) => {
            const increment = 100 / imageUrls.length;

            for (const {url: imageUrl, filename} of imageUrls) {
                progress.report({
                    message: `Downloading ${filename}...`,
                    increment
                });
                try {
                    const destPath = path.join(documentDir, filename);
                    await this.downloadImage(imageUrl, destPath);
                    downloaded++;

                    const edit = new vscode.WorkspaceEdit();
                    const content = document.getText();
                    // Simple URL replacement
                    const newContent = content.replace(imageUrl, `./${filename}`);

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
                    console.error(`Failed to download ${imageUrl}:`, error);
                    vscode.window.showErrorMessage(`Failed to download ${imageUrl}`);
                }
            }
        });

        vscode.window.showInformationMessage(`Downloaded ${downloaded} images`);
    }
}

export default new ImageDownloader();
