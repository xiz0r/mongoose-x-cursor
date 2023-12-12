import mongoose, { Schema, type Document } from 'mongoose'
import paginationPlugin, { type PaginationModel } from '../../src'
import { MemoryCacheProvider } from '../../src/cache'

export interface User extends Document {
  _id: mongoose.Types.ObjectId,
  username: string
  email: string
  createdAt: Date
}

export const UserSchema: Schema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

UserSchema.plugin(paginationPlugin(new MemoryCacheProvider<number>(1))) // 1ms cache, for testing
// UserSchema.plugin(paginationPlugin());

UserSchema.index({ _id: 1, email: 1 })
UserSchema.index({ _id: -1, email: -1 })

const userModel = mongoose.model<User, PaginationModel<User>>(
  'User',
  UserSchema
)

export default userModel
