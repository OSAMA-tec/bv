import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NotificationPreferencesDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  push?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  sms?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  marketing?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  updates?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  security?: boolean;
}
