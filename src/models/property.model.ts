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

  @Prop({ required: true })
  propertyType: string;

  @Prop()
  images: string[];

  @Prop()
  documents: string[];

  @Prop({ default: false })
  isTokenized: boolean;

  @Prop()
  tokenId: string;

  @Prop()
  contractAddress: string;

  @Prop({ default: 'pending' })
  status: string;

  @Prop()
  area: number;

  @Prop()
  bedrooms: number;

  @Prop()
  bathrooms: number;
}

export const PropertySchema = SchemaFactory.createForClass(Property);
