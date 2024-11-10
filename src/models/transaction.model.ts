import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.model';
import { Property } from './property.model';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  buyer: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  seller: User;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Property',
    required: true,
  })
  property: Property;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: ['crypto', 'fiat'] })
  paymentType: string;

  @Prop()
  transactionHash: string;

  @Prop({ default: 'pending', enum: ['pending', 'completed', 'failed'] })
  status: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
