# Markdown Moose 🦌

A powerful, extensible VSCode extension for enhancing your Markdown workflow through a plugin-based architecture.

![Markdown Moose Logo](icon.png)

## Features

### 📥 Image Downloader (Built-in Plugin)

- Automatically downloads images from your Markdown files
- Saves images locally in the same directory as your Markdown file
- Updates image links to use relative paths
- Shows download progress with a sleek progress indicator

## Usage

1. Open a Markdown file
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Download Images" and select "Download Images from Markdown"
4. Watch as Markdown Moose downloads your images and updates the links

## Plugin Architecture

Markdown Moose is built with extensibility in mind. The core extension is a plugin host that can load multiple plugins to enhance your Markdown editing experience.

### Creating a Plugin

1. Create a new directory in the `src/plugins` directory
2. Implement the Plugin interface:

    ```typescript
    interface Plugin {
        name: string;
        description: string;
        version: string;
        author: string;
        commands: Command[];
        activate(context: vscode.ExtensionContext): void;
        deactivate(): void;
    }

    interface Command {
        id: string;
        title: string;
        execute: (...args: any[]) => any;
    }
    ```

    Example plugin structure:

    ```typescript
    import * as vscode from 'vscode';
    import { Plugin, Command } from '../../types';

    export class MyPlugin implements Plugin {
        public name = 'My Plugin';
        public description = 'Does something awesome';
        public version = '1.0.0';
        public author = 'Your Name';
        public commands: Command[];

        constructor() {
            this.commands = [
                {
                    id: 'markdown-moose.myCommand',
                    title: 'My Awesome Command',
                    execute: this.myCommand.bind(this)
                }
            ];
        }

        public activate(context: vscode.ExtensionContext): void {
            // Register commands
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

        private async myCommand(): Promise<void> {
            // Your command implementation
        }
    }

    export default new MyPlugin();
    ```

3. The plugin will be automatically loaded by the extension

### Plugin Loading

Plugins are loaded automatically from the `src/plugins` directory. Each plugin should:

- Be in its own directory
- Export a default instance of a class implementing the Plugin interface
- Register its commands in the activate method
- Clean up resources in the deactivate method if needed

## Contributing

1. Fork the repository
2. Create a new plugin in `src/plugins/your-plugin-name`
3. Implement the Plugin interface
4. Submit a pull request

## License

MIT

## Author

Shane Holloman

---

🦌 Happy Markdown editing with Markdown Moose!
