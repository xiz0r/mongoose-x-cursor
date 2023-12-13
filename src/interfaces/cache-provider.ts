export interface CacheContent<T> {
  value: T
  expireAt: number
}

export interface CacheProvider<T> {
  set: (key: string, value: T) => void
  get: (key: string) => T | null
}
