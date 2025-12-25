# CLAUDE.md - Guidelines for Claude Code

This file provides guidance for Claude Code when working on this project.

## CRITICAL: Test-First Development

**ALWAYS write tests BEFORE implementation code.**

This is non-negotiable. Every feature, bug fix, or change MUST follow this workflow:

1. **Write the test first** - Define expected behavior before writing any implementation
2. 2. **Run the test** - Verify it fails (red phase)
   3. 3. **Write minimal implementation** - Only enough code to make the test pass
      4. 4. **Run the test** - Verify it passes (green phase)
         5. 5. **Refactor** - Improve code quality while keeping tests green
            6. 6. **Commit** - With descriptive message following conventional commits
              
               7. ## Development Workflow
              
               8. ### Before Writing Any Code
              
               9. 1. Understand the requirement completely
                  2. 2. Write test cases that define the expected behavior
                     3. 3. Consider edge cases and error conditions
                        4. 4. Write tests for those edge cases too
                          
                           5. ### Test Structure
                          
                           6. ```javascript
                              describe('FeatureName', () => {
                                describe('functionName', () => {
                                  it('should [expected behavior] when [condition]', () => {
                                    // Arrange - set up test data
                                    // Act - call the function
                                    // Assert - verify the result
                                  });
                                });
                              });
                              ```

                              ### Commit Messages

                              Follow conventional commits:
                              - `feat:` new features
                              - - `fix:` bug fixes
                                - - `test:` adding or updating tests
                                  - - `docs:` documentation changes
                                    - - `refactor:` code refactoring
                                      - - `chore:` maintenance tasks
                                       
                                        - ## Project Structure
                                       
                                        - ```
                                          cards/
                                          ├── src/              # Source code
                                          │   └── index.js      # Main entry point
                                          ├── tests/            # Test files
                                          │   ├── unit/         # Unit tests
                                          │   └── integration/  # Integration tests
                                          ├── .github/
                                          │   └── workflows/    # CI/CD workflows
                                          ├── package.json      # Dependencies and scripts
                                          └── jest.config.js    # Jest configuration
                                          ```

                                          ## Commands

                                          ```bash
                                          npm test              # Run all tests
                                          npm run test:watch    # Run tests in watch mode
                                          npm run test:coverage # Run tests with coverage
                                          npm run lint          # Run ESLint
                                          npm run lint:fix      # Fix linting issues
                                          npm start             # Run the application
                                          ```

                                          ## Code Quality Standards

                                          - All new code MUST have tests
                                          - - Test coverage should be maintained above 80%
                                            - - No code should be merged without passing CI
                                              - - Use meaningful variable and function names
                                                - - Keep functions small and focused
                                                  - - Document complex logic with comments
                                                   
                                                    - ## When Asked to Implement a Feature
                                                   
                                                    - 1. **Ask clarifying questions** if requirements are unclear
                                                      2. 2. **Write tests first** that capture the requirements
                                                         3. 3. **Show the failing tests** to the user
                                                            4. 4. **Implement the feature** to make tests pass
                                                               5. 5. **Refactor if needed** while keeping tests green
                                                                  6. 6. **Update documentation** if necessary
                                                                    
                                                                     7. ## Do NOT
                                                                    
                                                                     8. - Write implementation code without tests
                                                                        - - Skip tests for "simple" functions
                                                                          - - Commit code that breaks existing tests
                                                                            - - Ignore test coverage requirements
                                                                              - - Write tests after implementation (except for legacy code)
                                                                               
                                                                                - ## Remember
                                                                               
                                                                                - Tests are not optional. Tests are not an afterthought. Tests come FIRST.
                                                                               
                                                                                - This project values quality and maintainability over speed. Take the time to write proper tests.
