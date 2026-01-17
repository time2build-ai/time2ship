# sec-auth-jwt-secret

Never hardcode JWT secrets or use weak keys. Always use cryptographically strong, randomly generated secrets stored securely in environment variables.

## ❌ WRONG

```typescript
// jwt.service.ts
import jwt from 'jsonwebtoken';

export class JwtService {
  // Hardcoded secret - CRITICAL VULNERABILITY
  private readonly secret = 'my-secret-key';

  generateToken(userId: string): string {
    return jwt.sign({ userId }, this.secret, { expiresIn: '1h' });
  }

  verifyToken(token: string) {
    return jwt.verify(token, this.secret);
  }
}

// OR using a weak secret
const SECRET = 'password123'; // Too weak, easily guessable
```

## ✅ CORRECT

```typescript
// jwt.service.ts
import jwt from 'jsonwebtoken';
import { config } from '@/config/env';

export class JwtService {
  // Secret from environment variable
  private readonly secret: string;

  constructor() {
    this.secret = config.jwt.secret;

    // Validate secret strength on initialization
    if (!this.secret || this.secret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters');
    }
  }

  generateToken(userId: string): string {
    return jwt.sign({ userId }, this.secret, {
      expiresIn: config.jwt.expiresIn,
      algorithm: 'HS256' // Explicitly specify algorithm
    });
  }

  verifyToken(token: string): { userId: string } {
    return jwt.verify(token, this.secret, {
      algorithms: ['HS256'] // Prevent algorithm confusion attacks
    }) as { userId: string };
  }
}

// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1h'),
});

const env = envSchema.parse(process.env);

export const config = {
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
};

// .env (gitignored!)
// JWT_SECRET=a8f5f167f44f4964e6c998dee827110c3f14e96f8c3a8f5f167f44f4964e6c998
// Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Why This Matters

- **Security Impact**: Hardcoded secrets can be extracted from source code, version control history, or compiled binaries, allowing attackers to forge valid JWTs and impersonate any user
- **OWASP Reference**: [A02:2021 - Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- **Best Practice**: Use cryptographically secure random strings (minimum 256 bits / 32 bytes) and rotate secrets regularly
- **Algorithm Confusion**: Always specify and verify the JWT algorithm to prevent attackers from exploiting algorithm confusion vulnerabilities
- **Common Mistake**: Committing `.env` files to git - always add `.env` to `.gitignore` and use `.env.example` for documentation
