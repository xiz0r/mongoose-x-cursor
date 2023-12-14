import { type Document, type Model } from 'mongoose'
import { type PaginationResult } from './interfaces/pagination'
import { type AggregationPaginationLogic, type AggregationPaginationParams } from './interfaces/pagination-aggregate'

/* eslint-disable-line */
export class MongooseAggregationPaginationLogic<T extends Document> implements AggregationPaginationLogic<T> {
  constructor (private readonly model: Model<T>) { }

  async aggregatePaginate (params: AggregationPaginationParams<T>): Promise<PaginationResult<T>> {
    const { match, group, sort, limit, next, prev } = params

    const basePipeline: any[] = []

    // Match
    if (match !== undefined) {
      basePipeline.push({ $match: match })
    }

    // Sort
    if (sort === undefined) {
      basePipeline.push({ $sort: { _id: 1 } })
    } else {
      basePipeline.push({ $sort: { ...sort } })
    }

    // Group
    if (group !== undefined) {
      basePipeline.push({ $group: group })
      basePipeline.push({ $sort: { _id: 1 } })
    }

    const facetPipeline = {
      pagination: [
        ...basePipeline,
        ...(prev !== undefined ? [{ $match: { _id: { $lt: prev } } }] : []),
        ...(next !== undefined ? [{ $match: { _id: { $gt: next } } }] : []),
        { $limit: limit + 1 }
      ],
      totalCount: [
        ...basePipeline,
        { $count: 'count' }
      ]
    }

    const aggregated = await this.model.aggregate([{ $facet: facetPipeline }])

    const results = aggregated[0].pagination
    const totalDocs = aggregated[0].totalCount[0] ? aggregated[0].totalCount[0].count : 0 // eslint-disable-line

    const hasNext = results.length > limit
    const hasPrev = next !== undefined

    if (hasNext) {
      results.pop()
    }

    return {
      data: results,
      next: hasNext ? results[results.length - 1]._id : undefined,
      prev: hasPrev ? results[0]._id : undefined,
      hasNext,
      hasPrevious: hasPrev,
      limit,
      totalDocs
    }
  }
}
