interface CacheContent<T> {
  value: T
  expireAt: number
}

export interface CacheProvider<T> {
  set: (key: string, value: T) => void
  get: (key: string) => T | null
}

export class MemoryCacheProvider<T> implements CacheProvider<T> {
  private cache: Record<string, CacheContent<T>>
  private readonly ttlMilliseconds: number

  constructor(ttlMilliseconds: number = 60000) {
    this.cache = {}
    this.ttlMilliseconds = ttlMilliseconds
  }

  set(key: string, value: T): void {
    this.cache[key] = { value, expireAt: Date.now() + this.ttlMilliseconds }
  }

  get(key: string): T | null {
    const item = this.cache[key]
    if (item === undefined) {
      return null
    }

    if (Date.now() > item.expireAt) {
      delete this.cache[key]; /* eslint-disable-line */
      return null
    }
    return item.value
  }
}
