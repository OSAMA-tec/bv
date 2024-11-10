import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Property } from './property.model';
import { User } from './user.model';

export type NFTDocument = NFT & Document;

@Schema({ timestamps: true })
export class NFT {
  @Prop({ required: true })
  tokenId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Property',
    required: true,
  })
  property: Property;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  owner: User;

  @Prop({ required: true })
  contractAddress: string;

  @Prop()
  ipfsHash: string;

  @Prop({ required: true })
  tokenURI: string;

  @Prop({ default: false })
  isListed: boolean;

  @Prop()
  price: number;
}

export const NFTSchema = SchemaFactory.createForClass(NFT);
