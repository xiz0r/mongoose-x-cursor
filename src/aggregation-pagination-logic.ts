import { type Document, type Model } from 'mongoose'
import { type PaginationResult } from './interfaces/pagination'
import { type AggregationPaginationLogic, type AggregationPaginationParams } from './interfaces/pagination-aggregate'

/* eslint-disable-line */
export class MongooseAggregationPaginationLogic<T extends Document> implements AggregationPaginationLogic<T> {
  constructor(private readonly model: Model<T>) { }

  async aggregatePaginate(params: AggregationPaginationParams<T>): Promise<PaginationResult<T>> {
    const { match, group, sort, limit, next, prev } = params

    let nextValue: string | object | undefined = next
    let prevValue: string | object | undefined = prev
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
    const defaultSortId = prevValue !== undefined ? { _id: -1 } : { _id: 1 }
    if (sort === undefined) {
      basePipeline.push({ $sort: { ...defaultSortId } })
    } else {
      basePipeline.push({ $sort: { ...sort } })
    }

    // Group
    if (group !== undefined) {
      basePipeline.push({ $group: group })
      basePipeline.push({ $sort: prevValue !== undefined ? { _id: -1 } : { _id: 1 } })
    }

    const facetPipeline = {
      pagination: [
        ...basePipeline,
        ...(prev !== undefined ? [{ $match: { _id: { $lt: prevValue } } }] : []),
        ...(next !== undefined ? [{ $match: { _id: { $gt: nextValue } } }] : []),
        { $limit: limit + 1 },
      ],
      totalCount: [...basePipeline, { $count: 'count' }]
    }

    const aggregated = await this.model.aggregate([{ $facet: facetPipeline }])

    const results = aggregated[0].pagination
    const totalDocs = aggregated[0].totalCount[0] ? aggregated[0].totalCount[0].count : 0; // eslint-disable-line

    let hasPrev = false
    if (results.length > 0) {
      const reverseResults = [...results]
      const firstDocumentId = reverseResults[0]._id
      const countPreviousDocuments = await this.model.aggregate([
        ...basePipeline,
        { $match: { _id: { $lt: firstDocumentId } } },
        { $limit: limit },
        { $count: 'count' }
      ])

      if (countPreviousDocuments.length > 0) {
        hasPrev = true
      }
    }

    const hasNext = results.length > limit

    if (hasNext) {
      results.pop()

      if (hasPrev) {
        results.reverse()
      }

      if (typeof results[results.length - 1]._id === 'object') {
        nextValue = Buffer.from(JSON.stringify(results[results.length - 1]._id)).toString('base64')
      } else {
        nextValue = results[results.length - 1]._id
      }
    } else {
      nextValue = undefined
    }

    if (hasPrev && results.length > 0) {
      if (typeof results[0]._id === 'object') {
        prevValue = Buffer.from(JSON.stringify(results[0]._id)).toString('base64')
      } else {
        prevValue = results[0]._id
      }
    } else {
      prevValue = undefined
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
