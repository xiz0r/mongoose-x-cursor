import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import UserModel from './model/user.model' // Asegúrate de importar tu modelo de usuario aquí
import { generateRandomUser } from './user-mother'
import { ImageModel } from './model/image.model'

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

  it('should get empty page', async () => {
    ImageModel.create({
      style: 'style',
      name: 'name',
      fileExtension: 'fileExtension',
      status: 'status',
      user: {
        userName: 'userName',
        guid: 'guid',
        email: 'email'
      },
      createdBy: {
        userName: 'userName',
        guid: 'guid',
        email: 'email'
      },
      created: new Date(),
      lastUpdated: new Date(),
      reviewedBy: {
        userName: 'userName',
        guid: 'guid',
        email: 'email'
      },
      reviewDate: new Date(),
      width: 1,
      height: 1,
      aimodel: 'aimodel',
      processedImages: [
        {
          name: 'name',
          fileExtension: 'fileExtension',
          lastUpdated: new Date(),
          approvedBy: 'approvedBy',
          backgroundId: 'backgroundId'
        }
      ],
      processedModels: ['processedModels'],
      retry: 1
    })

    const page = await ImageModel.paginate({
      limit: 1,
      totalDocs: true,
      totalDocsCache: true
    })

    console.log(page)

  })

  it('should get first page', async () => {
    const users = [
      generateRandomUser(1),
      generateRandomUser(2),
      generateRandomUser(3)
    ]
    await UserModel.create(users)

    const paginationModel = UserModel
    const page = await paginationModel.paginate({
      limit: 1,
      totalDocs: true,
      totalDocsCache: true
    })

    expect(page.data.length).toBe(1)
    expect(page.totalDocs).toBe(3)
    expect(page.hasNext).toBe(true)
    expect(page.hasPrevious).toBe(false)
    expect(page.next).toBeDefined()
    expect(page.prev).toBeUndefined()
    expect(page.data[0]._id.toString()).toBe(users[0]._id?.toString())
  })

  it('should get second page', async () => {
    const users = [
      generateRandomUser(1),
      generateRandomUser(2),
      generateRandomUser(3)
    ]
    await UserModel.create(users)

    const paginationModel = UserModel

    const page = await paginationModel.paginate({
      next: users[1]._id?.toString(),
      limit: 1,
      totalDocs: true,
      totalDocsCache: true
    })

    expect(page.data.length).toBe(1)
    expect(page.totalDocs).toBe(3)
    expect(page.hasNext).toBe(true)
    expect(page.hasPrevious).toBe(true)
    expect(page.prev).toBeDefined()
    expect(page.next).toBeDefined()
    expect(page.data[0]._id.toString()).toBe(users[1]._id?.toString())
  })

  it('should get third page', async () => {
    const users = [
      generateRandomUser(1),
      generateRandomUser(2),
      generateRandomUser(3)
    ]
    await UserModel.create(users)

    const paginationModel = UserModel

    const page2 = await paginationModel.paginate({
      next: users[2]._id?.toString(),
      limit: 1,
      totalDocs: true,
      totalDocsCache: true
    })

    expect(page2.data.length).toBe(1)
    expect(page2.totalDocs).toBe(3)
    expect(page2.hasNext).toBe(false)
    expect(page2.hasPrevious).toBe(true)
    expect(page2.prev).toBeDefined()
    expect(page2.next).toBeUndefined()
    expect(page2.data[0]._id.toString()).toBe(users[2]._id?.toString())
  })

  it('should get previous page to second page (first page)', async () => {
    const users = [
      generateRandomUser(1),
      generateRandomUser(2),
      generateRandomUser(3)
    ]
    await UserModel.create(users)

    const paginationModel = UserModel

    const page = await paginationModel.paginate({
      prev: users[1]._id?.toString(),
      limit: 1,
      totalDocs: true,
      totalDocsCache: true
    })

    expect(page.data.length).toBe(1)
    expect(page.totalDocs).toBe(3)
    expect(page.hasNext).toBe(true)
    expect(page.hasPrevious).toBe(false)
    expect(page.prev).toBeUndefined()
    expect(page.next).toBeDefined()
    expect(page.data[0]._id.toString()).toBe(users[0]._id?.toString())
  })

  it('should get previous page to third page (second page)', async () => {
    const users = [
      generateRandomUser(1),
      generateRandomUser(2),
      generateRandomUser(3)
    ]
    await UserModel.create(users)

    const paginationModel = UserModel

    const page = await paginationModel.paginate({
      prev: users[2]._id?.toString(),
      limit: 1,
      totalDocs: true,
      totalDocsCache: true
    })

    expect(page.data.length).toBe(1)
    expect(page.totalDocs).toBe(3)
    expect(page.hasNext).toBe(true)
    expect(page.hasPrevious).toBe(true)
    expect(page.prev).toBeDefined()
    expect(page.next).toBeDefined()
    expect(page.data[0]._id.toString()).toBe(users[1]._id?.toString())
  })

  it('should get previous page to second page (first page) limit 2', async () => {
    const users = [
      generateRandomUser(1),
      generateRandomUser(2),
      generateRandomUser(3), //
      generateRandomUser(4),
      generateRandomUser(5),
      generateRandomUser(6)
    ]
    await UserModel.create(users)

    const paginationModel = UserModel

    const page = await paginationModel.paginate({
      prev: users[2]._id?.toString(),
      limit: 2,
      totalDocs: true,
      totalDocsCache: true
    })

    expect(page.data.length).toBe(2)
    expect(page.totalDocs).toBe(6)
    expect(page.hasNext).toBe(true)
    expect(page.hasPrevious).toBe(false)
    expect(page.prev).toBeUndefined()
    expect(page.next).toBeDefined()
    expect(page.data[0]._id.toString()).toBe(users[0]._id?.toString())
  })

  it('should get first page without totalDocs', async () => {
    const users = [
      generateRandomUser(1),
      generateRandomUser(2),
      generateRandomUser(3)
    ]
    await UserModel.create(users)

    const paginationModel = UserModel
    const page = await paginationModel.paginate({
      limit: 1,
      totalDocs: false,
      totalDocsCache: false
    })

    expect(page.data.length).toBe(1)
    expect(page.totalDocs).toBeUndefined()
    expect(page.hasNext).toBe(true)
    expect(page.hasPrevious).toBe(false)
    expect(page.next).toBeDefined()
    expect(page.prev).toBeUndefined()
    expect(page.data[0]._id.toString()).toBe(users[0]._id?.toString())
  })
})
