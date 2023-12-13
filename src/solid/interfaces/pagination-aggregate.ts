import { type FilterQuery, type SortOrder } from 'mongoose'
import { type PaginationResult } from './pagination'

export type AggregationMatch<T> = FilterQuery<T>
export type AggregationGroup<T> = Record<string, any> // Definir según la lógica de agrupación
export type AggregationSort<T> = { [key in keyof T]?: SortOrder }

export interface AggregationPaginationParams<T> {
  match?: AggregationMatch<T>
  group?: AggregationGroup<T>
  sort?: AggregationSort<T>
  limit: number
  next?: string // Cursor para la siguiente página
  prev?: string // Cursor para la página anterior
}

export interface AggregationPaginationLogic<T> {
  aggregatePaginate: (params: AggregationPaginationParams<T>) => Promise<PaginationResult<T>>
}
