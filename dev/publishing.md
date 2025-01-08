# VSCode Extension Publishing Gotchas

## Publisher Issues

1. Publisher Name vs Azure DevOps Username
   - Your Azure DevOps username (e.g., shaneholloman) is different from your publisher ID (e.g., warpdeck)
   - Must use Azure DevOps username for `vsce login`
   - Must use publisher ID in package.json
   - Can't easily create new publisher names even if the UI lets you try

2. Personal Access Token (PAT)
   - Requires specific permissions:
     - Marketplace: Acquire
     - Marketplace: Manage
     - Marketplace: Publish
     - User Profile: Read
   - Use "Full access" to avoid permission issues
   - Token is tied to your Azure DevOps account, not the publisher

## Package Contents Control

1. .vscodeignore Limitations
   - Despite being the official way to control package contents, it can be unreliable
   - Must explicitly exclude new directories
   - Patterns need to be very specific
   - No wildcard exclusions for new file types

2. package.json "files" Field
   - Can't use together with .vscodeignore
   - Will cause error: "Both a .vscodeignore file and a "files" property in package.json were found"
   - Must choose one or the other

## Version Management

1. Version Control
   - Can't remove individual versions from marketplace
   - Unpublishing removes ALL versions
   - Must increment version for each publish
   - No way to replace a specific version

2. Unpublishing Consequences
   - Removes entire extension
   - Breaks update path for users
   - Resets all stats
   - Loses reviews and ratings
   - Must republish as new

## Best Practices Learned

1. Package Contents
   - Test package contents before publishing: `vsce ls`
   - Keep only essential files:
     - README.md
     - package.json
     - LICENSE
     - icon.png
     - dist/extension.js
   - Put development files in clearly marked directories (e.g., /dev)
   - Use explicit .vscodeignore patterns

2. Version Management
   - Always increment version before publishing
   - Can't fix published versions - only move forward
   - Keep development files separate from publishable files

3. Publishing Workflow
   1. Check package contents: `vsce ls`
   2. Update version in package.json
   3. Test package: `vsce package`
   4. Verify package contents
   5. Publish: `vsce publish`

## Microsoft's Marketplace Limitations

1. No Version Management
   - Can't remove individual versions
   - Can't replace specific versions
   - All-or-nothing unpublishing

2. Publisher Management
   - Can't change publisher names
   - Can't merge publishers
   - Stuck with initial publisher choice

3. Package Control
   - Limited control over included files
   - Confusing mix of .vscodeignore and package.json "files"
   - No way to update published package contents

## Tips for Future Projects

1. Setup
   - Use existing publisher if possible
   - Set up clean directory structure from start
   - Keep development files in /dev directory
   - Test package contents before first publish

2. Maintenance
   - Only publish when package contents are clean
   - Keep moving forward with versions
   - Don't rely on being able to fix published versions
   - Maintain clear separation between publishable and development files
