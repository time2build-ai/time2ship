# README Simplification Design

**Date:** 2026-01-18
**Status:** Approved

## Overview

Simplify the main README.md by moving detailed content to `/docs` directory while maintaining support for both users (discovering/using the boilerplate) and contributors (developing the boilerplate itself).

## Goals

1. Transform README into a clean, marketing-style landing page
2. Feature `npx create-time2ship` as the primary call-to-action
3. Move all detailed documentation to organized `/docs` files
4. Provide clear navigation for both user types

## Simplified README Structure

**Target Length:** ~150-200 lines (down from 647)

### Sections:

1. **Hero Section**
   - Title, badges, one-sentence value proposition
   - Primary CTA: `npx create-time2ship my-app`

2. **What is Time2Ship**
   - 2-3 sentences explaining the boilerplate

3. **Features**
   - Condensed highlights (8-10 key features in simple list)
   - Remove detailed feature tables

4. **Quick Start**
   - Just the `npx create-time2ship` command
   - 2-3 follow-up steps
   - Link to getting-started.md

5. **Documentation Links**
   - Clear navigation to all docs files
   - Organized by topic

6. **Two Paths Section**
   - "Using Time2Ship" path → getting-started.md
   - "Contributing" path → contributing.md

7. **Support/License Footer**
   - Minimal, essential info only

## Documentation Organization

### New Files in `/docs`:

#### `/docs/getting-started.md`
**Content from current README:**
- Prerequisites (lines 127-137)
- Development options - Docker & Local (lines 195-255)
- Environment configuration (lines 427-474)
- Database setup (lines 257-291)
- Available scripts (lines 293-345)
- Troubleshooting (new section)

**Structure:**
- Prerequisites
- Installation Options
  - Using npx create-time2ship (preferred)
  - Cloning directly (for customization)
- Development Setup
  - Docker (Recommended)
  - Local Development
- Environment Variables
  - API Configuration
  - Client Configuration
- Database Management
  - Migrations
  - Seeding
  - Drizzle Studio
- Available Scripts
  - Root commands
  - Client commands
  - API commands
  - Database commands
- Troubleshooting

#### `/docs/architecture.md`
**Content from current README:**
- Tech stack details (lines 54-99)
- Project structure (lines 101-125)
- Backend architecture (lines 476-511)
- Frontend architecture (lines 512-547)

**Structure:**
- Overview
- Tech Stack
  - Frontend Stack
  - Backend Stack
  - DevOps & Tools
- Project Structure
  - Monorepo Layout
  - Directory Conventions
- Backend Architecture
  - Feature-based Structure
  - Key Principles
  - Module Organization
- Frontend Architecture
  - App Router Pattern
  - Feature Organization
  - Key Principles

#### `/docs/authentication.md`
**Content from current README:**
- Authentication section (lines 393-425)

**Structure:**
- Overview
- Features
- How It Works
  - JWT Access Tokens
  - Refresh Tokens
  - httpOnly Cookies
- API Endpoints
- Usage Examples
- Customization Guide

#### `/docs/testing.md`
**Content from current README:**
- Testing section (lines 347-391)

**Structure:**
- Overview
- Unit & Integration Tests
  - Running Tests
  - Watch Mode
  - Coverage Reports
  - Test Organization
- E2E Tests
  - Running E2E Tests
  - Docker Test Environment
  - Cleanup
- Writing Tests
  - Best Practices
  - Test Structure
  - Mocking

#### `/docs/deployment.md`
**Content from current README:**
- Deployment section (lines 576-602)

**Structure:**
- Overview
- Building for Production
  - API Build
  - Client Build
- Docker Production
  - docker-compose.prod.yml
  - Production Environment Variables
- Platform-Specific Guides
  - Vercel (Client)
  - Railway/Render (API)
  - Database Hosting
- Production Checklist
  - Security
  - Environment Variables
  - Database Migrations

#### `/docs/contributing.md`
**Content from current README:**
- Contributing section (lines 614-625)
- Git workflow (lines 549-574)

**Structure:**
- Getting Started
  - Cloning the Repository
  - Setting Up Development
  - Running the Full Stack
- Development Workflow
  - Creating Branches
  - Making Changes
  - Running Tests
- Git Workflow
  - Pre-commit Hooks
  - Pre-push Hooks
  - Manual Review
- Code Quality Standards
  - TypeScript
  - ESLint
  - Testing Requirements
- Submitting Changes
  - Conventional Commits
  - Pull Request Process
  - Code Review

#### Existing: `/docs/HUSKY.md`
**Status:** Keep as-is, reference from contributing.md

## Content Migration Map

| Current README Section | New Location |
|------------------------|--------------|
| Lines 127-255 (Getting Started, Dev Options) | `/docs/getting-started.md` |
| Lines 257-291 (Database Setup) | `/docs/getting-started.md#database` |
| Lines 293-345 (Scripts) | `/docs/getting-started.md#available-scripts` |
| Lines 347-391 (Testing) | `/docs/testing.md` |
| Lines 393-425 (Authentication) | `/docs/authentication.md` |
| Lines 427-474 (Environment Variables) | `/docs/getting-started.md#environment-variables` |
| Lines 476-547 (Architecture) | `/docs/architecture.md` |
| Lines 549-574 (Git Workflow) | `/docs/contributing.md#git-workflow` |
| Lines 576-602 (Deployment) | `/docs/deployment.md` |
| Lines 614-625 (Contributing) | `/docs/contributing.md` |

## npx create-time2ship Integration

### Positioning
- **Primary CTA** in hero section
- Featured above all other content
- Clear 3-step quick start

### Explanation
- Scaffolds a new project from this boilerplate
- Handles all initial setup
- Links to getting-started.md for next steps

### Example:
```bash
npx create-time2ship my-app
cd my-app
npm run dev
```

## Implementation Steps

1. Create all new documentation files in `/docs`
2. Migrate content from README to respective docs
3. Enhance documentation with additional details/examples
4. Rewrite README.md from scratch (don't edit existing)
5. Add clear navigation/links between docs
6. Update any references in app-specific CLAUDE.md files
7. Commit with clear message about documentation restructure

## Success Criteria

- README.md is under 200 lines
- All detailed content is preserved in `/docs`
- Clear navigation paths for both users and contributors
- `npx create-time2ship` is prominently featured
- No broken links
- Improved discoverability of information
