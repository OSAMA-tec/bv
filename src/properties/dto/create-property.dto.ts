import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  IsBoolean,
  Min,
  IsUrl,
  ArrayMinSize,
  ArrayMaxSize,
  IsISO8601,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class Coordinates {
  @IsLongitude()
  @Type(() => Number)
  longitude: number;

  @IsLatitude()
  @Type(() => Number)
  latitude: number;
}

export class CreatePropertyDto {
  @ApiProperty({
    description: 'Property title',
    example: 'Luxury Villa',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Property description',
    example: 'Beautiful 4-bedroom villa with garden',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Property price',
    minimum: 0,
    example: 500000,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({
    description: 'Property coordinates [longitude, latitude]',
    example: [73.8567, 18.5204],
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @Type(() => Number)
  @IsLongitude({ each: true })
  @IsLatitude({ each: true })
  coordinates: [number, number];

  @ApiProperty({
    description: 'Property address',
    example: '123 Main St, City',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Type of property',
    enum: ['residential', 'commercial', 'land'],
    example: 'residential',
  })
  @IsEnum(['residential', 'commercial', 'land'])
  propertyType: string;

  // ============ Optional Property Details ============
  @ApiPropertyOptional({
    description: 'Property area in square feet',
    minimum: 0,
    example: 2500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  area?: number;

  @ApiPropertyOptional({
    description: 'Number of bedrooms',
    minimum: 0,
    example: 4,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bedrooms?: number;

  @ApiPropertyOptional({
    description: 'Number of bathrooms',
    minimum: 0,
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bathrooms?: number;

  @ApiPropertyOptional({
    description: 'Property amenities',
    type: [String],
    example: ['parking', 'pool', 'garden'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'Year property was built',
    minimum: 1800,
    example: 2020,
  })
  @IsOptional()
  @IsNumber()
  @Min(1800)
  @Type(() => Number)
  yearBuilt?: number;

  @ApiPropertyOptional({
    description: 'Construction status',
    example: 'completed',
  })
  @IsOptional()
  @IsString()
  constructionStatus?: string;

  @ApiPropertyOptional({
    description: 'Legal description of property',
    example: 'Plot No. 123, Survey No. 456',
  })
  @IsOptional()
  @IsString()
  legalDescription?: string;

  @ApiPropertyOptional({
    description: 'Property ID from legal documents',
    example: 'PROP123',
  })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({
    description: 'URL to verification document',
    example: 'https://example.com/document.pdf',
  })
  @IsOptional()
  @IsUrl()
  verificationDocument?: string;

  @ApiPropertyOptional({
    description: 'Whether property is available for auction',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isAuctionEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum bid amount',
    minimum: 0,
    example: 550000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minimumBid?: number;

  @ApiPropertyOptional({
    description: 'Auction end time',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsISO8601()
  auctionEndTime?: Date;
}
