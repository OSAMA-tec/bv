import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: string;
  walletAddress?: string;
  isKYCVerified: boolean;
  isEmailVerified: boolean;
  verificationCode?: string;
  verificationCodeExpiry?: Date;
  phoneNumber?: string;
  profileImage?: string;
  provider: string;
  providerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = User & Document & IUser;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.verificationCode;
      delete ret.verificationCodeExpiry;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'user', enum: ['user', 'admin'] })
  role: string;

  @Prop({
    required: true,
    enum: ['local', 'google', 'facebook'],
    default: 'local',
  })
  provider: string;

  @Prop()
  providerId?: string;

  @Prop()
  walletAddress?: string;

  @Prop({ default: false })
  isKYCVerified: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  verificationCode?: string;

  @Prop()
  verificationCodeExpiry?: Date;

  @Prop()
  phoneNumber?: string;

  @Prop()
  profileImage?: string;

  @Prop({ default: 'en' })
  language: string;

  @Prop({ default: 'USD' })
  preferredCurrency: string;

  @Prop({ type: Object, default: {} })
  notificationPreferences: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    marketing?: boolean;
    updates?: boolean;
    security?: boolean;
  };

  @Prop({ default: false })
  isTwoFactorEnabled: boolean;

  @Prop()
  twoFactorSecret?: string;

  @Prop({ type: Date })
  lastLogin?: Date;

  @Prop({ type: [Object], default: [] })
  devices: Array<{
    deviceId: string;
    deviceType: string;
    lastActive: Date;
  }>;

  @Prop({ type: Object, default: {} })
  preferences: {
    darkMode?: boolean;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    timezone?: string;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
