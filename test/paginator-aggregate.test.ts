import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import UserModel from './model/user.model'; // Asegúrate de importar tu modelo de usuario aquí
import { generateRandomUser, generateRandomUsersWithCategories } from './user-mother';

describe('Mongoose pagination test', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  it('should get first page', async () => {
    const users = generateRandomUsersWithCategories(['category1', 'category2', 'category3', 'category4'], 20);
    await UserModel.create(users);

    const result = await UserModel.aggregatePaginate({
      group: {
        _id: '$category', // Agrupar por categoría
        data: { $push: '$$ROOT' },
      },
      sort: { category: -1 },
      // next: 'category1',
      limit: 20,
      // No se especifican 'next' o 'prev' si no estás implementando una paginación específica para agregación
    });

    console.log(JSON.stringify(result, null, 2));
  });
});
