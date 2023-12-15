import { type FilterQuery, type SortOrder } from 'mongoose'
import { type PaginationResult } from './pagination'

export type AggregationMatch<T> = FilterQuery<T>
export type AggregationGroup<T> = Record<string, any>
export type AggregationSort<T> = { [key in keyof T | string]?: SortOrder }

export interface AggregationPaginationParams<T> {
  match?: AggregationMatch<T>
  group?: AggregationGroup<T>
  sort?: AggregationSort<T>
  limit: number
  next?: string
  prev?: string
}

export interface AggregationPaginationLogic<T> {
  aggregatePaginate: (params: AggregationPaginationParams<T>) => Promise<PaginationResult<T>>
}
