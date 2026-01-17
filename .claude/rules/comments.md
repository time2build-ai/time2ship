---
paths: apps/**/*.{ts,js,tsx,jsx}
---

# Documentation Comments

Apply JSDoc/TSDoc comments to functions, classes, and complex types to improve code understanding and maintainability.

## When to Add Documentation

**Required:**
- Public APIs and exported functions
- Complex business logic functions
- Class methods (especially public ones)
- Custom types and interfaces with non-obvious purposes
- Functions with non-trivial parameters or return values

**Not Required:**
- Self-explanatory code (e.g., simple getters/setters)
- Private utility functions with obvious purposes
- Test files (unless testing complex scenarios)

## Standard Tags

Use these JSDoc/TSDoc tags consistently:

- `@param {Type} name - Description` - Document each parameter
- `@returns {Type} Description` - Document return value
- `@throws {ErrorType} Description` - Document thrown errors
- `@example` - Provide usage examples for complex functions
- `@deprecated` - Mark deprecated code with migration path

## Guidelines

1. **Be Concise**: Explain *why* and *what*, not obvious *how*
2. **Update Comments**: Keep documentation in sync with code changes
3. **Avoid Redundancy**: Don't restate what the code clearly shows
4. **Use Examples**: Add `@example` for complex APIs
5. **Document Edge Cases**: Explain non-obvious behavior or limitations

## Examples

### Good - Clear and Informative

```typescript
/**
 * Authenticates user credentials and generates a JWT token.
 *
 * @param email - User's email address
 * @param password - Plain text password (will be hashed internally)
 * @returns JWT token valid for 24 hours
 * @throws {UnauthorizedError} If credentials are invalid
 * @throws {RateLimitError} If too many attempts from same IP
 *
 * @example
 * const token = await authenticateUser('user@example.com', 'password123');
 */
async function authenticateUser(email: string, password: string): Promise<string> {
  // implementation
}
```

### Bad - Redundant and Unhelpful

```typescript
/**
 * Gets the user name.
 * @param user - The user
 * @returns The name
 */
function getUserName(user: User): string {
  return user.name;
}
```

### Good - Simple Code Needs No Comment

```typescript
// No comment needed - self-explanatory
function getUserName(user: User): string {
  return user.name;
}
```

## React/JSX Specific

For React components, document props and component behavior:

```typescript
/**
 * User profile card displaying avatar, name, and bio.
 * Handles loading and error states automatically.
 *
 * @param userId - Unique identifier for the user
 * @param onEdit - Callback fired when edit button is clicked
 * @throws {NotFoundError} If user doesn't exist
 */
export function UserProfile({ userId, onEdit }: UserProfileProps) {
  // implementation
}
```
