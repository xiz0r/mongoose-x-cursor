import mongoose, { Schema, type Document } from 'mongoose'
import { type PaginationModel } from '../../src/interfaces/pagination-models'
import { mongoosePaginationPlugin } from '../../src/mongoose-pagination-plugin'
import { MemoryCacheProvider } from '../../src/memory-cache-provider'

export interface User extends Document {
  _id: mongoose.Types.ObjectId
  username: string
  email: string
  createdAt: Date
  category: string
}

export const UserSchema: Schema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  category: { type: String, required: true }
})

UserSchema.plugin(mongoosePaginationPlugin<User>, new MemoryCacheProvider<number>(1))

UserSchema.index({ _id: 1, email: 1 })
UserSchema.index({ _id: -1, email: -1 })
UserSchema.index({ category: 1 })

const userModel = mongoose.model<User, PaginationModel<User>>('User', UserSchema)

export default userModel
