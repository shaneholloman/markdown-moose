# Markdown Moose Development Guide

## Prerequisites

### Node.js Setup

This project uses Node.js for development. We recommend using Volta for Node.js version management:

1. Install Volta (if not already installed):

   ```bash
   curl https://get.volta.sh | bash
   ```

2. Add Volta to your PATH:
   - For bash/zsh, add to your ~/.bashrc or ~/.zshrc:

     ```bash
     export VOLTA_HOME="$HOME/.volta"
     export PATH="$VOLTA_HOME/bin:$PATH"
     ```

   - Then either restart your terminal or run:

     ```bash
     source ~/.bashrc  # or ~/.zshrc
     ```

3. Install Node.js LTS:

   ```bash
   volta install node@lts
   ```

This will ensure you have the latest LTS version of Node.js installed and properly configured.

### TypeScript Configuration

The project requires specific TypeScript configuration for VSCode extension development:

- The tsconfig.json must include 'dom' in the lib array for browser APIs
- Node.js types are required for CommonJS module support
- VSCode extension types are needed for the VSCode API

These dependencies are included in package.json and the configuration is set in tsconfig.json.

## Understanding the Architecture

### Extension vs Plugins

**Markdown Moose** is the main VSCode Extension - it provides the core framework and plugin loading system. Think of it as the "host application" that manages and runs plugins.

**Plugins** are modular features that add functionality to the Markdown Moose extension. For example, the Image Downloader is a plugin that adds image downloading capabilities. Plugins are:

- Self-contained modules
- Each responsible for a specific feature set
- Currently require manual registration (see Plugin Loading System below)

### Plugin Loading System

**Current Implementation**:
The plugin system currently requires manual registration in `src/plugins/index.ts`. While plugins are modular and self-contained, they are not yet truly "drop-in". Adding a new plugin requires:

1. Creating the plugin files in `src/plugins/your-plugin-name/`
2. Registering the plugin in `src/plugins/index.ts`:

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

3. Adding command and setting contributions to `package.json`:

   ```json
   {
     "contributes": {
       "commands": [
         {
           "command": "markdown-moose.myCommand",
           "title": "Moose: My Command"
         }
       ],
       "configuration": {
         "properties": {
           "moose.myPlugin.setting": {
             "type": "string",
             "default": "value",
             "description": "Description"
           }
         }
       }
     }
   }
   ```

**Future Goals**:
The architecture is designed with the goal of evolving into a true drop-in system where:

- Plugins can be added by simply placing them in the plugins directory
- No manual registration would be required
- Dynamic discovery and loading of plugins
- Hot-reloading of plugins during development

This vision requires significant architectural work, including:

- Dynamic plugin discovery system
- Plugin manifest format
- Dependency management
- Security sandboxing
- Version compatibility checking

We welcome contributions towards achieving this vision! Areas where help is needed:

- Plugin discovery system design
- Manifest format specification
- Hot-reload implementation
- Plugin isolation strategies
- Testing framework for plugins

Until we achieve this, follow the current process for adding new plugins as documented in this guide.

The relationship is hierarchical:

```txt
Markdown Moose (Extension)
└── Plugins
    ├── Image Downloader (Built-in plugin)
    ├── Your Plugin
    └── Other Plugins...
```

## Plugin Settings System

### Settings Hierarchy

Markdown Moose implements a three-tier settings system with clear precedence:

1. `.moose` Config File (Highest Priority)
   - JSON file in workspace root
   - Settings grouped by plugin name
   - Overrides all other settings
   - Example:

     ```json
     {
       "imageDownloader": {
         "path": "./images",
         "overwriteExisting": true
       }
     }
     ```

2. VSCode Workspace/User Settings (Medium Priority)
   - Standard VSCode settings
   - Settings prefixed with "moose.[pluginName]"
   - Example:

     ```json
     {
       "moose.imageDownloader.path": "./images",
       "moose.imageDownloader.overwriteExisting": true
     }
     ```

3. Default Values (Lowest Priority)
   - Defined in plugin's settings definitions
   - Used when no other settings found

### Implementing Plugin Settings

1. Define Settings in Plugin:

   ```typescript
   export class MyPlugin implements Plugin {
       public name = 'myPlugin';  // Used as settings namespace
       public settings: PluginSettings = {
           mySetting: {
               type: 'string',
               default: 'default value',
               description: 'My setting description',
               // Optional validations:
               pattern: '^[a-z]+$',    // Regex pattern for strings
               minimum: 0,             // For numbers
               maximum: 100,           // For numbers
               enum: ['a', 'b', 'c']   // For dropdowns
           }
       };
   }
   ```

2. Access Settings in Code:

   ```typescript
   import { getSetting } from '../../utils/settings-loader';

   const value = await getSetting<string>(
       'myPlugin',      // Plugin name
       'mySetting',     // Setting key
       document,        // VSCode document (for workspace settings)
       'default value'  // Default value
   );
   ```

### Best Practices for Plugin Settings

1. Naming:
   - Use camelCase for setting keys
   - Make names descriptive and specific
   - Match VSCode conventions

2. Documentation:
   - Provide clear descriptions
   - Document default values
   - Explain setting interactions

3. Validation:
   - Use appropriate types
   - Set reasonable min/max values
   - Provide patterns for strings
   - Handle invalid values gracefully

4. Error Handling:
   - Validate settings before use
   - Provide clear error messages
   - Fall back gracefully to defaults

## Development Workflow

### 1. Setup Development Environment

```sh
# Clone the repository
git clone https://github.com/shaneholloman/markdown-moose
cd markdown-moose

# Install dependencies
npm install
```

### 2. Making Changes

#### Extension Core Changes

If you're modifying the core extension (src/extension.ts or src/utils/*):

1. Make your changes
2. Run `npm run compile` to build
3. Test using the methods below

#### Plugin Changes

If you're modifying an existing plugin or creating a new one:

1. Make changes in `src/plugins/your-plugin-name/`
2. Run `npm run compile` to build
3. Test using the methods below

### 3. Testing Your Changes

#### Method 1: Debug Mode (Recommended)

1. Open the project in VSCode
2. Press F5 (or Run > Start Debugging)
   - This launches a new VSCode window with the extension loaded
   - You can set breakpoints and debug your code

#### Method 2: Manual Installation

1. Run `npm run compile`
2. Copy the entire project to:
   - Windows: `%USERPROFILE%\.vscode\extensions\markdown-moose`
   - macOS/Linux: `~/.vscode/extensions/markdown-moose`
3. Restart VSCode

### 4. Testing Checklist

For Extension Core:

- [ ] Extension activates properly
- [ ] Plugin loading system works
- [ ] Configuration system works
- [ ] Error handling works as expected

For Plugins:

- [ ] Plugin loads correctly
- [ ] Commands appear in Command Palette
- [ ] Features work as expected
- [ ] Error cases are handled properly
- [ ] User feedback (notifications, etc.) works

For Image Downloader Plugin Specifically:

1. Test Configuration:
   - [ ] VSCode settings work
   - [ ] Workspace settings override VSCode settings
   - [ ] .moose config overrides both
   - [ ] Invalid paths are handled correctly

2. Test Image Downloads:
   - [ ] Images download to configured directory
   - [ ] Directory is created if missing
   - [ ] Fallback paths work when needed
   - [ ] Progress indicator shows
   - [ ] Markdown links update correctly

## Debugging Tips

### VSCode Debug Console

When running in debug mode (F5):

- Check Debug Console for console.log output
- Set breakpoints in your code
- Inspect variables and state

### Extension Development Host

The new VSCode window that opens is called the "Extension Development Host":

- It runs your development version of the extension
- Changes require a reload (Ctrl+R or Cmd+R)
- Check "Output" panel, select "Markdown Moose" for logs

### Common Issues

1. Changes not appearing:
   - Ensure you ran `npm run compile`
   - Reload the Extension Development Host window

2. Plugin not loading:
   - Check console for loading errors
   - Verify plugin structure matches interface
   - Ensure default export is configured

3. Commands not appearing:
   - Check command registration in plugin
   - Verify command IDs are unique
   - Check activation events if used

## Best Practices

1. Code Organization:
   - Keep plugins modular and focused
   - Use clear, descriptive names
   - Follow existing patterns

2. Error Handling:
   - Always provide user feedback
   - Use VSCode notifications appropriately
   - Log errors for debugging

3. Testing:
   - Test all configuration options
   - Test error cases
   - Test user feedback

4. Documentation:
   - Update README.md for user-facing changes
   - Update DEVELOPMENT.md for developer changes
   - Use JSDoc comments in code

## Building and Packaging

### Building and Testing

1. Install dependencies and build tools:

   ```sh
   npm install
   npm install -g @vscode/vsce
   ```

2. Build, package, and install for testing (all-in-one command):

   ```sh
   npm run compile && vsce package && del releases\markdown-moose-0.2.1.vsix && move markdown-moose-0.2.1.vsix releases\ && code --install-extension ./releases/markdown-moose-0.2.1.vsix
   ```

   Just the build and package:

   ```sh
    npm run compile && vsce package
    ```

   This command:
   - Compiles TypeScript using webpack
   - Creates the .vsix package
   - Moves it to the releases directory
   - Installs it in VSCode for testing

3. Verify the installation:
   - Check extension appears in VSCode
   - Test commands in Command Palette
   - Verify functionality works as expected
   - Check Output panel (View -> Output -> Markdown Moose) for logs

### Package Contents

The extension uses webpack to bundle all code and dependencies:

- All TypeScript/JavaScript is bundled into a single `dist/extension.js` file
- Dependencies like node-fetch are included in the bundle
- Source maps are generated for debugging
- External VSCode APIs are properly excluded

The .vscodeignore file controls what gets included in the package. Current configuration excludes:

- Source files (bundled into dist/extension.js)
- Test files and configs
- Development files
- Node modules (bundled as needed)
- Documentation files

The webpack configuration ensures:

- Clean output directory before each build
- Proper CommonJS module format
- Development vs production builds
- Dependency bundling

To modify bundling behavior, edit webpack.config.js.
To modify package contents, edit .vscodeignore.

### Installing the Packaged Extension

```powershell
npm run compile; vsce package; Remove-Item -ErrorAction SilentlyContinue .\releases\markdown-moose-0.2.1.vsix; Move-Item -Force markdown-moose-0.2.1.vsix .\releases\; code --install-extension .\releases\markdown-moose-0.2.1.vsix
```

To test the packaged .vsix file:

1. Using VSCode UI:
   - Open VSCode
   - Go to Extensions view (Ctrl+Shift+X)
   - Click "..." (More Actions) at the top
   - Select "Install from VSIX..."
   - Navigate to `releases/markdown-moose-0.2.1.vsix`
   - Click "Install"
   - Reload VSCode when prompted

2. Using Command Line:

   ```sh
   code --install-extension releases/markdown-moose-0.2.1.vsix
   ```

   Then reload VSCode.

## Getting Help

- Check existing issues on GitHub
- Create a new issue with:
  - Clear description
  - Steps to reproduce
  - Expected vs actual behavior
  - VSCode and extension version
