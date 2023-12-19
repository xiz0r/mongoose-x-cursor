import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import mongoose from 'mongoose'
import { type MongoMemoryServer } from 'mongodb-memory-server'
import UserModel from './model/user.model'
import { generateRandomUsers, generateRandomUsersWithCategories } from './user-mother'

describe('Mongoose pagination test', () => {
  let mongoServer: MongoMemoryServer

  beforeAll(async () => {
    // mongoServer = await MongoMemoryServer.create()
    // const uri = mongoServer.getUri()
    const uri = 'mongodb://localhost:27017/test1'
    await mongoose.connect(uri)
  })

  afterAll(async () => {
    await mongoose.disconnect()
    // await mongoServer.stop()
  })

  beforeEach(async () => {
    await UserModel.deleteMany({})
  })

  it('should get first page', async () => {
    const users = generateRandomUsersWithCategories(['category1', 'category2', 'category3', 'category4'], 20)
    await UserModel.create(users)

    const result = await UserModel.aggregatePaginate({
      group: {
        _id: '$category',
        data: { $push: '$$ROOT' }
      },
      sort: { category: 1 },
      limit: 2
    })

    expect(result.data.length).toBe(2)
    expect(result.hasNext).toBe(true)
    expect(result.hasPrevious).toBe(false)
    expect(result.next).toBeDefined()
    expect(result.prev).toBeUndefined()
    expect(result.next).toBe('category2')
    expect(result.data[0]._id).toBe('category1')
    expect(result.data[1]._id).toBe('category2')
    expect(result.totalDocs).toBe(4)
  })

  it('should get first page grouped', async () => {
    const users = generateRandomUsers(10)
    await UserModel.create(users)

    const result = await UserModel.aggregatePaginate({
      group: {
        _id: ['$category', '$username'],
        data: { $push: '$$ROOT' }
      },
      sort: { category: 1, email: 1 },
      limit: 2
    })

    expect(result.data.length).toBe(2)
    expect(result.hasNext).toBe(true)
    expect(result.hasPrevious).toBe(false)
    expect(result.next).toBeDefined()
    expect(result.prev).toBeUndefined()
  })

  it('should navigate all pages forward and backward', async () => {
    const users = generateRandomUsers(10)
    await UserModel.create(users)

    // should navigate all pages forward

    const result1 = await UserModel.aggregatePaginate({
      group: {
        _id: '$category',
        data: { $push: '$$ROOT' }
      },
      sort: { category: 1 },
      limit: 2
    })

    // console.log(JSON.stringify(result1, null, 2))
    expect(result1.data.length).toBe(2)
    expect(result1.hasNext).toBe(true)
    expect(result1.hasPrevious).toBe(false)
    expect(result1.next).toBeDefined()
    expect(result1.prev).toBeUndefined()
    expect(result1.next).toBe('category1')

    const result2 = await UserModel.aggregatePaginate({
      group: {
        _id: '$category',
        data: { $push: '$$ROOT' }
      },
      next: result1?.next,
      sort: { category: 1 },
      limit: 2
    })

    // console.log(JSON.stringify(result2, null, 2));

    expect(result2.data.length).toBe(2)
    expect(result2.hasNext).toBe(true)
    expect(result2.hasPrevious).toBe(true)
    expect(result2.next).toBeDefined()
    expect(result2.prev).toBeDefined()
    expect(result2.next).toBe('category3')
    expect(result2.prev).toBe('category2')

    const result3 = await UserModel.aggregatePaginate({
      group: {
        _id: '$category',
        data: { $push: '$$ROOT' }
      },
      next: result2?.next,
      sort: { category: 1 },
      limit: 2
    })

    // console.log(JSON.stringify(result3, null, 2))
    expect(result3.data.length).toBe(2)
    expect(result3.hasNext).toBe(true)
    expect(result3.hasPrevious).toBe(true)
    expect(result3.next).toBeDefined()
    expect(result3.prev).toBeDefined()
    expect(result3.next).toBe('category5')
    expect(result3.prev).toBe('category4')

    const result4 = await UserModel.aggregatePaginate({
      group: {
        _id: '$category',
        data: { $push: '$$ROOT' }
      },
      next: result3?.next,
      sort: { category: 1 },
      limit: 2
    })

    // console.log(JSON.stringify(result4, null, 2))
    expect(result4.data.length).toBe(2)
    expect(result4.hasNext).toBe(true)
    expect(result4.hasPrevious).toBe(true)
    expect(result4.next).toBeDefined()
    expect(result4.prev).toBeDefined()
    expect(result4.next).toBe('category7')
    expect(result4.prev).toBe('category6')

    const result5 = await UserModel.aggregatePaginate({
      group: {
        _id: '$category',
        data: { $push: '$$ROOT' }
      },
      next: result4?.next,
      sort: { category: 1 },
      limit: 2
    })

    // console.log(JSON.stringify(result5, null, 2));

    expect(result5.data.length).toBe(2)
    expect(result5.hasNext).toBe(false)
    expect(result5.hasPrevious).toBe(true)
    expect(result5.next).toBeUndefined()
    expect(result5.prev).toBeDefined()
    expect(result5.prev).toBe('category8')

    // // should navigate all pages backward

    const result6 = await UserModel.aggregatePaginate({
      group: {
        _id: '$category',
        data: { $push: '$$ROOT' }
      },
      prev: result5.prev,
      sort: { category: 1 },
      limit: 2
    })

    // console.log('query prev:', result5.prev);
    // console.log(JSON.stringify(result6, null, 2));

    expect(result6.data.length).toBe(2)
    expect(result6.hasNext).toBe(true)
    expect(result6.hasPrevious).toBe(true)
    expect(result6.next).toBeDefined()
    expect(result6.prev).toBeDefined()
    expect(result6.next).toBe('category7')
    expect(result6.prev).toBe('category6')

    const result7 = await UserModel.aggregatePaginate({
      group: {
        _id: '$category',
        data: { $push: '$$ROOT' }
      },
      prev: result6.prev,
      sort: { category: 1 },
      limit: 2
    })

    // console.log('query prev:', result6.prev);
    // console.log(JSON.stringify(result7, null, 2));

    expect(result7.data.length).toBe(2)
    expect(result7.hasNext).toBe(true)
    expect(result7.hasPrevious).toBe(true)
    expect(result7.next).toBeDefined()
    expect(result7.prev).toBeDefined()
    expect(result7.next).toBe('category5')
    expect(result7.prev).toBe('category4')

    const result8 = await UserModel.aggregatePaginate({
      group: {
        _id: '$category',
        data: { $push: '$$ROOT' }
      },
      prev: result7.prev,
      sort: { category: 1 },
      limit: 2
    })

    // console.log('query prev:', result7.prev);
    // console.log(JSON.stringify(result8, null, 2));

    expect(result8.data.length).toBe(2)
    expect(result8.hasNext).toBe(true)
    expect(result8.hasPrevious).toBe(true)
    expect(result8.next).toBeDefined()
    expect(result8.prev).toBeDefined()
    expect(result8.next).toBe('category3')
    expect(result8.prev).toBe('category2')

    const result9 = await UserModel.aggregatePaginate({
      group: {
        _id: '$category',
        data: { $push: '$$ROOT' }
      },
      prev: 'category2',
      sort: { category: 1 },
      limit: 2
    })
    // console.log('query prev:', result8.prev);
    // console.log(JSON.stringify(result9, null, 2));

    expect(result9.data.length).toBe(2)
    expect(result9.hasNext).toBe(true)
    expect(result9.hasPrevious).toBe(false)
    expect(result9.next).toBeDefined()
    expect(result9.prev).toBeUndefined()
    expect(result9.next).toBe('category1')
  })

  it('should navigate all pages forward and backward with grouped _id', async () => {
    const users = generateRandomUsers(10)
    await UserModel.create(users)

    const result = await UserModel.aggregatePaginate({
      group: {
        _id: ['$category', '$username'],
        data: { $push: '$$ROOT' }
      },
      sort: { category: 1, email: 1 },
      limit: 2
    })

    expect(result.data.length).toBe(2)
    expect(result.hasNext).toBe(true)
    expect(result.hasPrevious).toBe(false)
    expect(result.next).toBeDefined()
    expect(result.prev).toBeUndefined()

    const result2 = await UserModel.aggregatePaginate({
      group: {
        _id: ['$category', '$username'],
        data: { $push: '$$ROOT' }
      },
      next: result.next,
      sort: { category: 1, email: 1 },
      limit: 2
    })

    expect(result2.data.length).toBe(2)
    expect(result2.hasNext).toBe(true)
    expect(result2.hasPrevious).toBe(true)
    expect(result2.next).toBeDefined()
    expect(result2.prev).toBeDefined()

    const result3 = await UserModel.aggregatePaginate({
      group: {
        _id: ['$category', '$username'],
        data: { $push: '$$ROOT' }
      },
      next: result2.next,
      sort: { category: 1, email: 1 },
      limit: 2
    })

    expect(result3.data.length).toBe(2)
    expect(result3.hasNext).toBe(true)
    expect(result3.hasPrevious).toBe(true)
    expect(result3.next).toBeDefined()
    expect(result3.prev).toBeDefined()

    const result4 = await UserModel.aggregatePaginate({
      group: {
        _id: ['$category', '$username'],
        data: { $push: '$$ROOT' }
      },
      next: result3.next,
      sort: { category: 1, email: 1 },
      limit: 2
    })

    expect(result4.data.length).toBe(2)
    expect(result4.hasNext).toBe(true)
    expect(result4.hasPrevious).toBe(true)
    expect(result4.next).toBeDefined()
    expect(result4.prev).toBeDefined()

    const result5 = await UserModel.aggregatePaginate({
      group: {
        _id: ['$category', '$username'],
        data: { $push: '$$ROOT' }
      },
      next: result4.next,
      sort: { category: 1, email: 1 },
      limit: 2
    })

    expect(result5.data.length).toBe(2)
    expect(result5.hasNext).toBe(false)
    expect(result5.hasPrevious).toBe(true)
    expect(result5.next).toBeUndefined()
    expect(result5.prev).toBeDefined()

    // should navigate all pages backward

    const result6 = await UserModel.aggregatePaginate({
      group: {
        _id: ['$category', '$username'],
        data: { $push: '$$ROOT' }
      },
      prev: result5.prev,
      sort: { category: 1, email: 1 },
      limit: 2
    })

    expect(result6.data.length).toBe(2)
    expect(result6.hasNext).toBe(true)
    expect(result6.hasPrevious).toBe(true)
    expect(result6.next).toBeDefined()
    expect(result6.prev).toBeDefined()

    const result7 = await UserModel.aggregatePaginate({
      group: {
        _id: ['$category', '$username'],
        data: { $push: '$$ROOT' }
      },
      prev: result6.prev,
      sort: { category: 1, email: 1 },
      limit: 2
    })

    expect(result7.data.length).toBe(2)
    expect(result7.hasNext).toBe(true)
    expect(result7.hasPrevious).toBe(true)
    expect(result7.next).toBeDefined()
    expect(result7.prev).toBeDefined()

    const result8 = await UserModel.aggregatePaginate({
      group: {
        _id: ['$category', '$username'],
        data: { $push: '$$ROOT' }
      },
      prev: result7.prev,
      sort: { category: 1, email: 1 },
      limit: 2
    })

    expect(result8.data.length).toBe(2)
    expect(result8.hasNext).toBe(true)
    expect(result8.hasPrevious).toBe(true)
    expect(result8.next).toBeDefined()
    expect(result8.prev).toBeDefined()

    const result9 = await UserModel.aggregatePaginate({
      group: {
        _id: ['$category', '$username'],
        data: { $push: '$$ROOT' }
      },
      prev: result8.prev,
      sort: { category: 1, email: 1 },
      limit: 2
    })

    expect(result9.data.length).toBe(2)
    expect(result9.hasNext).toBe(true)
    expect(result9.hasPrevious).toBe(false)
    expect(result9.next).toBeDefined()
    expect(result9.prev).toBeUndefined()
  })
})
