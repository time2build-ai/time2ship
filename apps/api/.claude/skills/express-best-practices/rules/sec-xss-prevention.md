# sec-xss-prevention

Prevent Cross-Site Scripting (XSS) by sanitizing output, setting proper Content-Type headers, and implementing Content Security Policy (CSP). Never render user input as HTML without sanitization.

## ❌ WRONG

```typescript
// routes/comments.routes.ts - XSS VULNERABLE
import { Router } from 'express';

const router = Router();

// Rendering user input as HTML
router.get('/comments/:id', async (req, res) => {
  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, req.params.id));

  // CRITICAL: Sending HTML with user content
  // If comment.text contains "<script>alert('XSS')</script>", it will execute
  res.send(`
    <html>
      <body>
        <h1>${comment.title}</h1>
        <p>${comment.text}</p>
      </body>
    </html>
  `);
});

// Reflected XSS in error messages
router.get('/search', async (req, res) => {
  const { q } = req.query;

  // Reflecting user input in response
  res.send(`
    <p>No results found for: ${q}</p>
  `);
});

// Setting wrong Content-Type
router.get('/api/comments/:id', async (req, res) => {
  const comment = await getComment(req.params.id);

  // Wrong Content-Type allows browser to interpret JSON as HTML
  res.setHeader('Content-Type', 'text/html');
  res.send(JSON.stringify(comment));
});
```

## ✅ CORRECT

```typescript
// middleware/security-headers.ts
import helmet from 'helmet';
import { Application } from 'express';

/**
 * Configure security headers including CSP
 */
export const setupSecurityHeaders = (app: Application) => {
  // Use Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"], // No inline scripts
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles if needed
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true, // X-Content-Type-Options: nosniff
      xssFilter: true, // X-XSS-Protection: 1; mode=block
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  // Additional security headers
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
};

// utils/sanitize.ts
import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize HTML input to prevent XSS
 */
export const sanitizeUserHtml = (dirty: string): string => {
  return sanitizeHtml(dirty, {
    allowedTags: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br',
      'ul', 'ol', 'li', 'blockquote', 'code'
    ],
    allowedAttributes: {
      'a': ['href', 'title'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    // Disallow any protocols that could execute JavaScript
    disallowedTagsMode: 'escape',
  });
};

/**
 * Strip all HTML tags
 */
export const stripHtml = (text: string): string => {
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  });
};

// routes/comments.routes.ts - SECURE
import { Router } from 'express';
import { sanitizeUserHtml, stripHtml } from '@/utils/sanitize';

const router = Router();

// API endpoints always return JSON with correct Content-Type
router.get('/api/comments/:id', async (req, res) => {
  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, req.params.id));

  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  // Express automatically sets Content-Type: application/json
  // Client-side should handle escaping when rendering
  res.json(comment);
});

// If serving HTML, use a template engine with auto-escaping
import { render } from 'ejs'; // or Handlebars, Pug, etc.

router.get('/comments/:id', async (req, res) => {
  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, req.params.id));

  // Template engines auto-escape by default
  const html = render(
    '<h1><%= title %></h1><p><%= text %></p>',
    {
      title: comment.title, // Auto-escaped
      text: comment.text,   // Auto-escaped
    }
  );

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Sanitize rich text content from users
router.post('/api/comments', async (req, res) => {
  const { text } = req.body;

  // Allow limited HTML tags, sanitize everything else
  const sanitizedText = sanitizeUserHtml(text);

  const [comment] = await db
    .insert(comments)
    .values({
      text: sanitizedText,
      authorId: req.user!.id,
    })
    .returning();

  res.status(201).json(comment);
});

// Search endpoint with safe error messages
router.get('/api/search', async (req, res) => {
  const { q } = req.query as { q: string };

  const results = await searchComments(q);

  // Return JSON, never reflect input in HTML
  res.json({
    query: q, // Client handles escaping
    results,
    count: results.length,
  });
});

// For truly user-generated HTML (like blog posts), sanitize on save
import { CommentsService } from './comments.service';

export class CommentsController {
  async createRichComment(req: Request, res: Response) {
    const { htmlContent } = req.body;

    // Sanitize HTML on input
    const safeHtml = sanitizeUserHtml(htmlContent);

    const comment = await new CommentsService().create({
      content: safeHtml,
      authorId: req.user!.id,
    });

    res.status(201).json(comment);
  }
}

export default router;
```

## Why This Matters

- **Security Impact**: XSS allows attackers to execute malicious JavaScript in victims' browsers, leading to session hijacking, credential theft, defacement, and malware distribution
- **OWASP Reference**: [A03:2021 - Injection](https://owasp.org/Top10/A03_2021-Injection/) (XSS is a type of injection attack)
- **Content-Type Matters**: Always set correct Content-Type headers. Browsers may try to "sniff" content type, potentially interpreting JSON as HTML
- **CSP Protection**: Content Security Policy headers prevent inline scripts from executing, mitigating many XSS attacks even if sanitization fails
- **API Best Practice**: APIs should return JSON and let clients handle rendering. Never render user content server-side without escaping
- **Template Engines**: Modern template engines (EJS, Handlebars, React, Vue) auto-escape by default. Never disable this feature
- **Sanitization vs Escaping**: Escaping converts special characters (&lt; &gt;). Sanitization allows safe HTML tags but removes dangerous ones
- **Rich Text Editors**: If users need formatting (bold, links), use a whitelist-based HTML sanitizer like sanitize-html
- **Defense in Depth**: Use multiple layers: input validation, output encoding, CSP headers, HttpOnly cookies, and X-XSS-Protection headers

## Why This Matters

- **Security Impact**: XSS allows attackers to execute malicious JavaScript in victims' browsers, leading to session hijacking, credential theft, defacement, and malware distribution
- **OWASP Reference**: [A03:2021 - Injection](https://owasp.org/Top10/A03_2021-Injection/) (XSS is a type of injection attack)
- **Content-Type Matters**: Always set correct Content-Type headers. Browsers may try to "sniff" content type, potentially interpreting JSON as HTML
- **CSP Protection**: Content Security Policy headers prevent inline scripts from executing, mitigating many XSS attacks even if sanitization fails
- **API Best Practice**: APIs should return JSON and let clients handle rendering. Never render user content server-side without escaping
- **Template Engines**: Modern template engines (EJS, Handlebars, React, Vue) auto-escape by default. Never disable this feature
- **Sanitization vs Escaping**: Escaping converts special characters (&lt; &gt;). Sanitization allows safe HTML tags but removes dangerous ones
- **Rich Text Editors**: If users need formatting (bold, links), use a whitelist-based HTML sanitizer like sanitize-html
- **Defense in Depth**: Use multiple layers: input validation, output encoding, CSP headers, HttpOnly cookies, and X-XSS-Protection headers
