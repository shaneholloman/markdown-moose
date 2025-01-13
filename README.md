# Markdown Moose 🦌

Markdown Moose is a VSCode Extension that enhances your Markdown workflow. It uses a plugin-based architecture where each feature is a plugin that can be loaded by the extension.

## Features Added

### 📥 Image Downloader Plugin

- Automatically downloads images from your Markdown files
- Saves images locally in the same directory as your Markdown file
- Updates image links to use relative paths
- Shows download progress with a sleek progress indicator

### 🔤 Image Alt Plugin

- Automatically generates meaningful alt text for images based on context
- Uses nearest heading above the image as alt text
- Falls back to page title or file type if no nearby heading
- Handles duplicate images with numbered alt texts
- Configurable to preserve or overwrite existing alt text

### 📝 More Plugins Coming Soon

> [!IMPORTANT]
> **Next feature**: [HTML to Markdown Plugins](dev/ideas.md#next-up)

Please feel free to suggest new features or create your own plugins.

> [!TIP]
> Wish list is here: [Markdown Moose Plugin Ideas](dev/ideas.md)

## Usage

1. Open a Markdown file
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Moose" to see available commands:
    - Select "Moose: Download Images from Markdown" to download and organize images
    - Select "Moose: Update Image Alt Text" to generate contextual alt text for images

## Configuration

Markdown Moose uses a three-tier configuration system (in order of priority):

1. `.moose` Config File (Highest Priority):

    - JSON file in workspace root
    - Settings grouped by plugin name
    - Example:

    ```json
    {
      "imageDownloader": {
        "path": "./img",
        "overwriteExisting": true,
        "skipLargeImages": true,
        "maxImageSize": 10485760
      },
      "imageAlt": {
        "overwriteExisting": false
      }
    }
    ```

2. Workspace Settings (Medium Priority):

    - In `.vscode/settings.json`
    - Settings prefixed with "moose.[pluginName]"
    - Example:

    ```json
    {
      "moose.imageDownloader.path": "./img",
      "moose.imageDownloader.overwriteExisting": true,
      "moose.imageDownloader.skipLargeImages": false,
      "moose.imageDownloader.maxImageSize": 5242880,
      "moose.imageAlt.overwriteExisting": false
    }
    ```

3. VSCode User Settings (Low Priority):

    - Go to Settings (Ctrl+,)
    - Search for "Markdown Moose"
    - Configure available settings

### Plugin Settings

#### Image Downloader Settings

- `path`: Where to save downloaded images (relative to markdown file)
  - Default: "./img"
  - Examples: "./assets/images", ".", "./downloads"

- `overwriteExisting`: Whether to overwrite existing images
  - Default: true
  - Set to false to skip existing files

- `skipLargeImages`: Whether to skip large image downloads
  - Default: false
  - Works with maxImageSize setting

- `maxImageSize`: Maximum allowed image size in bytes
  - Default: 5242880 (5MB)
  - Only used when skipLargeImages is true

#### Image Alt Settings

- `overwriteExisting`: Whether to overwrite existing alt text
  - Default: false
  - Set to true to update all images regardless of existing alt text

Notes:

- Paths should be relative to the markdown file
- Directories are created automatically if they don't exist
- Higher priority settings override lower priority ones

## Plugin Architecture

Markdown Moose (the Extension) is built with extensibility in mind. The core extension acts as a host that can load multiple plugins. Each plugin adds specific features to enhance your Markdown editing experience.

For example, the Image Downloader plugin adds the ability to download and manage images in your markdown files. You can create your own plugins to add more features to the extension.

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

3. Register your plugin (see Current Implementation below)

### Plugin System: Current State & Future Vision

#### Current Implementation

Plugins currently require manual registration in the codebase. To add a new plugin:

1. Create your plugin directory in `src/plugins/your-plugin-name/`
2. Implement the Plugin interface in your main file (e.g., `index.ts`)
3. Register the plugin in `src/plugins/index.ts`
4. Add command and setting contributions to `package.json`

Example plugin registration in `src/plugins/index.ts`:

```typescript
try {
    log('Loading my plugin...');
    const myPlugin = require('./my-plugin-name').default;
    if (isValidPlugin(myPlugin)) {
        plugins.push(myPlugin);
    }
} catch (error) {
    // Error handling
}
```

#### Future Vision: True Drop-in Architecture

We are working towards a true drop-in plugin architecture where:

- Plugins can be added by simply placing them in a plugins directory
- No manual registration or code changes required
- Dynamic discovery and loading of plugins
- Hot-reloading during development
- Proper isolation and versioning

This vision requires significant architectural work, including:

- Dynamic plugin discovery system
- Plugin manifest format
- Dependency management
- Security sandboxing
- Version compatibility checking

#### Help Us Get There

We welcome contributions towards achieving this vision. Areas where help is needed:

- Plugin discovery system design
- Manifest format specification
- Hot-reload implementation
- Plugin isolation strategies
- Testing framework for plugins

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
