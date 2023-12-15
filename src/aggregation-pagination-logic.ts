import { type Document, type Model } from 'mongoose'
import { type PaginationResult } from './interfaces/pagination'
import { type AggregationPaginationLogic, type AggregationPaginationParams } from './interfaces/pagination-aggregate'

/* eslint-disable-line */
export class MongooseAggregationPaginationLogic<T extends Document> implements AggregationPaginationLogic<T> {
  constructor (private readonly model: Model<T>) { }

  async aggregatePaginate (params: AggregationPaginationParams<T>): Promise<PaginationResult<T>> {
    const { match, group, sort, limit, next, prev } = params

    let nextValue: string | object | undefined = undefined
    let prevValue: string | object | undefined = undefined
    if (group !== undefined) {
      if (next !== undefined) {
        try {
          nextValue = JSON.parse(Buffer.from(next, 'base64').toString('ascii'))
        } catch (error) { }

        if (nextValue === undefined) {
          nextValue = next
        }
      }

      if (prev !== undefined) {
        try {
          prevValue = JSON.parse(Buffer.from(prev, 'base64').toString('ascii'))
        } catch (error) { }

        if (prevValue === undefined) {
          prevValue = prev
        }
      }
    }

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
        ...(prev !== undefined ? [{ $match: { _id: { $lt: prevValue } } }] : []),
        ...(next !== undefined ? [{ $match: { _id: { $gt: nextValue } } }] : []),
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

    // if aggregation is grouped and the _id field is an object, we need to convert it to string
    if (hasNext) {
      if (typeof results[results.length - 1]._id === 'object') {
        nextValue = Buffer.from(JSON.stringify(results[results.length - 1]._id)).toString('base64')
      } else {
        nextValue = results[results.length - 1]._id
      }
    }

    if (hasPrev) {
      if (typeof results[0]._id === 'object') {
        prevValue = Buffer.from(JSON.stringify(results[0]._id)).toString('base64')
      } else {
        prevValue = results[0]._id
      }
    }

    return {
      data: results,
      next: nextValue as string | undefined,
      prev: prevValue as string | undefined,
      hasNext,
      hasPrevious: hasPrev,
      limit,
      totalDocs
    }
  }
}
