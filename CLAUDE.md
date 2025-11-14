# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Markdown Moose is a VSCode Extension that enhances Markdown workflows using a plugin-based architecture. The core extension acts as a host that loads and manages plugins, each providing specific functionality (image downloading, alt text generation, etc.).

## Build Commands

This project uses pnpm for package management.

```sh
pnpm run compile         # Build using webpack (production mode)
pnpm run watch           # Build in watch mode for development
pnpm run vscode:prepublish  # Pre-publish build
pnpm run convert-icon    # Convert icon using Sharp library
```

Build output goes to `dist/extension.js` (single bundled file via webpack).

## Development Workflow

### Testing Changes

1. Press F5 in VSCode to launch Extension Development Host (recommended)
2. Or manually: `pnpm run compile` then copy to `~/.vscode/extensions/markdown-moose` and restart VSCode

### Packaging for Testing

```sh
pnpm install -g @vscode/vsce  # Install once
pnpm run compile && vsce package  # Creates .vsix in project root
code --install-extension ./markdown-moose-[version].vsix
```

The extension uses webpack to bundle all code into a single `dist/extension.js` file. Dependencies like node-fetch are bundled in. See webpack.config.js for bundling configuration.

## Architecture

### Extension Entry Point

`src/extension.ts` - Core extension activation/deactivation. On activation:
1. Creates output channel for logging
2. Loads plugins via `loadPlugins()` from `src/plugins/index.ts`
3. Registers plugin settings with SettingsRegistry
4. Activates each plugin by calling `plugin.activate(context)`

### Plugin System

**Current State**: Plugins require manual registration in `src/plugins/index.ts`. Each plugin must be explicitly loaded with try/catch blocks.

**Future Vision**: True drop-in architecture where plugins can be added by placing them in a directory without code changes. See `dev/plugin-architecture.md` for detailed evolution plans.

#### Plugin Interface

All plugins must implement (from `src/types/index.ts`):

```typescript
interface Plugin {
    name: string;                // Used as settings namespace
    description: string;
    version: string;
    author?: string;
    commands: Command[];
    settings?: PluginSettings;   // Settings definitions
    activate: (context: vscode.ExtensionContext) => void;
    deactivate: () => void;
}
```

#### Adding a New Plugin

1. Create directory: `src/plugins/your-plugin-name/`
2. Implement Plugin interface in `index.ts`
3. Register in `src/plugins/index.ts` with try/catch block
4. Add command contributions to `package.json` under `contributes.commands`
5. Add setting contributions to `package.json` under `contributes.configuration.properties`

Example plugin structure: See `src/plugins/imageDownloader/index.ts` for complete implementation.

### Settings System

Three-tier configuration hierarchy (highest to lowest priority):

1. `.moose` file (workspace root) - JSON with plugin-grouped settings
2. VSCode workspace/user settings - Prefixed with `moose.[pluginName]`
3. Default values - Defined in plugin's settings definitions

Settings loading: Use `getSetting<T>(pluginName, settingKey, document, defaultValue)` from `src/utils/settings-loader.ts`.

Example:

```typescript
const imagePath = await getSetting<string>(
    'imageDownloader',
    'path',
    document,
    './img'
);
```

### Key Files and Patterns

- `src/extension.ts` - Main extension activation/deactivation
- `src/plugins/index.ts` - Plugin loading and registration
- `src/plugins/[name]/index.ts` - Individual plugin implementations
- `src/types/index.ts` - Core Plugin and Command interfaces
- `src/types/settings.ts` - Plugin settings type definitions
- `src/utils/settings-loader.ts` - Three-tier settings resolution
- `src/utils/settings-registry.ts` - Settings registration and management
- `src/utils/image-utils.ts` - Shared image utilities

### TypeScript Configuration

- Target: ES2020
- Module: CommonJS (required for VSCode extensions)
- Lib: ES2020, dom (dom required for URL parsing and other browser APIs)
- Output: `dist/` directory

## Plugin Development Patterns

### Command Registration

Plugins define commands in constructor and register them in `activate()`:

```typescript
this.commands = [{
    id: 'markdown-moose.myCommand',
    title: 'My Command',
    execute: this.myCommand.bind(this)  // Bind to maintain context
}];
```

Register in `activate()`:

```typescript
for (const command of this.commands) {
    const disposable = vscode.commands.registerCommand(
        command.id,
        command.execute
    );
    context.subscriptions.push(disposable);
}
```

### Plugin Settings

Define settings in plugin constructor matching package.json configuration:

```typescript
this.settings = {
    mySetting: {
        type: 'string',
        default: 'default value',
        description: 'Setting description',
        pattern: '^[a-z]+$'  // Optional validation
    }
};
```

### Logging Pattern

Plugins should log to both console and output channel:

```typescript
private log(message: string) {
    console.log(message);
    this.outputChannel?.appendLine(message);
}
```

### Error Handling

Always provide user feedback via VSCode notifications:

```typescript
try {
    // operation
    vscode.window.showInformationMessage('Success message');
} catch (error) {
    this.outputChannel?.appendLine(`ERROR: ${error}`);
    vscode.window.showErrorMessage(`Error message`);
}
```

## Current Plugins

### Image Downloader

- Downloads remote images from markdown to local directory
- Updates markdown links to relative paths
- Supports Next.js image URLs
- Configurable path, overwrite, and size limits
- Command: `markdown-moose.downloadImages`

### Image Alt

- Generates contextual alt text for images
- Uses nearest heading or page title as context
- Handles duplicate images with numbering
- Configurable overwrite behavior
- Command: `markdown-moose.updateImageAlts`

## Testing Checklist

When making changes:

- [ ] Extension activates properly (check Output > Markdown Moose)
- [ ] All expected plugins load successfully
- [ ] Commands appear in Command Palette (Ctrl+Shift+P, search "Moose")
- [ ] Settings hierarchy works (.moose > workspace > defaults)
- [ ] Error cases handled with user-friendly messages

## Important Notes

- All plugins are bundled into single `dist/extension.js` via webpack
- Plugin code is loaded at extension startup (not lazy-loaded)
- Settings must be registered before plugin activation
- Extension uses CommonJS modules (not ES modules)
- VSCode API is externalized in webpack config (not bundled)
