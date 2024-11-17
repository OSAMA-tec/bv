import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SettingsService } from './settings.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { NotificationPreferencesDto } from './dto/notification-preferences.dto';
import { SecuritySettingsDto } from './dto/security-settings.dto';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user profile settings' })
  @ApiResponse({
    status: 200,
    description: 'Returns the user profile settings',
  })
  async getProfile(@CurrentUser() user) {
    return this.settingsService.getProfile(user.id);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile settings' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser() user,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.settingsService.updateProfile(user.id, updateProfileDto);
  }

  @Put('notifications')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update notification preferences' })
  async updateNotificationPreferences(
    @CurrentUser() user,
    @Body() preferences: NotificationPreferencesDto,
  ) {
    return this.settingsService.updateNotificationPreferences(
      user.id,
      preferences,
    );
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enable two-factor authentication' })
  async enable2FA(@CurrentUser() user) {
    return this.settingsService.enable2FA(user.id);
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify two-factor authentication code' })
  async verify2FA(@CurrentUser() user, @Body('token') token: string) {
    return this.settingsService.verify2FA(user.id, token);
  }

  @Put('security')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update security settings' })
  @ApiBody({ type: SecuritySettingsDto })
  async updateSecuritySettings(
    @CurrentUser() user,
    @Body() securitySettings: SecuritySettingsDto,
  ) {
    return this.settingsService.updateSecuritySettings(
      user.id,
      securitySettings,
    );
  }

  @Put('security/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update password' })
  @ApiBody({ type: SecuritySettingsDto })
  async updatePassword(
    @CurrentUser() user,
    @Body() securitySettings: SecuritySettingsDto,
  ) {
    return this.settingsService.updatePassword(user.id, securitySettings);
  }

  @Put('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user preferences' })
  async updatePreferences(@CurrentUser() user, @Body() preferences: any) {
    return this.settingsService.updatePreferences(user.id, preferences);
  }

  @Post('devices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Update device information' })
  async updateDeviceInfo(@CurrentUser() user, @Body() deviceInfo: any) {
    return this.settingsService.updateDeviceInfo(user.id, deviceInfo);
  }
}
