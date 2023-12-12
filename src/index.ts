import {
  type Schema,
  type Document,
  type Model,
  type FilterQuery,
  SortOrder
} from 'mongoose'
import { type CacheProvider, MemoryCacheProvider } from './cache'

export type PaginationSelect<T> = Partial<Record<keyof T, 1 | -1>>
export type PaginationSort<T> = { [key in keyof T]?: SortOrder }

export interface PaginationParams<T> {
  next?: string | undefined
  prev?: string | undefined
  limit: number
  sortFields?: PaginationSort<T> | undefined
  filter?: FilterQuery<T> | undefined
  select?: PaginationSelect<T> | undefined
  totalDocs: boolean
  totalDocsCache: boolean
  cacheKeyPrefix?: string
}

export interface PaginationResult<T> {
  next: string | undefined
  prev: string | undefined
  hasNext: boolean
  hasPrevious: boolean
  data: T[]
  totalDocs?: number
  limit: number
}

export interface PaginationModel<T extends Document> extends Model<T> {
  paginate: (params: PaginationParams<T>) => Promise<PaginationResult<T>>
}

async function calcTotalDocs<T extends Document>(
  model: PaginationModel<T>,
  filter: FilterQuery<T>,
  totalDocsCache: boolean,
  cacheTotalCount: CacheProvider<number>,
  cacheKeyPrefix: string = ''
): Promise<number> {
  function setCacheTotalCount(totalCount: number): number {
    if (totalDocsCache) {
      cacheTotalCount.set(cacheKeyPrefix + JSON.stringify(filter), totalCount)
    }
    return totalCount
  }

  const cachedTotalCount =
    cacheTotalCount.get(cacheKeyPrefix + JSON.stringify(filter)) ?? 0

  if (!totalDocsCache || cachedTotalCount === 0) {
    return filter === undefined
      ? await model.estimatedDocumentCount().then(setCacheTotalCount)
      : await model.countDocuments(filter ?? {}).then(setCacheTotalCount)
  } else {
    return await Promise.resolve(cachedTotalCount)
  }
}

async function calcNavigationProps<T extends Document>(
  model: PaginationModel<T>,
  query: FilterQuery<T>,
  documents: T[],
  limit: number,
  prev: string | undefined,
  next: string | undefined
): Promise<{
  hasNext: boolean
  hasPrevious: boolean
  next: string | undefined
  previous: string | undefined
}> {
  let hasNext = false
  let hasPrevious = false
  let nextId: string | undefined
  let previousId: string | undefined

  if (prev !== undefined) {
    documents.reverse()
    hasNext = prev !== undefined

    if (documents.length > 0) {
      const firstDocumentId = documents[0]._id
      const countPreviousDocuments = await model.countDocuments({
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

export function paginationPlugin<T extends Document>(
  cache: CacheProvider<number> = new MemoryCacheProvider<number>()
): (schema: Schema<T>) => void {
  const cacheTotalCount = cache

  return (schema: Schema<T>): void => {
    schema.statics.paginate = async function (
      this: PaginationModel<T>,
      {
        next = undefined,
        prev = undefined,
        limit = 10,
        filter = undefined,
        select = undefined,
        sortFields = undefined,
        totalDocs = false,
        totalDocsCache = false
      }: PaginationParams<T>
    ): Promise<PaginationResult<T>> {
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

      const docsPromise = this.find(query)
        .sort(sort as Record<string, SortOrder>)
        .limit(pageLimit)
        .lean<T>()
      if (select !== undefined) {
        docsPromise.select(select as Record<string, number>); // eslint-disable-line
      }

      const totalDocsPromise = totalDocs
        ? calcTotalDocs(
          this,
          filter ?? {},
          totalDocsCache,
          cacheTotalCount,
          this.collection.name
        )
        : Promise.resolve(undefined)

      const [documents, docsCount] = await Promise.all([
        docsPromise.exec(),
        totalDocsPromise
      ])

      const navigationProperties = await calcNavigationProps(
        this,
        query,
        documents as T[],
        limit,
        prev,
        next
      )

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
  }
}

export default paginationPlugin
