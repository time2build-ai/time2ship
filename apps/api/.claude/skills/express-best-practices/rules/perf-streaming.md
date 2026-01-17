# perf-streaming

Use streaming responses for large datasets or file downloads to reduce memory usage and improve time-to-first-byte instead of buffering entire responses.

## ❌ WRONG

```typescript
// BAD: Loading entire file into memory
export async function downloadLargeFile(req: Request, res: Response) {
  const filePath = '/path/to/large-file.csv'; // 500MB file

  // Reads entire file into memory - causes OOM crash
  const fileContent = await fs.promises.readFile(filePath);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="data.csv"');
  res.send(fileContent); // 500MB in memory
}

// BAD: Buffering all database results
export async function exportAllUsers(req: Request, res: Response) {
  // Loads 1M users into memory
  const users = await db.select().from(usersTable);

  // Convert to CSV in memory
  const csv = users.map(u => `${u.id},${u.name},${u.email}`).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.send(csv); // Huge string in memory
}
```

## ✅ CORRECT

```typescript
// GOOD: Stream file from disk
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';

export async function downloadLargeFile(req: Request, res: Response) {
  const filePath = '/path/to/large-file.csv';

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="data.csv"');

  // Stream file in chunks - constant memory usage
  const fileStream = createReadStream(filePath);

  await pipeline(fileStream, res);
  // Memory usage: ~64KB buffer vs 500MB
}

// GOOD: Stream database results as CSV
import { Transform } from 'stream';

export async function exportAllUsers(req: Request, res: Response) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');

  // Write CSV header
  res.write('id,name,email\n');

  // Stream results in batches
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const users = await db
      .select()
      .from(usersTable)
      .limit(batchSize)
      .offset(offset);

    if (users.length === 0) break;

    // Write batch to stream
    for (const user of users) {
      res.write(`${user.id},${user.name},${user.email}\n`);
    }

    offset += batchSize;
  }

  res.end();
  // Memory usage: constant ~100KB vs 100MB+
}

// BETTER: Use streaming JSON for APIs
import { Readable } from 'stream';

export async function streamPosts(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json');
  res.write('[');

  let isFirst = true;
  let offset = 0;
  const batchSize = 100;

  while (true) {
    const posts = await db.query.posts.findMany({
      limit: batchSize,
      offset,
    });

    if (posts.length === 0) break;

    for (const post of posts) {
      if (!isFirst) res.write(',');
      res.write(JSON.stringify(post));
      isFirst = false;
    }

    offset += batchSize;
  }

  res.write(']');
  res.end();
}

// BEST: Use Transform stream for complex processing
class CsvTransform extends Transform {
  private isFirst = true;

  _transform(chunk: any, encoding: string, callback: Function) {
    const csv = `${chunk.id},${chunk.name},${chunk.email}\n`;
    callback(null, csv);
  }
}

export async function exportUsersWithTransform(req: Request, res: Response) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');

  const csvTransform = new CsvTransform();

  // Write header
  res.write('id,name,email\n');

  // Stream through transform
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const users = await db
      .select()
      .from(usersTable)
      .limit(batchSize)
      .offset(offset);

    if (users.length === 0) break;

    for (const user of users) {
      csvTransform.write(user);
    }

    offset += batchSize;
  }

  csvTransform.end();
  await pipeline(csvTransform, res);
}
```

## Why This Matters

- **Memory Usage**:
  - Buffered 500MB file: 500MB+ memory usage
  - Streamed 500MB file: ~64KB memory usage
  - 7800x reduction in memory
- **Time to First Byte (TTFB)**:
  - Buffered: Wait for entire response, then send (5000ms)
  - Streamed: Send first chunk immediately (50ms)
  - 100x faster perceived performance
- **Scalability**:
  - Buffered: 10 concurrent 500MB downloads = 5GB memory (crash)
  - Streamed: 10 concurrent downloads = 640KB memory
- **Use Cases**:
  - File downloads (PDFs, CSVs, images)
  - Database exports
  - Large JSON responses
  - Real-time data feeds
  - Log file access
- **Backpressure**: Streams automatically handle backpressure (slow clients)
- **Error Handling**: Stream errors should close connection, not try to send error JSON
- **Libraries**:
  - `csv-writer` for CSV streaming
  - `json-stream-stringify` for JSON streaming
  - `archiver` for zip file streaming
