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
  totalDocs?: boolean
  totalDocsCache?: boolean
}

export interface NavigationInfo {
  hasNext?: boolean
  hasPrevious?: boolean
  next?: string
  prev?: string
}

export interface PaginationResult<T> extends NavigationInfo {
  data: T[]
  totalDocs?: number
  limit: number
}

export interface PaginationLogic<T extends Document> {
  paginate: (params: PaginationParams<T>, cache?: CacheProvider<number>) => Promise<PaginationResult<T>>
}
