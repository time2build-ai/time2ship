# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Renovate bot configuration for automated dependency updates
- Redis-based rate limiting for API endpoints
  - Global rate limiting (100 requests per 15 minutes)
  - Authentication rate limiting (5 attempts per 15 minutes)
  - Password reset rate limiting (3 attempts per hour)
  - Slow-down middleware for gradual request throttling
- GitHub issue templates (bug reports and feature requests)
- GitHub pull request template
- Sentry error monitoring integration for both API and client
  - Performance monitoring with configurable sample rates
  - Session replay for client-side errors
  - Automatic error capture and reporting
- CHANGELOG.md file for tracking project changes

### Changed

- Updated API middleware to include rate limiting on authentication routes
- Enhanced environment configuration to support Redis and Sentry

### Security

- Implemented rate limiting to prevent brute force attacks
- Added request slow-down to mitigate authentication abuse

## [1.0.0] - YYYY-MM-DD

### Added

- Initial release of Time2Ship boilerplate
- Next.js 16 client application with TypeScript
- Express API with TypeScript
- PostgreSQL database with Drizzle ORM
- JWT-based authentication system
- User management features
- Password reset with OTP
- Email integration with Nodemailer
- Swagger API documentation
- Comprehensive test suites
- Docker and Docker Compose setup
- CI/CD with GitHub Actions
- Husky pre-commit hooks
- ESLint and Prettier configuration
- Monorepo structure with workspaces

[Unreleased]: https://github.com/yourusername/time2ship/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/time2ship/releases/tag/v1.0.0
