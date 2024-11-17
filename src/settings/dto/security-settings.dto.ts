import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SecuritySettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;

  @ApiProperty({ required: false, minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  currentPassword?: string;

  @ApiProperty({ required: false, minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;
}
