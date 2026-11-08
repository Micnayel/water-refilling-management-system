import Redis from "ioredis";

export interface SessionData {
  userId: string;
  csrf: string;
}

export interface SessionStore {
  create(token: string, data: SessionData, ttlSeconds: number): Promise<void>;
  get(token: string): Promise<SessionData | null>;
  destroy(token: string): Promise<void>;
}

interface MemoryEntry {
  data: SessionData;
  expiresAt: number;
}

class MemorySessionStore implements SessionStore {
  private readonly entries = new Map<string, MemoryEntry>();

  async create(token: string, data: SessionData, ttlSeconds: number): Promise<void> {
    this.entries.set(token, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async get(token: string): Promise<SessionData | null> {
    const entry = this.entries.get(token);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(token);
      return null;
    }
    return entry.data;
  }

  async destroy(token: string): Promise<void> {
    this.entries.delete(token);
  }
}

class RedisSessionStore implements SessionStore {
  private readonly client: Redis;
  private readonly fallback = new MemorySessionStore();

  constructor(url: string) {
    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
    this.client.on("error", () => {
      // Connection failures fall back to the in-memory store.
    });
  }

  private async ensure(): Promise<boolean> {
    if (this.client.status === "ready") return true;
    if (this.client.status === "wait" || this.client.status === "end") {
      try {
        await this.client.connect();
      } catch {
        return false;
      }
    }
    return (this.client.status as string) === "ready";
  }

  async create(token: string, data: SessionData, ttlSeconds: number): Promise<void> {
    if (await this.ensure()) {
      await this.client.set(`wrms:sess:${token}`, JSON.stringify(data), "EX", ttlSeconds);
      return;
    }
    await this.fallback.create(token, data, ttlSeconds);
  }

  async get(token: string): Promise<SessionData | null> {
    if (await this.ensure()) {
      const value = await this.client.get(`wrms:sess:${token}`);
      return value ? (JSON.parse(value) as SessionData) : null;
    }
    return this.fallback.get(token);
  }

  async destroy(token: string): Promise<void> {
    if (await this.ensure()) {
      await this.client.del(`wrms:sess:${token}`);
    }
    await this.fallback.destroy(token);
  }
}

export function createSessionStore(url: string): SessionStore {
  return url ? new RedisSessionStore(url) : new MemorySessionStore();
}
