import mongoose, { Schema, type Document } from 'mongoose';
import { MemoryCacheProvider } from '../../src/cache';
import { mongoosePaginationPlugin } from '../../src/solid/mongoose-pagination-plugin';
import { type PaginationModel } from '../../src/solid/interfaces/pagination-models';

export interface User extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  createdAt: Date;
  category: string;
}

export const UserSchema: Schema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  category: { type: String, required: true },
});

// const paginationLogic = new MongoosePaginationLogic<MyDocument>(myModel);
// const aggregationPaginationLogic = new MongooseAggregationPaginationLogic<MyDocument>(myModel);

// mySchema.plugin(mongoosePaginationPlugin, cacheProvider, paginationLogic, aggregationPaginationLogic);

UserSchema.plugin(mongoosePaginationPlugin<User>, new MemoryCacheProvider<number>(1));
// UserSchema.plugin(paginationPlugin(new MemoryCacheProvider<number>(1))) // 1ms cache, for testing

UserSchema.index({ _id: 1, email: 1 });
UserSchema.index({ _id: -1, email: -1 });
UserSchema.index({ category: 1 });

const userModel = mongoose.model<User, PaginationModel<User>>('User', UserSchema);

export default userModel;
