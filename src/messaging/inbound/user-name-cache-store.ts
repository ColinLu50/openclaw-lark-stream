/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Account-scoped cache registry for Feishu user display names.
 */

const DEFAULT_MAX_SIZE = 500;
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  name: string;
  expireAt: number;
}

export class UserNameCache {
  private map = new Map<string, CacheEntry>();
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize = DEFAULT_MAX_SIZE, ttlMs = DEFAULT_TTL_MS) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  has(openId: string): boolean {
    const entry = this.map.get(openId);
    if (!entry) return false;
    if (entry.expireAt <= Date.now()) {
      this.map.delete(openId);
      return false;
    }
    return true;
  }

  get(openId: string): string | undefined {
    const entry = this.map.get(openId);
    if (!entry) return undefined;
    if (entry.expireAt <= Date.now()) {
      this.map.delete(openId);
      return undefined;
    }
    this.map.delete(openId);
    this.map.set(openId, entry);
    return entry.name;
  }

  set(openId: string, name: string): void {
    this.map.delete(openId);
    this.map.set(openId, { name, expireAt: Date.now() + this.ttlMs });
    this.evict();
  }

  setMany(entries: Iterable<[string, string]>): void {
    for (const [openId, name] of entries) {
      this.map.delete(openId);
      this.map.set(openId, { name, expireAt: Date.now() + this.ttlMs });
    }
    this.evict();
  }

  filterMissing(openIds: string[]): string[] {
    return openIds.filter((id) => !this.has(id));
  }

  getMany(openIds: string[]): Map<string, string> {
    const result = new Map<string, string>();
    for (const id of openIds) {
      if (this.has(id)) {
        result.set(id, this.get(id) ?? '');
      }
    }
    return result;
  }

  clear(): void {
    this.map.clear();
  }

  private evict(): void {
    while (this.map.size > this.maxSize) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
  }
}

const registry = new Map<string, UserNameCache>();

export function getUserNameCache(accountId: string): UserNameCache {
  let c = registry.get(accountId);
  if (!c) {
    c = new UserNameCache();
    registry.set(accountId, c);
  }
  return c;
}

export function clearUserNameCache(accountId?: string): void {
  if (accountId !== undefined) {
    registry.get(accountId)?.clear();
    registry.delete(accountId);
  } else {
    for (const c of registry.values()) c.clear();
    registry.clear();
  }
}
