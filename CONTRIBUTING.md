# Contributing

Thank you for your interest in contributing to the n8n-nodes-universal-llm-vision! This document provides guidelines for contributors.

## Ways to Contribute

- **Bug reports**: Report issues in the [issue tracker](https://github.com/alejandrosnz/n8n-nodes-universal-llm-vision/issues)
- **Feature requests**: Suggest new features or improvements
- **Code contributions**: Submit pull requests with fixes or enhancements
- **Documentation**: Improve documentation or add examples
- **Testing**: Add test cases or improve test coverage

## Development Setup

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed setup instructions.

## Pull Request Process

1. **Fork** the repository
2. **Create a feature branch** from `master`
3. **Make your changes** following the guidelines below
4. **Add tests** for new functionality
5. **Update documentation** if needed
6. **Run the test suite** to ensure everything works
7. **Submit a pull request** with a clear description

### Branch Naming

Use descriptive branch names:
- `feature/add-new-operation`
- `fix/credential-validation`
- `docs/update-api-examples`
- `test/add-workflow-tests`

### Commit Messages

Follow conventional commit format:
- `feat: add new operation for user management`
- `fix: resolve credential validation issue`
- `docs: update development setup guide`
- `test: add integration tests for API calls`

## Code Guidelines

### TypeScript

- Use TypeScript for all new code
- Maintain strict type checking
- Avoid `any` types when possible
- Use interfaces for complex objects

### Architecture

- Follow the Resource/Operation pattern
- Keep operations focused and single-purpose
- Use declarative routing configuration
- Maintain n8n Agents compatibility

### Testing

- Write tests for all new functionality
- Maintain or improve test coverage
- Use descriptive test names
- Mock external dependencies

### Documentation

- Update README for significant changes
- Add JSDoc comments for public APIs
- Keep examples current and working

## Code Review Process

All submissions require review. Reviewers will check for:

- **Functionality**: Does the code work as intended?
- **Code quality**: Is the code clean, readable, and well-structured?
- **Testing**: Are there adequate tests?
- **Documentation**: Is documentation updated?
- **Compatibility**: Does it maintain n8n compatibility?

## Issue Reporting

When reporting bugs, please include:

- **Description**: Clear description of the issue
- **Steps to reproduce**: Step-by-step instructions
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: Node version, n8n version, OS
- **Logs**: Relevant error messages or logs

## Feature Requests

For feature requests:

- **Use case**: Describe your use case
- **Current workaround**: How do you currently handle this?
- **Proposed solution**: What would you like to see?
- **Alternatives**: Have you considered other approaches?

## Community

- **Discussions**: Use [GitHub Discussions](https://github.com/alejandrosnz/n8n-nodes-universal-llm-vision/discussions) for questions
- **Issues**: Use [GitHub Issues](https://github.com/alejandrosnz/n8n-nodes-universal-llm-vision/issues) for bugs and features
- **Code of Conduct**: Be respectful and inclusive

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.

## Recognition

Contributors are recognized in the project's README and release notes. Thank you for helping improve the n8n community!