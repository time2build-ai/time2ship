# sec-path-traversal

Prevent path traversal attacks by validating file paths and never directly using user input in file operations. Use path normalization and whitelist allowed directories.

## ❌ WRONG

```typescript
// routes/files.routes.ts - PATH TRAVERSAL VULNERABILITY
import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// CRITICAL: Using user input directly in file path
router.get('/files/:filename', (req, res) => {
  const { filename } = req.params;

  // Attacker could use: "../../../../etc/passwd"
  const filePath = `./uploads/${filename}`;

  fs.readFile(filePath, (err, data) => {
    if (err) {
      return res.status(404).send('File not found');
    }
    res.send(data);
  });
});

// WRONG: Path.join doesn't prevent traversal
router.get('/downloads/:category/:file', (req, res) => {
  const { category, file } = req.params;

  // Still vulnerable: "../../../etc/passwd"
  const filePath = path.join('./downloads', category, file);

  res.sendFile(filePath);
});

// WRONG: Allowing any file extension
router.post('/upload', upload.single('file'), (req, res) => {
  const filename = req.file?.originalname;

  // Attacker could upload "malware.exe" or "shell.php"
  const destination = `./uploads/${filename}`;

  fs.renameSync(req.file!.path, destination);
  res.json({ path: destination });
});
```

## ✅ CORRECT

```typescript
// utils/file-security.ts
import path from 'path';
import fs from 'fs/promises';
import { AppError } from './errors';

/**
 * Validate and sanitize filename
 */
export const sanitizeFilename = (filename: string): string => {
  // Remove any path separators and null bytes
  return filename
    .replace(/[/\\]/g, '')
    .replace(/\0/g, '')
    .replace(/\.\./g, '')
    .trim();
};

/**
 * Validate file is within allowed directory
 */
export const validateFilePath = (
  filePath: string,
  allowedDir: string
): void => {
  // Resolve absolute paths
  const resolvedPath = path.resolve(filePath);
  const resolvedBase = path.resolve(allowedDir);

  // Ensure file is within allowed directory
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new AppError(
      'Access denied: Invalid file path',
      403
    );
  }
};

/**
 * Get allowed file extensions
 */
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', // Images
  '.pdf', // Documents
  '.txt', '.md', // Text
]);

/**
 * Validate file extension
 */
export const validateFileExtension = (filename: string): void => {
  const ext = path.extname(filename).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new AppError(
      `File type not allowed. Allowed: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`,
      400
    );
  }
};

/**
 * Safely get file path within uploads directory
 */
export const getSafeFilePath = (
  filename: string,
  baseDir: string = './uploads'
): string => {
  // Sanitize filename
  const safeName = sanitizeFilename(filename);

  if (!safeName) {
    throw new AppError('Invalid filename', 400);
  }

  // Validate extension
  validateFileExtension(safeName);

  // Construct path
  const filePath = path.join(baseDir, safeName);

  // Validate path is within base directory
  validateFilePath(filePath, baseDir);

  return filePath;
};

// schemas/file.schemas.ts
import { z } from 'zod';

export const fileParamsSchema = {
  params: z.object({
    filename: z
      .string()
      .min(1)
      .max(255)
      .regex(
        /^[a-zA-Z0-9-_\.]+$/,
        'Filename can only contain alphanumeric characters, hyphens, underscores, and dots'
      )
      .refine(
        (name) => !name.startsWith('.'),
        'Filename cannot start with a dot'
      )
      .refine(
        (name) => !name.includes('..'),
        'Filename cannot contain ..'
      ),
  }),
};

export const downloadParamsSchema = {
  params: z.object({
    category: z.enum(['images', 'documents', 'exports']),
    filename: z
      .string()
      .regex(/^[a-zA-Z0-9-_\.]+$/)
      .refine((name) => !name.includes('..')),
  }),
};

// routes/files.routes.ts - SECURE
import { Router, Request, Response } from 'express';
import { validate } from '@/middleware/validate';
import { fileParamsSchema, downloadParamsSchema } from '@/schemas/file.schemas';
import { getSafeFilePath, validateFileExtension } from '@/utils/file-security';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { nanoid } from 'nanoid';

const router = Router();

// Secure file download
router.get(
  '/files/:filename',
  validate(fileParamsSchema),
  async (req: Request, res: Response) => {
    try {
      const filePath = getSafeFilePath(req.params.filename);

      // Verify file exists
      await fs.access(filePath);

      // Send file with proper content-type
      res.sendFile(path.resolve(filePath), {
        dotfiles: 'deny', // Prevent accessing hidden files
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return res.status(404).json({ error: 'File not found' });
      }
      throw error;
    }
  }
);

// Secure categorized downloads with whitelisted categories
router.get(
  '/downloads/:category/:filename',
  validate(downloadParamsSchema),
  async (req: Request, res: Response) => {
    const { category, filename } = req.params;

    // Whitelist of allowed directories
    const categoryDirs: Record<string, string> = {
      images: './uploads/images',
      documents: './uploads/documents',
      exports: './uploads/exports',
    };

    const baseDir = categoryDirs[category];
    const filePath = getSafeFilePath(filename, baseDir);

    // Verify file exists
    await fs.access(filePath);

    res.sendFile(path.resolve(filePath), {
      dotfiles: 'deny',
    });
  }
);

// Secure file upload with extension validation
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = './uploads/temp';
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with safe characters
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${nanoid()}-${Date.now()}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    try {
      validateFileExtension(file.originalname);
      cb(null, true);
    } catch (error) {
      cb(error as Error);
    }
  },
});

router.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Additional validation
    validateFileExtension(req.file.filename);

    // Move to permanent location with safe path
    const finalDir = './uploads/files';
    await fs.mkdir(finalDir, { recursive: true });

    const finalPath = path.join(finalDir, req.file.filename);
    validateFilePath(finalPath, finalDir);

    await fs.rename(req.file.path, finalPath);

    res.status(201).json({
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  }
);

export default router;
```

## Why This Matters

- **Security Impact**: Path traversal allows attackers to read/write files outside intended directories, leading to source code disclosure, configuration file theft, password file access, and arbitrary file upload
- **OWASP Reference**: [A01:2021 - Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- **Path Resolution**: Always resolve paths to absolute paths and verify they're within the allowed directory tree
- **Sanitization**: Remove path separators (/, \), parent directory references (..), and null bytes from user input
- **Whitelist Approach**: Use enums or whitelists for categories/directories rather than accepting arbitrary paths
- **File Extensions**: Validate and whitelist allowed file extensions to prevent uploading executable files
- **Unique Filenames**: Generate unique filenames instead of using user-provided names to prevent overwriting and collisions
- **Defense in Depth**: Combine filename sanitization, path validation, extension whitelisting, and file size limits
- **Common Attacks**: ../../../etc/passwd, %2e%2e%2f (URL encoded), ..\/..\/windows/system32, ..\..\..\
