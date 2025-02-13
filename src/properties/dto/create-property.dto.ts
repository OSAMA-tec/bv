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
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePropertyDto {
  @ApiProperty({ description: 'Property title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Property description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Property price', minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Property coordinates [longitude, latitude]',
    type: [Number],
    example: [73.8567, 18.5204],
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  coordinates: number[];

  @ApiProperty({ description: 'Property address' })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Type of property',
    enum: ['residential', 'commercial', 'land'],
  })
  @IsEnum(['residential', 'commercial', 'land'])
  propertyType: string;

  // ============ Optional Property Details ============
  @ApiPropertyOptional({
    description: 'Property area in square feet',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  area?: number;

  @ApiPropertyOptional({ description: 'Number of bedrooms', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Number of bathrooms', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
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
  })
  @IsOptional()
  @IsNumber()
  @Min(1800)
  yearBuilt?: number;

  @ApiPropertyOptional({ description: 'Construction status' })
  @IsOptional()
  @IsString()
  constructionStatus?: string;

  // ============ Blockchain Related Fields ============
  @ApiPropertyOptional({
    description: 'Whether property is available for auction',
  })
  @IsOptional()
  @IsBoolean()
  isAuctionEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum bid amount',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumBid?: number;

  @ApiPropertyOptional({
    description: 'Auction end time',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsISO8601()
  auctionEndTime?: Date;

  // ============ Legal Information ============
  @ApiPropertyOptional({ description: 'Legal description of property' })
  @IsOptional()
  @IsString()
  legalDescription?: string;

  @ApiPropertyOptional({ description: 'Property ID from legal documents' })
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
}
