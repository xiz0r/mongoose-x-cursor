import mongoose, { Schema, type Document } from 'mongoose'
import paginationPlugin, { MemoryCacheProvider, PaginationModel } from '../../src'

const AllModels = ['ppmattingv2', 'ppmatting_512', 'ppmatting_1024', 'modnet', 'modnet_mobilenetv2', 'modnet_resnet50'] as const
export type AiModel = (typeof AllModels)[number]

export interface UserInfo {
  userName: string
  guid: string
  email: string
}

export type ImageStyle = 'formal' | 'casual' | 'extra-casual' | 'custom'
export type ImageStatus = 'approved' | 'pending' | 'rejected' | 'discarded'
export type ImageExtension = 'png' | 'jpg' | 'webp'

export interface ProcessedImage {
  name: string
  fileExtension: string
  lastUpdated: Date
  approvedBy?: string
  backgroundId: string
}

export interface ImageDto {
  style: ImageStyle
  name: string
  fileExtension: string
  status: ImageStatus
  user: UserInfo
  createdBy: UserInfo
  created: Date
  lastUpdated: Date
  reviewedBy?: UserInfo
  reviewDate?: Date
  width?: number
  height?: number
  aimodel?: AiModel
  processedImages?: ProcessedImage[]
  processedModels?: string[]
  retry?: number
}

export interface Image extends Document, ImageDto { }

const ImageSchema = new Schema<Image>(
  {
    style: { type: String, required: true },
    name: { type: String, required: true },
    fileExtension: { type: String, required: true },
    status: { type: String, required: true },
    user: {
      userName: { type: String, required: true },
      guid: { type: String, required: true },
      email: { type: String, required: true }
    },
    createdBy: {
      userName: { type: String, required: true },
      guid: { type: String, required: true },
      email: { type: String, required: true }
    },
    created: { type: Date, required: true },
    lastUpdated: { type: Date, required: true },
    reviewedBy: {
      userName: { type: String, required: false },
      guid: { type: String, required: false },
      email: { type: String, required: false }
    },
    reviewDate: { type: Date, required: false },
    width: { type: Number, required: false },
    height: { type: Number, required: false },
    aimodel: { type: String, required: false, alias: 'model' },
    processedImages: [
      {
        name: { type: String, required: true },
        fileExtension: { type: String, required: true },
        lastUpdated: { type: Date, required: true },
        approvedBy: { type: String, required: false },
        backgroundId: { type: String, required: true }
      }
    ],
    processedModels: { type: [String], required: false },
    retry: { type: Number, required: false }
  },
  { collection: 'bio-images' }
)

ImageSchema.index({ _id: 1, status: 1, style: 1 })
ImageSchema.index({ _id: 1, status: 1, style: 1, 'user.userName': 1 })
ImageSchema.index({ _id: 1, status: 1, style: 1, 'user.guid': 1 })
ImageSchema.index({ _id: 1, status: 1, style: 1, 'user.email': 1 })
ImageSchema.index({ _id: 1, status: 1, style: 1, 'user.email': 1, 'user.guid': 1, 'user.userName': 1 })

// ImageSchema.plugin(paginationPlugin(new MemoryCacheProvider<number>())) 
ImageSchema.plugin(paginationPlugin(new MemoryCacheProvider<number>(1))) // eslint-disable-line

export const ImageModel = mongoose.model<Image, PaginationModel<Image>>('Image', ImageSchema)
