import { type FilterQuery, type SortOrder, type Document } from 'mongoose'
import { type CacheProvider } from './cache-provider'

export type PaginationSelect<T> = Partial<Record<keyof T, 1 | -1>>
export type PaginationSort<T> = { [key in keyof T]?: SortOrder }

export interface PaginationParams<T extends Document> {
  next?: string
  prev?: string
  limit: number
  sortFields?: PaginationSort<T>
  filter?: FilterQuery<T>
  select?: PaginationSelect<T>
  totalDocs: boolean
  totalDocsCache: boolean
}

export interface PaginationResult<T> {
  next?: string
  prev?: string
  hasNext?: boolean
  hasPrevious?: boolean
  data: T[]
  totalDocs?: number
  limit: number
}

export interface PaginationInfo {
  hasNext?: boolean
  hasPrevious?: boolean
  next?: string
  previous?: string
}

export interface PaginationLogic<T extends Document> {
  paginate: (params: PaginationParams<T>, cache?: CacheProvider<number>) => Promise<PaginationResult<T>>
}
