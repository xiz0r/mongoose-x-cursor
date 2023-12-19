import { describe, it, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import UserModel, { type User } from './model/user.model';
import { generateRandomUser, generateRandomUsersWithCategories } from './user-mother';
import * as fs from 'fs';
import { type PaginationResult } from '../src/interfaces/pagination';

describe('Mongoose pagination performance test', () => {
  let mongoServer: MongoMemoryServer;
  const TOTAL_DOCS = 20000;
  const DOCS_PER_PAGE = 10;
  const PAGES_TO_TEST = Math.ceil(TOTAL_DOCS / DOCS_PER_PAGE);

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Insertar 10,000 documentos
    // for (let i = 0; i < TOTAL_DOCS; i++) {
    const users = generateRandomUsersWithCategories(
      ['category1', 'category2', 'category3', 'category4', 'category5', 'category6', 'category7', 'category8', 'category9', 'category10'],
      10000
    );
    await UserModel.insertMany(users);
    // }

    const count = await UserModel.countDocuments();
    console.log(`Total documents: ${count}`);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('performance offset paginate with filter', async () => {
    const performanceResults: Array<{ pageNumber: number; duration: number }> = [];
    for (let pageNumber = 1; pageNumber <= PAGES_TO_TEST; pageNumber++) {
      const skip = (pageNumber - 1) * DOCS_PER_PAGE;
      const start = performance.now();

      await UserModel.find({ email: 'user1@example.com' }).sort({ _id: 1, email: 1 }).skip(skip).limit(DOCS_PER_PAGE);

      const end = performance.now();
      const duration = end - start;
      performanceResults.push({ pageNumber, duration });
    }
    fs.writeFileSync(`performanceResultsOffset-${new Date().getTime()}.json`, JSON.stringify(performanceResults));
  }, 90000);

  it('performance paginate with filter, totalCountCache, custom sort and select', async () => {
    let lastId: string | undefined;
    const performanceResults: Array<{ page: number; duration: number }> = [];

    let result: PaginationResult<User> | null = null;
    let page = 0;

    do {
      const start = performance.now();

      result = await UserModel.paginate({
        next: lastId,
        limit: DOCS_PER_PAGE,
        filter: { email: 'user1@example.com' },
        sortFields: { email: 1 },
        totalDocs: false,
        totalDocsCache: false,
        select: { email: 1 },
      });

      const end = performance.now();
      const duration = end - start;
      performanceResults.push({ page, duration });

      lastId = result.next;
      page++;
    } while (result?.hasNext ?? false);

    fs.writeFileSync(`performanceResultsCursor-${new Date().getTime()}.json`, JSON.stringify(performanceResults));
  }, 90000);

  it('performance paginate with aggregation', async () => {
    let lastId: string | undefined;
    const performanceResults: Array<{ page: number; duration: number }> = [];

    let result: PaginationResult<User> | null = null;
    let page = 0;

    do {
      const start = performance.now();

      result = await UserModel.aggregatePaginate({
        group: {
          _id: '$category',
          data: { $push: '$$ROOT' },
        },
        next: lastId,
        sort: { category: 1 },
        limit: 1,
      });

      const end = performance.now();
      const duration = end - start;
      performanceResults.push({ page, duration });

      lastId = result.next;
      page++;
    } while (result?.hasNext ?? false);

    fs.writeFileSync(`performanceResultsCursorAggretation-${new Date().getTime()}.json`, JSON.stringify(performanceResults));
  }, 90000);
});
