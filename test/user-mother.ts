import { Types } from 'mongoose'
import { type User } from './model/user.model'

export function generateRandomUser(index: number): Partial<User> {
  return {
    _id: new Types.ObjectId(),
    username: `user${index}`,
    email: `user${index % 2 ? 0 : 1}@example.com`, // eslint-disable-line
    createdAt: new Date()
  }
}
