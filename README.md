# Cards

A Node.js project managed with Claude Code following test-driven development practices.

## Prerequisites

- Node.js >= 18.x
- - npm >= 9.x
 
  - ## Installation
 
  - ```bash
    git clone https://github.com/agileguy/cards.git
    cd cards
    npm install
    ```

    ## Usage

    ```bash
    npm start
    ```

    ## Development

    This project follows a strict test-first development methodology. See [TESTING.md](./TESTING.md) for our testing philosophy and guidelines.

    ### Running Tests

    ```bash
    # Run all tests
    npm test

    # Run tests in watch mode
    npm run test:watch

    # Run tests with coverage
    npm run test:coverage
    ```

    ### Linting

    ```bash
    npm run lint
    npm run lint:fix
    ```

    ## Project Structure

    ```
    cards/
    ├── src/              # Source code
    ├── tests/            # Test files
    ├── .github/          # GitHub Actions workflows
    ├── CLAUDE.md         # Claude Code guidelines
    ├── TESTING.md        # Testing documentation
    ├── CHANGELOG.md      # Version history
    └── package.json      # Project configuration
    ```

    ## Versioning

    This project uses [Semantic Versioning](https://semver.org/). See [CHANGELOG.md](./CHANGELOG.md) for release history.

    ## Contributing

    1. Write tests first (TDD approach)
    2. 2. Ensure all tests pass
       3. 3. Follow existing code style
          4. 4. Update documentation as needed
            
             5. ## License
            
             6. ISC
