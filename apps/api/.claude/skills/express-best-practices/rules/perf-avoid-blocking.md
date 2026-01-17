# perf-avoid-blocking

Avoid blocking the Node.js event loop with CPU-intensive synchronous operations by offloading heavy work to worker threads, child processes, or async alternatives.

## ❌ WRONG

```typescript
// BAD: Synchronous crypto blocks event loop
import crypto from 'crypto';

export async function hashPasswordSync(req: Request, res: Response) {
  const { password } = req.body;

  // Blocks event loop for 100-500ms
  const hash = crypto.pbkdf2Sync(
    password,
    'salt',
    100000,
    64,
    'sha512'
  );

  // All other requests wait during this time
  res.json({ hash: hash.toString('hex') });
}

// BAD: Heavy JSON parsing blocks event loop
export async function processLargeData(req: Request, res: Response) {
  const largeFile = fs.readFileSync('./data/large.json', 'utf-8');

  // Blocks event loop while parsing 50MB JSON
  const data = JSON.parse(largeFile);

  // Process data...
  res.json({ processed: data.length });
}

// BAD: Synchronous file operations
export async function readFiles(req: Request, res: Response) {
  const files = fs.readdirSync('./uploads'); // Blocks

  const contents = files.map(file =>
    fs.readFileSync(`./uploads/${file}`, 'utf-8') // Blocks for each file
  );

  res.json({ files: contents });
}

// BAD: CPU-intensive computation
export async function calculatePrimes(req: Request, res: Response) {
  const { limit } = req.query;

  // Blocks event loop for seconds
  function isPrime(n: number): boolean {
    for (let i = 2; i < n; i++) {
      if (n % i === 0) return false;
    }
    return true;
  }

  const primes = [];
  for (let i = 2; i < Number(limit); i++) {
    if (isPrime(i)) primes.push(i);
  }

  res.json({ primes });
}
```

## ✅ CORRECT

```typescript
// GOOD: Use async crypto
import crypto from 'crypto';
import { promisify } from 'util';

const pbkdf2Async = promisify(crypto.pbkdf2);

export async function hashPasswordAsync(req: Request, res: Response) {
  const { password } = req.body;

  // Non-blocking - uses libuv thread pool
  const hash = await pbkdf2Async(
    password,
    'salt',
    100000,
    64,
    'sha512'
  );

  res.json({ hash: hash.toString('hex') });
}

// GOOD: Stream large JSON instead of loading all at once
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import JSONStream from 'JSONStream';

export async function processLargeDataStreaming(req: Request, res: Response) {
  const stream = createReadStream('./data/large.json', 'utf-8');
  const parser = JSONStream.parse('*');

  let count = 0;
  parser.on('data', (data) => {
    count++;
    // Process each item without blocking
  });

  await pipeline(stream, parser);

  res.json({ processed: count });
}

// GOOD: Use async file operations
import fs from 'fs/promises';

export async function readFilesAsync(req: Request, res: Response) {
  // Non-blocking directory read
  const files = await fs.readdir('./uploads');

  // Read files in parallel, non-blocking
  const contents = await Promise.all(
    files.map(file => fs.readFile(`./uploads/${file}`, 'utf-8'))
  );

  res.json({ files: contents });
}

// BETTER: Use worker threads for CPU-intensive tasks
import { Worker } from 'worker_threads';
import path from 'path';

function runWorker(workerData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      path.resolve(__dirname, './workers/primes.worker.js'),
      { workerData }
    );

    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

export async function calculatePrimesWorker(req: Request, res: Response) {
  const { limit } = req.query;

  // Offload to worker thread - doesn't block event loop
  const primes = await runWorker({ limit: Number(limit) });

  res.json({ primes });
}

// Worker file: workers/primes.worker.js
import { parentPort, workerData } from 'worker_threads';

function isPrime(n: number): boolean {
  for (let i = 2; i < n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

const primes = [];
for (let i = 2; i < workerData.limit; i++) {
  if (isPrime(i)) primes.push(i);
}

parentPort?.postMessage(primes);

// BEST: Use worker pool for repeated tasks
import { Worker } from 'worker_threads';

class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{ data: any; resolve: Function; reject: Function }> = [];
  private activeWorkers = 0;

  constructor(
    private workerPath: string,
    private poolSize: number = 4
  ) {}

  async exec(data: any): Promise<any> {
    if (this.activeWorkers < this.poolSize) {
      return this.runTask(data);
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject });
    });
  }

  private async runTask(data: any): Promise<any> {
    this.activeWorkers++;

    return new Promise((resolve, reject) => {
      const worker = new Worker(this.workerPath, { workerData: data });

      worker.on('message', (result) => {
        resolve(result);
        worker.terminate();
        this.activeWorkers--;
        this.processQueue();
      });

      worker.on('error', (err) => {
        reject(err);
        worker.terminate();
        this.activeWorkers--;
        this.processQueue();
      });
    });
  }

  private processQueue() {
    if (this.queue.length > 0 && this.activeWorkers < this.poolSize) {
      const { data, resolve, reject } = this.queue.shift()!;
      this.runTask(data).then(resolve).catch(reject);
    }
  }

  async terminate() {
    // Wait for active tasks to complete
    while (this.activeWorkers > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

// Usage
const primeWorkerPool = new WorkerPool(
  path.resolve(__dirname, './workers/primes.worker.js'),
  4 // 4 worker threads
);

export async function calculatePrimesPooled(req: Request, res: Response) {
  const { limit } = req.query;

  const primes = await primeWorkerPool.exec({ limit: Number(limit) });

  res.json({ primes });
}

// ALTERNATIVE: Use job queue for background processing
import { Queue, Worker as BullWorker } from 'bullmq';

const heavyTaskQueue = new Queue('heavy-tasks', {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

// Add job to queue
export async function processInBackground(req: Request, res: Response) {
  const { data } = req.body;

  const job = await heavyTaskQueue.add('process-data', data);

  // Return immediately, process in background
  res.json({
    jobId: job.id,
    status: 'queued',
  });
}

// Worker processes jobs in background
const worker = new BullWorker('heavy-tasks', async (job) => {
  // Heavy processing here - doesn't block API
  const result = await heavyComputation(job.data);
  return result;
}, {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});
```

## Why This Matters

- **Event Loop Blocking**:
  - Node.js is single-threaded; blocking operations freeze ALL requests
  - 100ms blocking operation = all concurrent requests delayed by 100ms
  - Can cause cascading failures and timeouts
- **Performance Impact**:
  - Sync crypto (100ms) @ 100 req/sec = queue backlog, timeouts
  - Async crypto (0ms blocking) @ 100 req/sec = smooth operation
- **Common Blocking Operations**:
  - `crypto.pbkdf2Sync`, `bcrypt.hashSync`
  - `JSON.parse()` on large payloads (>1MB)
  - `fs.readFileSync()`, `fs.writeFileSync()`
  - Large loops, heavy computations
  - Synchronous compression/decompression
- **Solutions by Use Case**:
  - **I/O operations**: Use async versions (`fs.promises`, `crypto` async methods)
  - **CPU-intensive**: Worker threads or child processes
  - **Long-running**: Job queues (Bull, BullMQ)
  - **Large data**: Streaming APIs
- **Worker Threads**:
  - Run JavaScript in parallel threads
  - Don't share memory (message passing only)
  - Ideal for CPU-bound tasks
  - Overhead: ~10-50ms to spawn worker
  - Use worker pools for repeated tasks
- **Monitoring**: Use `process.hrtime()` to measure event loop delay
- **Best Practices**:
  - Async by default
  - Stream large files
  - Use worker threads for computations >50ms
  - Consider job queues for tasks >1 second
  - Monitor event loop lag in production
