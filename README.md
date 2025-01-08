# Markdown Moose 🦌

Markdown Moose is a VSCode Extension that enhances your Markdown workflow. It uses a plugin-based architecture where each feature is a plugin that can be loaded by the extension.

![Markdown Moose Logo](icon.png)

## Features

### 📥 Image Downloader Plugin (Built-in)

- Automatically downloads images from your Markdown files
- Saves images locally in the same directory as your Markdown file
- Updates image links to use relative paths
- Shows download progress with a sleek progress indicator

## Usage

1. Open a Markdown file
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Moose" and select "Moose: Download Images from Markdown"
4. Watch as Markdown Moose downloads your images and updates the links

## Configuration

You can configure where images are downloaded using one of these methods (in order of priority):

1. `.moose` config file in workspace root:

   ```json
   {
     "imageDownloader": {
       "path": "./img"
     }
   }
   ```

2. Workspace settings (`.vscode/settings.json`):

   ```json
   {
     "moose.imageDownloader.path": "./img"
   }
   ```

3. VSCode User Settings:
   - Go to Settings (Ctrl+,)
   - Search for "Markdown Moose"
   - Set "Image Downloader Path"

The path should be relative to the markdown file (e.g., "./img", "./assets/images", ".").
If a directory doesn't exist, it will be created automatically.

Default path: "./img"

## Plugin Architecture

Markdown Moose (the Extension) is built with extensibility in mind. The core extension acts as a host that can load multiple plugins. Each plugin adds specific features to enhance your Markdown editing experience.

For example, the Image Downloader plugin (which comes built-in) adds the ability to download and manage images in your markdown files. You can create your own plugins to add more features to the extension.

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

🦌 Happy Markdown editing with the Moose!
