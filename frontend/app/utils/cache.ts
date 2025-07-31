interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache {
  private storage = new Map<string, CacheItem<any>>()

  set<T>(key: string, data: T, ttlMinutes = 5) {
    this.storage.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    })
  }

  get<T>(key: string): T | null {
    const item = this.storage.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.storage.delete(key)
      return null
    }

    return item.data
  }

  clear() {
    this.storage.clear()
  }
}

export const cache = new SimpleCache()