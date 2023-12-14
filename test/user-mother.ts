import { Types } from 'mongoose'
import { type User } from './model/user.model'

export function generateRandomUser(index: number): Partial<User> {
  return {
    _id: new Types.ObjectId(),
    username: `user${index}`,
    email: `user${index % 2 ? 0 : 1}@example.com`, // eslint-disable-line
    createdAt: new Date(),
    category: 'category1'
  }
}

export function generateRandomUsersWithCategories(categories: string[], totalUsers: number): Array<Partial<User>> {
  // asign random categories to users
  const users: Array<Partial<User>> = []
  for (let i = 0; i < totalUsers; i++) {
    users.push(generateRandomUser(i))
    users[i].category = categories[Math.floor(Math.random() * categories.length)]
  }
  return users
}


export function generateRandomUsers(totalUsers: number): Array<Partial<User>> {
  const users: Array<Partial<User>> = []
  for (let i = 0; i < totalUsers; i++) {
    users.push({
      _id: new Types.ObjectId(),
      username: `user${i}`,
      email: `user${i % 2 ? 0 : 1}@example.com`, // eslint-disable-line
      createdAt: new Date(),
      category: `category${i}`
    })
  }
  return users
} 
