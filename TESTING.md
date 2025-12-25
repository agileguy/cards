# Testing Guide

This document outlines our testing philosophy, practices, and guidelines for the Cards project.

## Testing Philosophy

**We practice Test-Driven Development (TDD).** This means:

1. **Write tests FIRST** - Before writing any implementation code
2. 2. **Red-Green-Refactor** - See the test fail, make it pass, then improve the code
   3. 3. **Tests as Documentation** - Tests should clearly describe expected behavior
     
      4. ## Test Structure
     
      5. We use **Jest** as our testing framework.
     
      6. ```
         tests/
         ├── unit/           # Unit tests for individual functions/modules
         ├── integration/    # Integration tests for module interactions
         └── e2e/            # End-to-end tests (if applicable)
         ```

         ## Writing Tests

         ### Naming Conventions

         - Test files: `*.test.js` or `*.spec.js`
         - - Describe blocks: Use the module/function name
           - - Test cases: Start with "should" to describe expected behavior
            
             - ### Example Test Structure
            
             - ```javascript
               describe('ModuleName', () => {
                 describe('functionName', () => {
                   it('should return expected value when given valid input', () => {
                     // Arrange
                     const input = 'test';

                     // Act
                     const result = functionName(input);

                     // Assert
                     expect(result).toBe('expected');
                   });

                   it('should throw error when given invalid input', () => {
                     expect(() => functionName(null)).toThrow();
                   });
                 });
               });
               ```

               ## Running Tests

               ```bash
               # Run all tests
               npm test

               # Run tests in watch mode (recommended during development)
               npm run test:watch

               # Run tests with coverage report
               npm run test:coverage

               # Run specific test file
               npm test -- path/to/test.test.js
               ```

               ## Coverage Requirements

               We aim for meaningful coverage, not arbitrary percentages. However, as a guideline:

               - **Statements**: 80%+
               - - **Branches**: 75%+
                 - - **Functions**: 80%+
                   - - **Lines**: 80%+
                    
                     - ## TDD Workflow
                    
                     - 1. **Write a failing test** that describes the feature/fix
                       2. 2. **Run the test** - verify it fails for the right reason
                          3. 3. **Write minimal code** to make the test pass
                             4. 4. **Run the test** - verify it passes
                                5. 5. **Refactor** - improve code quality while keeping tests green
                                   6. 6. **Repeat**
                                     
                                      7. ## Best Practices
                                     
                                      8. - Keep tests focused and atomic
                                         - - One assertion per test when possible
                                           - - Use descriptive test names
                                             - - Avoid testing implementation details
                                               - - Mock external dependencies
                                                 - - Keep tests fast
                                                   - - Tests should be deterministic (no random/time-dependent behavior)
                                                    
                                                     - ## Mocking
                                                    
                                                     - Use Jest's built-in mocking capabilities:
                                                    
                                                     - ```javascript
                                                       // Mock a module
                                                       jest.mock('./module');

                                                       // Mock a function
                                                       const mockFn = jest.fn().mockReturnValue('mocked');

                                                       // Spy on a method
                                                       jest.spyOn(object, 'method');
                                                       ```

                                                       ## Continuous Integration

                                                       Tests run automatically on every push and pull request via GitHub Actions. PRs cannot be merged if tests fail.
