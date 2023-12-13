import { type Model, type Document } from 'mongoose'
import { type PaginationParams, type PaginationResult } from './pagination'
import { type AggregationPaginationParams } from './pagination-aggregate'

export interface PaginationModel<T extends Document> extends Model<T> {
  paginate: (params: PaginationParams<T>) => Promise<PaginationResult<T>>
  aggregatePaginate: (params: AggregationPaginationParams<T>) => Promise<PaginationResult<T>>
}
