import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import UserModel from './model/user.model'
import { generateRandomUsers, generateRandomUsersWithCategories } from './user-mother'

describe('Mongoose pagination test', () => {
  let mongoServer: MongoMemoryServer

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const uri = mongoServer.getUri()
    await mongoose.connect(uri)
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
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

    console.log(JSON.stringify(result, null, 2))

    const result1 = await UserModel.aggregatePaginate({
      group: {
        _id: ['$category', '$username'],
        data: { $push: '$$ROOT' }
      },
      next: result.next,
      sort: { category: 1, email: 1 },
      limit: 2
    })

    console.log(JSON.stringify(result1, null, 2))

    // expect(result.data.length).toBe(2);
    // expect(result.hasNext).toBe(true);
    // expect(result.hasPrevious).toBe(false);
    // expect(result.next).toBeDefined();
    // expect(result.prev).toBeUndefined();
    // expect(result.next).toBe('category2');
    // expect(result.data[0]._id).toBe('category1');
    // expect(result.data[1]._id).toBe('category2');
    // expect(result.totalDocs).toBe(4);
  })
})
