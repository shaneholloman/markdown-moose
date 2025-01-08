# Plugin Loading Issue in Compiled Extension

## Issue Description

The extension works perfectly when running from source (F5 debugging), but fails to register commands when installed from the compiled .vsix package.

Error message:

```txt
Command 'Moose: Download Images from Markdown' resulted in an error
command 'markdown-moose.downloadImages' not found
```

## Root Cause Analysis

The issue stemmed from three main problems:

1. **Dynamic Plugin Loading**: The original implementation used filesystem-based plugin discovery, which worked in development but failed in production due to different directory structures.

2. **Missing Dependencies**: Dependencies like `node-fetch` weren't properly bundled in the production build, causing runtime errors.

3. **Complex Directory Structure**: The plugin system tried to maintain a complex directory structure that wasn't necessary and caused issues in the production environment.

## Solution

The issue was resolved by:

1. **Webpack Bundling**: Configured webpack to bundle everything into a single file:

    ```javascript
    // webpack.config.js
    module.exports = {
      target: 'node',
      mode: 'production',
      entry: './src/extension.ts',
      output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2',
        clean: true // Clean the output directory before emit
      },
      externals: {
        vscode: 'commonjs vscode'
      }
      // ... other config
    };
    ```

2. **Simplified Plugin Loading**: Replaced dynamic filesystem-based plugin discovery with direct imports:

    ```typescript
    // src/plugins/index.ts
    export function loadPlugins(extensionPath?: string, outputChannel?: vscode.OutputChannel): Plugin[] {
        const plugins: Plugin[] = [];
        try {
            const imageDownloaderPlugin = require('./imageDownloader').default;
            if (isValidPlugin(imageDownloaderPlugin)) {
                plugins.push(imageDownloaderPlugin);
            }
        } catch (error) {
            // Error handling
        }
        return plugins;
    }
    ```

3. **Proper Dependency Bundling**: By using webpack to bundle everything into a single file, all dependencies are properly included in the production build.

## Key Learnings

1. **Plugin Architecture**:
   - Dynamic plugin loading using filesystem operations can be fragile in production
   - Direct imports are more reliable when the plugin set is known
   - Complex directory structures should be avoided unless necessary

2. **Dependency Management**:
   - Dependencies need to be properly bundled for production
   - Using webpack helps ensure all required code is included
   - External dependencies should be carefully managed

3. **Development vs Production**:
   - What works in development (F5) might fail in production
   - Testing the compiled .vsix package is crucial
   - Directory structures can differ between development and production

## Testing Checklist

When making changes to the plugin system:

1. Test in Development (F5):
   - Verify plugin loads
   - Check command registration
   - Confirm functionality

2. Test Compiled Version:
   - Build with webpack
   - Package with vsce
   - Install .vsix and verify
   - Check command registration
   - Test full functionality

3. Verify Logs:
   - Check extension activation logs
   - Monitor plugin loading process
   - Verify command registration
   - Watch for any runtime errors

## Current Status

- Both source and compiled versions work correctly
- Commands register and execute properly
- Dependencies are properly bundled
- Plugin system is more robust and maintainable
