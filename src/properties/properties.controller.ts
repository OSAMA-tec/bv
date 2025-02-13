import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Properties')
@ApiBearerAuth()
@Controller('properties')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  // ============ Create Property ============
  @Post()
  @ApiOperation({ summary: 'Create a new property' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreatePropertyDto,
    description: 'Property creation data with files',
  })
  @ApiResponse({
    status: 201,
    description: 'Property has been successfully created.',
  })
  @Roles('user', 'admin')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 },
      { name: 'documents', maxCount: 5 },
    ]),
  )
  create(
    @Body() createPropertyDto: CreatePropertyDto,
    @CurrentUser('id') userId: string,
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    },
  ) {
    return this.propertiesService.create(createPropertyDto, userId, files);
  }

  // ============ Get Properties ============
  @Get()
  @ApiOperation({ summary: 'Get all properties' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'listed', 'sold', 'unlisted'],
  })
  @ApiQuery({
    name: 'propertyType',
    required: false,
    enum: ['residential', 'commercial', 'land'],
  })
  findAll(@Query() query: any) {
    return this.propertiesService.findAll(query);
  }

  @Get('my-properties')
  @ApiOperation({ summary: 'Get current user properties' })
  @Roles('user', 'admin')
  findMyProperties(@CurrentUser('id') userId: string) {
    return this.propertiesService.findByOwner(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  // ============ Update Property ============
  @Patch(':id')
  @ApiOperation({ summary: 'Update property' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Property ID' })
  @Roles('user', 'admin')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 },
      { name: 'documents', maxCount: 5 },
    ]),
  )
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    },
  ) {
    return this.propertiesService.update(id, updatePropertyDto, files);
  }

  // ============ Delete Property ============
  @Delete(':id')
  @ApiOperation({ summary: 'Delete property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @Roles('user', 'admin')
  remove(@Param('id') id: string) {
    return this.propertiesService.remove(id);
  }

  // ============ File Management ============
  @Delete(':id/files')
  @ApiOperation({ summary: 'Remove property file' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileUrl: { type: 'string' },
        fileType: { type: 'string', enum: ['image', 'document'] },
      },
    },
  })
  @Roles('user', 'admin')
  removeFile(
    @Param('id') id: string,
    @Body('fileUrl') fileUrl: string,
    @Body('fileType') fileType: 'image' | 'document',
  ) {
    return this.propertiesService.removeFile(id, fileUrl, fileType);
  }

  // ============ Status Management ============
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update property status' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'listed', 'sold', 'unlisted'],
        },
      },
    },
  })
  @Roles('admin')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.propertiesService.updateStatus(id, status);
  }

  // ============ Blockchain Operations ============
  @Post(':id/tokenize')
  @ApiOperation({ summary: 'Tokenize property as NFT' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tokenId: { type: 'string', example: '1234' },
        contractAddress: { type: 'string', example: '0x123...abc' },
        tokenURI: { type: 'string', example: 'ipfs://Qm...' },
        transactionHash: { type: 'string', example: '0xabc...' },
      },
      required: ['tokenId', 'contractAddress', 'tokenURI', 'transactionHash'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Property has been tokenized',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        isTokenized: { type: 'boolean' },
        tokenId: { type: 'string' },
        contractAddress: { type: 'string' },
        tokenURI: { type: 'string' },
        history: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['mint', 'transfer', 'list', 'unlist', 'sale', 'bid'],
              },
              price: { type: 'number' },
              date: { type: 'string', format: 'date-time' },
              transactionHash: { type: 'string' },
              from: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
              to: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  @Roles('user', 'admin')
  async tokenizeProperty(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body()
    tokenData: {
      tokenId: string;
      contractAddress: string;
      tokenURI: string;
      transactionHash: string;
    },
  ) {
    return this.propertiesService.tokenizeProperty(id, userId, tokenData);
  }

  @Post(':id/list')
  @ApiOperation({ summary: 'List property for sale' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        price: { type: 'number', example: 100000 },
        transactionHash: { type: 'string', example: '0xabc...' },
      },
      required: ['price', 'transactionHash'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Property has been listed for sale',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string', enum: ['listed'] },
        price: { type: 'number' },
        history: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['list'] },
              price: { type: 'number' },
              date: { type: 'string', format: 'date-time' },
              transactionHash: { type: 'string' },
              from: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  @Roles('user', 'admin')
  async listPropertyForSale(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() listData: { price: number; transactionHash: string },
  ) {
    return this.propertiesService.listPropertyForSale(
      id,
      userId,
      listData.price,
      listData.transactionHash,
    );
  }

  @Post(':id/unlist')
  @ApiOperation({ summary: 'Unlist property from sale' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        transactionHash: { type: 'string' },
      },
      required: ['transactionHash'],
    },
  })
  @Roles('user', 'admin')
  async unlistProperty(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('transactionHash') transactionHash: string,
  ) {
    return this.propertiesService.unlistProperty(id, userId, transactionHash);
  }

  @Post(':id/transfer')
  @ApiOperation({ summary: 'Transfer property ownership' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        toUserId: { type: 'string', example: 'recipient_user_id' },
        price: { type: 'number', example: 100000 },
        transactionHash: { type: 'string', example: '0xabc...' },
      },
      required: ['toUserId', 'price', 'transactionHash'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Property ownership has been transferred',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string', enum: ['sold'] },
        owner: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
          },
        },
        history: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['sale'] },
              price: { type: 'number' },
              date: { type: 'string', format: 'date-time' },
              transactionHash: { type: 'string' },
              from: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
              to: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  @Roles('user', 'admin')
  async transferProperty(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body()
    transferData: { toUserId: string; price: number; transactionHash: string },
  ) {
    return this.propertiesService.transferProperty(
      id,
      userId,
      transferData.toUserId,
      transferData.price,
      transferData.transactionHash,
    );
  }

  @Post(':id/bid')
  @ApiOperation({ summary: 'Place bid on property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bidAmount: { type: 'number', example: 110000 },
        transactionHash: { type: 'string', example: '0xabc...' },
      },
      required: ['bidAmount', 'transactionHash'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bid has been placed on property',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        currentBid: { type: 'number' },
        history: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['bid'] },
              price: { type: 'number' },
              date: { type: 'string', format: 'date-time' },
              transactionHash: { type: 'string' },
              from: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  @Roles('user', 'admin')
  async placeBid(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() bidData: { bidAmount: number; transactionHash: string },
  ) {
    return this.propertiesService.placeBid(
      id,
      userId,
      bidData.bidAmount,
      bidData.transactionHash,
    );
  }

  // ============ Property Analytics ============
  @Post(':id/view')
  @ApiOperation({ summary: 'Increment property views' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  async incrementViews(@Param('id') id: string) {
    return this.propertiesService.incrementViews(id);
  }

  @Post(':id/favorite')
  @ApiOperation({ summary: 'Toggle property favorite status' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @Roles('user', 'admin')
  async toggleFavorite(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.propertiesService.toggleFavorite(id, userId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get property transaction history' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({
    status: 200,
    description: 'Property transaction history',
    schema: {
      type: 'object',
      properties: {
        history: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['mint', 'transfer', 'list', 'unlist', 'sale', 'bid'],
              },
              price: { type: 'number' },
              date: { type: 'string', format: 'date-time' },
              transactionHash: { type: 'string' },
              from: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
              to: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  async getPropertyHistory(@Param('id') id: string) {
    return this.propertiesService.getPropertyHistory(id);
  }
}
