import { type Document } from 'mongoose'
import { type CacheProvider } from './interfaces/cache-provider'
import { type PaginationLogic, type PaginationParams, type PaginationResult } from './interfaces/pagination'
import { type AggregationPaginationLogic, type AggregationPaginationParams } from './interfaces/pagination-aggregate'

export class PaginationService<T extends Document> {
  private readonly paginationLogic: PaginationLogic<T> | AggregationPaginationLogic<T>

  constructor (paginationLogic: PaginationLogic<T> | AggregationPaginationLogic<T>, private readonly cacheProvider?: CacheProvider<unknown>) {
    this.paginationLogic = paginationLogic
  }

  async paginate (params: PaginationParams<T> | AggregationPaginationParams<T>): Promise<PaginationResult<T>> {
    if (this.isAgregationPaginationLogic(this.paginationLogic)) {
      return await this.paginationLogic.aggregatePaginate(params as AggregationPaginationParams<T>)
    } else {
      return await this.paginationLogic.paginate(params as PaginationParams<T>, this.cacheProvider)
    }
  }

  isAgregationPaginationLogic (paginate: PaginationLogic<T> | AggregationPaginationLogic<T>): paginate is AggregationPaginationLogic<T> {
    return (paginate as AggregationPaginationLogic<T>).aggregatePaginate !== undefined
  }
}
