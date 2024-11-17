import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { User, UserDocument } from '../models/user.model';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { NotificationPreferencesDto } from './dto/notification-preferences.dto';
import { SecuritySettingsDto } from './dto/security-settings.dto';

@Injectable()
export class SettingsService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, updateProfileDto, { new: true })
      .select('-password');

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferencesDto,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...preferences,
    };
    await user.save();

    return user.notificationPreferences;
  }

  async enable2FA(userId: string) {
    const secret = speakeasy.generateSecret();
    const user = await this.userModel.findById(userId);

    if (!user) throw new NotFoundException('User not found');

    user.twoFactorSecret = secret.base32;
    await user.save();

    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: user.email,
      issuer: 'Your App Name',
    });

    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
    return { qrCodeUrl, secret: secret.base32 };
  }

  async verify2FA(userId: string, token: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.twoFactorSecret) throw new BadRequestException('2FA not enabled');

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
    });

    if (!verified) throw new BadRequestException('Invalid verification code');

    user.isTwoFactorEnabled = true;
    await user.save();

    return { message: '2FA enabled successfully' };
  }

  async updatePassword(userId: string, securitySettings: SecuritySettingsDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (!securitySettings.currentPassword || !securitySettings.newPassword) {
      throw new BadRequestException(
        'Both current and new password are required',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      securitySettings.currentPassword,
      user.password,
    );
    if (!isPasswordValid) throw new UnauthorizedException('Invalid password');

    const hashedPassword = await bcrypt.hash(securitySettings.newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return { message: 'Password updated successfully' };
  }

  async updateDeviceInfo(userId: string, deviceInfo: any) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const existingDeviceIndex = user.devices.findIndex(
      (device) => device.deviceId === deviceInfo.deviceId,
    );

    if (existingDeviceIndex > -1) {
      user.devices[existingDeviceIndex].lastActive = new Date();
    } else {
      user.devices.push({
        ...deviceInfo,
        lastActive: new Date(),
      });
    }

    await user.save();
    return user.devices;
  }

  async updatePreferences(userId: string, preferences: any) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.preferences = {
      ...user.preferences,
      ...preferences,
    };
    await user.save();

    return user.preferences;
  }

  async updateSecuritySettings(
    userId: string,
    securitySettings: SecuritySettingsDto,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (securitySettings.currentPassword && securitySettings.newPassword) {
      const isPasswordValid = await bcrypt.compare(
        securitySettings.currentPassword,
        user.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid current password');
      }
      user.password = await bcrypt.hash(securitySettings.newPassword, 10);
    }

    if (securitySettings.twoFactorEnabled !== undefined) {
      if (securitySettings.twoFactorEnabled === false) {
        user.isTwoFactorEnabled = false;
        user.twoFactorSecret = undefined;
      }
    }

    await user.save();

    return {
      twoFactorEnabled: user.isTwoFactorEnabled,
      message: 'Security settings updated successfully',
    };
  }
}
