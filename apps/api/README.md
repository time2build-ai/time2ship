# API - TypeScript Express Server

A production-ready TypeScript Express API with best practices and modern tooling.

## Features

- ✅ **TypeScript** - Type safety and better developer experience
- ✅ **Express.js** - Fast, minimalist web framework
- ✅ **Security** - Helmet for security headers, CORS enabled
- ✅ **Error Handling** - Centralized error handling middleware
- ✅ **Async/Await** - Async handler wrapper for clean error handling
- ✅ **Logging** - Morgan HTTP request logger
- ✅ **Compression** - Response compression
- ✅ **Docker** - Multi-stage Docker build with health checks
- ✅ **ESLint** - Code linting with TypeScript support
- ✅ **Hot Reload** - Development mode with tsx watch

## Project Structure

```
apps/api/
├── src/
│   ├── index.ts              # Application entry point
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── middleware/
│   │   ├── errorHandler.ts   # Global error handler
│   │   ├── notFoundHandler.ts # 404 handler
│   │   └── asyncHandler.ts   # Async wrapper utility
│   └── routes/
│       ├── index.ts          # Main router
│       └── example.routes.ts # Example route module
├── dist/                     # Compiled JavaScript (generated)
├── Dockerfile               # Docker configuration
├── .dockerignore            # Docker ignore rules
├── .env.example             # Environment variables template
├── .eslintrc.json           # ESLint configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js 20+ installed
- npm or yarn package manager

### Installation

1. Navigate to the API directory:
```bash
cd apps/api
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration

### Development

Start the development server with hot reload:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### Production Build

Build the TypeScript code:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

### Linting

Run ESLint:
```bash
npm run lint
```

Type checking:
```bash
npm run type-check
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server health status and uptime.

### API Root
```
GET /api
```
Returns API information and available endpoints.

### Example Routes
```
GET    /api/example       # Get all examples
GET    /api/example/:id   # Get example by ID
POST   /api/example       # Create new example
```

## Docker

### Build Docker Image
```bash
docker build -t api:latest .
```

### Run Docker Container
```bash
docker run -p 3001:3001 --env-file .env api:latest
```

### Docker Compose
The API can be integrated with the root-level docker-compose.yml for multi-container setups.

## Environment Variables

See [.env.example](.env.example) for all available configuration options.

Key variables:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `CORS_ORIGIN` - Allowed CORS origin

## Error Handling

The API uses centralized error handling:

- **AppError** - Custom error class for operational errors
- **errorHandler** - Global error middleware
- **asyncHandler** - Wrapper for async route handlers

Example:
```typescript
import { AppError } from './middleware/errorHandler';
import { asyncHandler } from './middleware/asyncHandler';

router.get('/example', asyncHandler(async (req, res) => {
  if (!condition) {
    throw new AppError('Custom error message', 400);
  }
  // Your code here
}));
```

## Adding New Routes

1. Create a new route file in `src/routes/`:
```typescript
// src/routes/myroute.routes.ts
import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json({ success: true, data: 'Hello World' });
}));

export default router;
```

2. Register the route in `src/routes/index.ts`:
```typescript
import myRoutes from './myroute.routes';
router.use('/myroute', myRoutes);
```

## Type Safety

All responses use the `ApiResponse` type for consistency:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## Contributing

1. Follow the existing code structure
2. Use TypeScript strict mode
3. Handle errors properly with AppError
4. Add types for all data structures
5. Test your endpoints

## License

ISC
