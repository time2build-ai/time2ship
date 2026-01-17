/**
 * VIOLATIONS.TS - Example code with multiple Express best practice violations
 *
 * This file demonstrates INCORRECT patterns that violate security, performance,
 * architecture, and code quality rules. DO NOT use these patterns in production.
 *
 * See correct.ts for the proper implementations.
 */

import { Request, Response } from 'express';
import { db } from '../db';

// VIOLATION: sec-secrets-env - Hardcoded secrets
const JWT_SECRET = 'my-super-secret-key-123';
const DB_PASSWORD = 'admin123';

// VIOLATION: arch-no-business-in-routes - Business logic in route handler
// VIOLATION: arch-no-db-in-routes - Direct database access in routes
// VIOLATION: arch-no-any-types - Using 'any' type
// VIOLATION: arch-explicit-return-types - Missing return type
// VIOLATION: sec-input-validation-zod - No input validation
// VIOLATION: sec-error-leakage - Exposing internal errors
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    // VIOLATION: sec-auth-password-hashing - Storing plain text password
    // VIOLATION: sec-sql-injection-drizzle - SQL injection vulnerability
    const result = await db.execute(
      `INSERT INTO users (email, password, role) VALUES ('${email}', '${password}', '${role}')`
    );

    // VIOLATION: arch-no-business-in-routes - Business logic in route
    if (role === 'admin') {
      // Grant special permissions
      await db.execute(`UPDATE users SET permissions = 'all' WHERE email = '${email}'`);
    }

    res.json({ success: true, userId: result.insertId });
  } catch (error: any) {
    // VIOLATION: sec-error-leakage - Exposing stack traces
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

// VIOLATION: perf-n-plus-one - N+1 query problem
// VIOLATION: perf-select-specific - Selecting all columns
// VIOLATION: quality-magic-values - Magic numbers
export const getUsers = async (req: Request, res: Response) => {
  const users = await db.execute('SELECT * FROM users LIMIT 100');

  // N+1 query - fetching posts for each user individually
  for (const user of users as any[]) {
    user.posts = await db.execute(`SELECT * FROM posts WHERE user_id = ${user.id}`);
  }

  res.json(users);
};

// VIOLATION: sec-authorize-middleware - No authorization check
// VIOLATION: sec-path-traversal - Path traversal vulnerability
// VIOLATION: quality-naming-conventions - Unclear function name
export const getFile = async (req: Request, res: Response) => {
  const { filename } = req.params;

  // VIOLATION: sec-path-traversal - Allows ../../../etc/passwd
  const fs = require('fs');
  const content = fs.readFileSync(`./uploads/${filename}`, 'utf8');

  res.send(content);
};

// VIOLATION: perf-avoid-blocking - Synchronous blocking operation
// VIOLATION: arch-async-handler-wrapper - No error handling wrapper
export const processData = (req: Request, res: Response) => {
  const data = req.body.data;

  // Blocking CPU-intensive operation
  let result = 0;
  for (let i = 0; i < 1000000000; i++) {
    result += Math.sqrt(i);
  }

  res.json({ result });
};

// VIOLATION: sec-xss-prevention - XSS vulnerability
// VIOLATION: quality-no-magic-values - Magic strings
export const renderTemplate = async (req: Request, res: Response) => {
  const { name } = req.query;

  // VIOLATION: sec-xss-prevention - Direct HTML injection
  const html = `<h1>Hello ${name}!</h1>`;
  res.send(html);
};

// VIOLATION: perf-pagination - No pagination for large datasets
// VIOLATION: perf-select-specific - Selecting unnecessary data
// VIOLATION: perf-cache-headers - No caching headers
export const getAllProducts = async (req: Request, res: Response) => {
  // Returns all products without pagination
  const products = await db.execute('SELECT * FROM products');
  res.json(products);
};

// VIOLATION: sec-rate-limiting - No rate limiting on sensitive endpoint
// VIOLATION: sec-auth-token-expiry - Token never expires
// VIOLATION: arch-custom-error-classes - Generic error handling
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // VIOLATION: sec-auth-password-hashing - Plain text comparison
  const user = await db.execute(
    `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`
  );

  if (!user) {
    throw new Error('Login failed');
  }

  // VIOLATION: sec-auth-token-expiry - No expiration set
  // VIOLATION: sec-auth-jwt-secret - Weak secret
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ userId: (user as any).id }, 'secret123');

  res.json({ token });
};

// VIOLATION: quality-import-order - Imports at wrong location
const bcrypt = require('bcrypt');
const validator = require('validator');

// VIOLATION: perf-connection-pooling - Creating new connection per request
// VIOLATION: arch-services-throw-errors - Not using service layer
export const updateProfile = async (req: Request, res: Response) => {
  const mysql = require('mysql2/promise');
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: DB_PASSWORD, // Hardcoded password
    database: 'myapp'
  });

  const { userId, bio } = req.body;
  await connection.execute(
    `UPDATE users SET bio = '${bio}' WHERE id = ${userId}`
  );

  await connection.end();
  res.json({ success: true });
};

// VIOLATION: sec-cors-config - Overly permissive CORS
// VIOLATION: quality-feature-structure - Not following feature structure
export const cors = require('cors');
export const corsOptions = {
  origin: '*', // Allows all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};

// VIOLATION: perf-compression - Not using compression
// VIOLATION: perf-streaming - Loading entire file into memory
export const downloadLargeFile = async (req: Request, res: Response) => {
  const fs = require('fs');
  const data = fs.readFileSync('./large-file.zip'); // Loads entire file
  res.send(data);
};

// VIOLATION: quality-barrel-exports - Individual exports instead of barrel
export { createUser, getUsers, getFile };
