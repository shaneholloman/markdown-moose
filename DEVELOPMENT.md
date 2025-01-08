# Markdown Moose Development Guide

## Understanding the Architecture

### Extension vs Plugins

**Markdown Moose** is the main VSCode Extension - it provides the core framework and plugin loading system. Think of it as the "host application" that manages and runs plugins.

**Plugins** are modular features that add functionality to the Markdown Moose extension. For example, the Image Downloader is a plugin that adds image downloading capabilities. Plugins are:

- Self-contained modules
- Loaded automatically by the extension
- Each responsible for a specific feature set

The relationship is hierarchical:

```
Markdown Moose (Extension)
└── Plugins
    ├── Image Downloader (Built-in plugin)
    ├── Your Plugin
    └── Other Plugins...
```

## Development Workflow

### 1. Setup Development Environment

```bash
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

## Getting Help

- Check existing issues on GitHub
- Create a new issue with:
  - Clear description
  - Steps to reproduce
  - Expected vs actual behavior
  - VSCode and extension version
