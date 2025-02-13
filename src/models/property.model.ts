import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.model';

export type PropertyDocument = Property & Document;

@Schema({ timestamps: true })
export class Property {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  owner: User;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({ required: true })
  address: string;

  @Prop({ required: true, enum: ['residential', 'commercial', 'land'] })
  propertyType: string;

  @Prop([String])
  images: string[];

  @Prop([String])
  documents: string[];

  // ============ Blockchain Related Fields ============
  @Prop({ default: false })
  isTokenized: boolean;

  @Prop()
  tokenId?: string;

  @Prop()
  contractAddress?: string;

  @Prop()
  tokenURI?: string;

  @Prop({
    default: 'pending',
    enum: ['pending', 'listed', 'sold', 'unlisted', 'tokenized'],
  })
  status: string;

  @Prop({ type: Number, default: 0 })
  currentBid: number;

  @Prop({ type: Number })
  minimumBid?: number;

  @Prop({ type: Boolean, default: false })
  isAuctionEnabled: boolean;

  @Prop({ type: Date })
  auctionEndTime?: Date;

  @Prop([
    {
      type: {
        type: String,
        enum: ['mint', 'transfer', 'list', 'unlist', 'sale', 'bid', 'tokenize'],
        required: true,
      },
      price: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      transactionHash: { type: String, required: true },
      from: {
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      to: { type: MongooseSchema.Types.ObjectId, ref: 'User' },
      tokenId: String,
      contractAddress: String,
      tokenURI: String,
      metadata: {
        type: Object,
        default: {},
      },
    },
  ])
  history: Array<{
    type: 'mint' | 'transfer' | 'list' | 'unlist' | 'sale' | 'bid' | 'tokenize';
    price: number;
    date: Date;
    transactionHash: string;
    from: User;
    to?: User;
    tokenId?: string;
    contractAddress?: string;
    tokenURI?: string;
    metadata?: Record<string, any>;
  }>;

  // ============ Property Details ============
  @Prop({ type: Number })
  area?: number;

  @Prop({ type: Number })
  bedrooms?: number;

  @Prop({ type: Number })
  bathrooms?: number;

  @Prop({ type: Number, default: 0 })
  views: number;

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ type: Number })
  yearBuilt?: number;

  @Prop({ type: String })
  constructionStatus?: string;

  @Prop({ type: Boolean, default: false })
  isFeatured: boolean;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  favorites: User[];

  // ============ Legal Information ============
  @Prop({ type: String })
  legalDescription?: string;

  @Prop({ type: String })
  propertyId?: string;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop({ type: Date })
  verificationDate?: Date;

  @Prop({ type: String })
  verificationDocument?: string;

  // ============ NFT Metadata ============
  @Prop({ type: Object, default: {} })
  nftMetadata?: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
    externalUrl?: string;
    animationUrl?: string;
  };
}

export const PropertySchema = SchemaFactory.createForClass(Property);

// Add indexes
PropertySchema.index({ location: '2dsphere' });
PropertySchema.index({ title: 'text', description: 'text' });
PropertySchema.index({ tokenId: 1 }, { unique: true, sparse: true });
PropertySchema.index({ status: 1 });
PropertySchema.index({ propertyType: 1 });
PropertySchema.index({ isTokenized: 1 });
PropertySchema.index({ isFeatured: 1 });
