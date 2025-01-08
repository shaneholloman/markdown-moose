/**
 * Markdown Moose Image Alt Plugin
 *
 * Updates image alt text based on containing heading context.
 * Uses nearest heading, page title, or file type as fallback.
 *
 * @module ImageAlt
 */

import * as vscode from 'vscode';
import { Plugin, Command } from '../../types';
import { PluginSettings } from '../../types/settings';
import { ImageMatch, HeadingMatch } from './types';
import { getSetting } from '../../utils/settings-loader';

export class ImageAlt implements Plugin {
    public name = 'imageAlt';
    public description = 'Updates image alt text based on heading context';
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
        this.updateImageAlts = this.updateImageAlts.bind(this);

        this.commands = [
            {
                id: 'markdown-moose.updateImageAlts',
                title: 'Update Image Alt Text',
                execute: this.updateImageAlts
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

        this.log('Activating Image Alt plugin...');
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
        this.log('Image Alt plugin activated successfully');
    }

    public deactivate(): void {
        // Cleanup if needed
    }

    /**
     * Extracts all markdown images from the content
     * Ignores images in code blocks
     */
    private extractImages(content: string): ImageMatch[] {
        const images: ImageMatch[] = [];
        const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
        const codeBlockRegex = /```[\s\S]*?```/g;

        // Get code block ranges to exclude
        const codeBlocks: { start: number; end: number }[] = [];
        let match;
        while ((match = codeBlockRegex.exec(content)) !== null) {
            codeBlocks.push({
                start: match.index,
                end: match.index + match[0].length
            });
        }

        // Extract images not in code blocks
        while ((match = imageRegex.exec(content)) !== null) {
            const isInCodeBlock = codeBlocks.some(
                block => match!.index >= block.start && match!.index <= block.end
            );

            if (!isInCodeBlock) {
                images.push({
                    fullMatch: match[0],
                    altText: match[1],
                    url: match[2],
                    position: match.index
                });
            }
        }

        return images;
    }

    /**
     * Extracts all headings from the content
     */
    private extractHeadings(content: string): HeadingMatch[] {
        const headings: HeadingMatch[] = [];
        const headingRegex = /^(#{1,6})\s+(.+)$/gm;

        let match;
        while ((match = headingRegex.exec(content)) !== null) {
            headings.push({
                level: match[1].length,
                text: match[2].trim(),
                position: match.index
            });
        }

        return headings;
    }

    /**
     * Sanitizes text for use as alt text (alphanumeric only)
     */
    private sanitizeAltText(text: string): string {
        return text.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    }

    /**
     * Gets the file extension from a URL or path
     */
    private getFileExtension(url: string): string {
        try {
            const extension = url.split('.').pop()?.split(/[#?]/)[0].toLowerCase();
            return extension || 'image';
        } catch {
            return 'image';
        }
    }

    /**
     * Finds the nearest heading above an image
     */
    private findNearestHeading(image: ImageMatch, headings: HeadingMatch[]): HeadingMatch | null {
        return headings
            .filter(h => h.position < image.position)
            .sort((a, b) => b.position - a.position)[0] || null;
    }

    /**
     * Main command handler for updating image alt text
     */
    public async updateImageAlts(): Promise<void> {
        this.log('updateImageAlts called');
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

        const content = document.getText();
        const images = this.extractImages(content);
        const headings = this.extractHeadings(content);

        if (images.length === 0) {
            vscode.window.showInformationMessage('Moose: No images found in markdown');
            return;
        }

        const overwriteExisting = await getSetting<boolean>(
            'imageAlt',
            'overwriteExisting',
            document,
            false
        );

        let updated = 0;
        const edit = new vscode.WorkspaceEdit();

        // Track used alt texts to handle duplicates
        const usedAltTexts = new Map<string, number>();

        for (const image of images) {
            // Skip if has alt text and not overwriting
            if (image.altText && !overwriteExisting) {
                continue;
            }

            // Find alt text source (heading > title > file type)
            let altText = '';
            const nearestHeading = this.findNearestHeading(image, headings);

            if (nearestHeading) {
                altText = this.sanitizeAltText(nearestHeading.text);
            } else if (headings.length > 0) {
                // Use first heading as title
                altText = this.sanitizeAltText(headings[0].text);
            } else {
                // Fallback to file type
                altText = this.getFileExtension(image.url);
            }

            // Handle duplicates by adding counter
            const baseAltText = altText;
            const count = usedAltTexts.get(baseAltText) || 0;
            usedAltTexts.set(baseAltText, count + 1);

            if (count > 0) {
                altText = `${baseAltText} ${String(count + 1).padStart(2, '0')}`;
            }

            // Create new image markdown
            const newText = `![${altText}](${image.url})`;
            if (newText !== image.fullMatch) {
                const startPos = document.positionAt(image.position);
                const endPos = document.positionAt(image.position + image.fullMatch.length);
                edit.replace(document.uri, new vscode.Range(startPos, endPos), newText);
                updated++;
            }
        }

        if (updated > 0) {
            await vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage(`Moose: Updated ${updated} image alt texts`);
        } else {
            vscode.window.showInformationMessage('Moose: No images needed updating');
        }
    }
}

export default new ImageAlt();
