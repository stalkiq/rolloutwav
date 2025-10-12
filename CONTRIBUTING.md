## Contributing

Thank you for contributing! Please follow these guidelines to keep quality high.

### Branching

- Create feature branches from `main`: `feature/your-feature`
- Use `fix/your-fix` for bug fixes and `chore/` for chores

### Commits

- Use Conventional Commits: `type(scope): short description`
- Common types: feat, fix, docs, style, refactor, perf, test, build, chore, ci

### Pull Requests

- Ensure `npm ci && npm run typecheck && npm run lint && npm run build` succeed
- Fill out the PR template and include screenshots for UI changes
- Link related issues (e.g., Closes #123)
- Squash merge is recommended

### Code Style

- Editor picks up settings from `.editorconfig`
- Keep functions small and readable; prefer early returns

### Releasing

- Releases are automated with semantic-release on `main`


