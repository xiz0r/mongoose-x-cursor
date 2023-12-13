import { type Schema, type Document } from 'mongoose'
import { type CacheProvider } from './interfaces/cache-provider'
import { type PaginationParams, type PaginationResult } from './interfaces/pagination'
import { type AggregationPaginationParams } from './interfaces/pagination-aggregate'
import { MongoosePaginationLogic } from './pagintaion-logic'
import { MongooseAggregationPaginationLogic } from './aggregation-pagination-logic'

/* eslint-disable */
export function mongoosePaginationPlugin<T extends Document>(schema: Schema<T>, cacheProvider: CacheProvider<unknown>): void {
  schema.statics.paginate = async function (params: PaginationParams<T>): Promise<PaginationResult<T>> {
    const paginationLogic = new MongoosePaginationLogic<T>(this);
    return await paginationLogic.paginate(params, cacheProvider);
  };

  schema.statics.aggregatePaginate = async function (params: AggregationPaginationParams<T>): Promise<PaginationResult<T>> {
    const aggregationPaginationLogic = new MongooseAggregationPaginationLogic<T>(this);
    return await aggregationPaginationLogic.aggregatePaginate(params);
  };
}
