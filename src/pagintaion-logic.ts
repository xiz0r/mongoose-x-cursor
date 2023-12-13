import { type FilterQuery, type Model, type Document, type SortOrder } from 'mongoose'
import { type PaginationInfo, type PaginationLogic, type PaginationParams, type PaginationResult, type PaginationSort } from './interfaces/pagination'
import { type CacheProvider } from './interfaces/cache-provider'

export class MongoosePaginationLogic<T extends Document> implements PaginationLogic<T> {
  constructor (private readonly model: Model<T>) {}

  async paginate (params: PaginationParams<T>, cacheProvider?: CacheProvider<unknown>): Promise<PaginationResult<T>> {
    const { next, prev, limit, sortFields, filter, select, totalDocs, totalDocsCache } = params

    const query: FilterQuery<T> = filter === undefined ? {} : { ...filter }
    let sort: PaginationSort<T> = prev !== undefined ? { _id: -1 } : { _id: 1 }

    if (sortFields !== undefined) {
      sort = { ...sort, ...sortFields }
    }

    let pageLimit = limit

    if (prev !== undefined) {
      query._id = { $lt: prev }
    } else {
      if (next !== undefined) {
        query._id = { $gte: next }
      }
      pageLimit = limit + 1
    }

    const docsPromise = this.model
      .find(query)
      .sort(sort as Record<string, SortOrder>)
      .limit(pageLimit)
      .lean<T>()
    if (select !== undefined) {
      docsPromise.select(select as Record<string, number>); // eslint-disable-line
    }

    const totalDocsPromise = totalDocs
      ? this.calcTotalDocs(filter ?? {}, totalDocsCache, cacheProvider as CacheProvider<number>)
      : Promise.resolve(undefined)

    const [documents, docsCount] = await Promise.all([docsPromise.exec(), totalDocsPromise]).catch((err) => {
      console.error(err)
      throw err
    })

    const navigationProperties = await this.calcNavigationProps(query, documents as T[], limit, prev, next)

    const result: PaginationResult<T> = {
      data: documents as T[],
      next: navigationProperties.next,
      prev: navigationProperties.previous,
      hasNext: navigationProperties.hasNext,
      hasPrevious: navigationProperties.hasPrevious,
      limit,
      totalDocs: docsCount
    }

    return result
  }

  async calcTotalDocs (filter: FilterQuery<T>, totalDocsCache: boolean, cacheProvider: CacheProvider<number>): Promise<number> {
    const cacheKeyPrefix = this.model.collection.name

    function setCacheTotalCount (totalCount: number): number {
      if (totalDocsCache) {
        cacheProvider.set(cacheKeyPrefix + JSON.stringify(filter), totalCount)
      }
      return totalCount
    }

    const cachedTotalCount = cacheProvider.get(cacheKeyPrefix + JSON.stringify(filter)) ?? 0

    if (!totalDocsCache || cachedTotalCount === 0) {
      return filter === undefined
        ? await this.model.estimatedDocumentCount().then(setCacheTotalCount)
        : await this.model.countDocuments(filter ?? {}).then(setCacheTotalCount)
    } else {
      return await Promise.resolve(cachedTotalCount)
    }
  }

  async calcNavigationProps (query: FilterQuery<T>, documents: T[], limit: number, prev?: string, next?: string): Promise<PaginationInfo> {
    let hasNext = false
    let hasPrevious = false
    let nextId: string | undefined
    let previousId: string | undefined

    if (documents.length === 0) {
      return {
        hasNext: false,
        hasPrevious: false,
        next: undefined,
        previous: undefined
      }
    }

    if (prev !== undefined) {
      documents.reverse()
      hasNext = prev !== undefined

      if (documents.length > 0) {
        const firstDocumentId = documents[0]._id
        const countPreviousDocuments = await this.model.countDocuments({
          ...query,
          _id: { $lt: firstDocumentId }
        })

        if (countPreviousDocuments > 0) {
          hasPrevious = true
          previousId = documents[0]._id.toString()
        }
      } else {
        hasPrevious = false
      }

      nextId = prev
    } else {
      hasNext = documents.length > limit
      hasPrevious = next !== undefined
      previousId = next

      if (hasNext) {
        nextId = documents.pop()?._id.toString()
      }
    }

    return {
      hasNext,
      hasPrevious,
      next: nextId,
      previous: previousId
    }
  }
}
