# Publishing Guide

This guide covers how to publish your n8n community node to npm and manage releases.

## Prerequisites

- **npm account**: Sign up at [npmjs.com](https://npmjs.com)
- **GitHub repository**: Public repo for your node
- **CI/CD setup**: GitHub Actions configured
- **Package configuration**: Correct `package.json`

## Package Configuration

### Required Fields

Your `package.json` must include:

```json
{
  "name": "n8n-nodes-your-node-name",
  "version": "1.0.0",
  "description": "Description of your node",
  "keywords": ["n8n-community-node-package"],
  "license": "MIT",
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/alejandrosnz/n8n-nodes-your-node-name.git"
  },
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": ["dist/credentials/YourCredentials.credentials.js"],
    "nodes": ["dist/nodes/YourNode/YourNode.node.js"]
  }
}
```

### Naming Convention

Follow n8n's naming convention:
- Package name: `n8n-nodes-{your-service-name}`
- Node name: `{yourServiceName}` (camelCase)
- Credential name: `{yourServiceName}Api`

**Important**: Choose a unique package name that you own on npm. Generic names like `n8n-nodes-starter` may already be taken or require special permissions. Consider using scoped packages (e.g., `@yourusername/n8n-nodes-your-service`) to avoid naming conflicts and ensure you have publish rights.

## Automated Releases with release-it

This boilerplate includes automated release management.

### Setup

1. **Install release-it globally** (optional):
   ```bash
   npm install -g release-it
   ```

2. **Configure npm token**:
   - Go to [npmjs.com](https://npmjs.com) → Access Tokens
   - Create a new token with "Automation" scope
   - Add to GitHub repository secrets as `NPM_TOKEN`

3. **Configure GitHub token** (for releases):
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Create token with `repo` and `workflow` permissions
   - Add to repository secrets as `GITHUB_TOKEN` (usually automatic)

### Release Process

```bash
# Preview release
npm run release -- --dry-run

# Patch release (1.0.0 → 1.0.1)
npm run release

# Minor release (1.0.0 → 1.1.0)
npm run release -- --release-as minor

# Major release (1.0.0 → 2.0.0)
npm run release -- --release-as major
```

#### Release Types Explained

**Patch Release (x.y.Z → x.y.Z+1)**:
- **When to use**: Bug fixes, security patches, small improvements
- **Examples**: Fixed error handling, corrected typos, performance optimizations
- **Impact**: Safe for automatic updates, no breaking changes

**Minor Release (x.Y.z → x.Y+1.0)**:
- **When to use**: New features that maintain backward compatibility
- **Examples**: Added new operation, new optional parameters, improved error messages
- **Impact**: May include new functionality, but existing workflows continue working

**Major Release (X.y.z → X+1.0.0)**:
- **When to use**: Breaking changes, API modifications, significant updates
- **Examples**: Removed operations, changed parameter names, authentication changes
- **Impact**: May require workflow updates, breaking changes for existing users

### What Happens During Release

1. **Version bump**: Updates `package.json` and creates git tag
2. **Changelog**: Generates release notes from commits
3. **Git operations**: Commits changes, creates tag, pushes
4. **GitHub release**: Creates GitHub release with changelog
5. **npm publish**: Publishes package to npm registry

## Manual Publishing

If you prefer manual control:

### 1. Build and Test

```bash
# Ensure everything works
npm run build
npm test
npm run lint
```

### 2. Update Version

```bash
# Manual version bump
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0
```

### 3. Publish to npm

```bash
# Login to npm
npm login

# Publish
npm publish

# Or publish with tag
npm publish --tag beta
```

### 4. Create GitHub Release

1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Select the tag created by `npm version`
4. Add release notes
5. Publish

## CI/CD Workflows

This boilerplate includes GitHub Actions for automated publishing.

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and PR:
- **Node.js matrix**: Tests on multiple Node versions
- **Linting**: ESLint with n8n rules
- **Type checking**: TypeScript compilation
- **Testing**: Jest with coverage
- **Building**: Ensures clean build

### Release Workflow (`.github/workflows/release.yml`)

Triggers on release creation:
- **Validation**: Checks working directory cleanliness
- **npm check**: Verifies version doesn't exist
- **Publishing**: Publishes to npm registry
- **Notifications**: Success/failure summaries

### Required Secrets

Add these to your GitHub repository secrets:

```
NPM_TOKEN=your_npm_automation_token
GITHUB_TOKEN=your_github_personal_access_token
```

## Version Management

### Semantic Versioning

Follow [semver](https://semver.org/):

- **MAJOR** (X.y.z → X+1.0.0): Breaking changes - API modifications, removed features
- **MINOR** (x.Y.z → x.Y+1.0): New features - backward compatible additions
- **PATCH** (x.y.Z → x.y.Z+1): Bug fixes - backward compatible bug fixes

### Practical Examples

**When to use PATCH release:**
- Fixed a bug in error handling
- Corrected a typo in user-facing messages
- Improved performance without changing behavior
- Security fixes

**When to use MINOR release:**
- Added a new operation to an existing resource
- Added optional parameters to existing operations
- Improved error messages or logging
- Enhanced validation without breaking existing workflows

**When to use MAJOR release:**
- Removed or renamed an operation
- Changed required parameters
- Modified authentication method
- Significant API restructuring

## Troubleshooting

### Common Issues

1. **"User [username] is not a collaborator for [package-name]"**
   - The package name is already taken or you don't have publish rights
   - Change the package name in `package.json` to a unique name you own
   - Consider using scoped packages: `@yourusername/n8n-nodes-your-service`
   - Verify your NPM_TOKEN is for the correct npm account

2. **"You cannot publish over the previously published versions"**
   - Version already exists on npm
   - Use `npm version patch` to bump version

3. **"Cannot publish with tag"**
   - Check npm permissions
   - Verify token has publish rights

4. **GitHub Actions failures**
   - Check repository secrets
   - Verify workflow file syntax
   - Check branch protection rules

### Publishing Checklist

- [ ] All tests pass
- [ ] Code is linted
- [ ] Build succeeds
- [ ] Version is bumped
- [ ] Changelog is updated
- [ ] npm token is configured
- [ ] GitHub token has correct permissions
- [ ] Repository is public (for public packages)

## Post-Publishing

### Update n8n Library

After publishing, your node will appear in n8n's community node library. This usually happens within a few hours.

### Monitor Usage

- Check npm download stats
- Monitor GitHub issues
- Watch for community feedback

### Maintenance

- Keep dependencies updated
- Fix security vulnerabilities
- Respond to user issues
- Plan feature releases

## Known Issues

### n8n-node Release Double-Bump Bug

Due to a limitation in the `n8n-node release` command, minor and major releases will include an additional patch increment. This means:

- **Patch release**: Works as expected (e.g., 1.0.0 → 1.0.1)
- **Minor release**: Results in minor + patch (e.g., 1.0.0 → 1.1.1)
- **Major release**: Results in major + patch (e.g., 1.0.0 → 2.0.1)

This happens because the workflow manually bumps the version for minor/major releases, but `n8n-node release` applies an additional patch increment on top of the already bumped version.

If you need precise semantic versioning, consider using `release-it` directly instead of `n8n-node release`.

## Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-npm-registry)
- [release-it Documentation](https://github.com/release-it/release-it)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [Semantic Versioning](https://semver.org/)