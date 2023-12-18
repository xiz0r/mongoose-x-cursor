import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
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

  it('should get first page', async () => {
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

    const result1 = await UserModel.aggregatePaginate({
      group: {
        _id: ['$category', '$username'],
        data: { $push: '$$ROOT' }
      },
      next: result.next,
      sort: { category: 1, email: 1 },
      limit: 2
    })
  })

  it('should navigate all pages forward', async () => {
    const users = generateRandomUsers(10)
    await UserModel.create(users)

    //should navigate all pages forward


    let result1 = await UserModel.aggregatePaginate({
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

    let result2 = await UserModel.aggregatePaginate({
      group: {
        _id: '$category',
        data: { $push: '$$ROOT' }
      },
      next: result1?.next,
      sort: { category: 1 },
      limit: 2
    })

    // console.log(JSON.stringify(result2, null, 2))
    expect(result2.data.length).toBe(2)
    expect(result2.hasNext).toBe(true)
    expect(result2.hasPrevious).toBe(true)
    expect(result2.next).toBeDefined()
    expect(result2.prev).toBeDefined()

    let result3 = await UserModel.aggregatePaginate({
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

    let result4 = await UserModel.aggregatePaginate({
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

    let result5 = await UserModel.aggregatePaginate({
      group: {
        _id: '$category',
        data: { $push: '$$ROOT' }
      },
      next: result4?.next,
      sort: { category: 1 },
      limit: 2
    })

    console.log(JSON.stringify(result5, null, 2))
    expect(result5.data.length).toBe(2)
    expect(result5.hasNext).toBe(true)
    expect(result5.hasPrevious).toBe(true)
    expect(result5.next).toBeDefined()
    expect(result5.prev).toBeDefined()

    // should navigate all pages backward

    let result6 = await UserModel.aggregatePaginate({
      group: {
        _id: '$category',
        data: { $push: '$$ROOT' }
      },
      prev: 'category8',
      sort: { category: 1 },
      limit: 2
    })

    // console.log(JSON.stringify(result6, null, 2))

    expect(result6.data.length).toBe(2)
    expect(result6.hasNext).toBe(false)
    expect(result6.hasPrevious).toBe(true)
    expect(result6.next).toBeUndefined()
    expect(result6.prev).toBeDefined()





  })
})
