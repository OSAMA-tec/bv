import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Property, PropertyDocument } from '../models/property.model';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CloudinaryProvider } from '../cloudinary/cloudinary.provider';
import { User } from '../models/user.model';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    private readonly cloudinaryProvider: CloudinaryProvider,
  ) {}

  // ============ Create Property ============
  async create(
    createPropertyDto: CreatePropertyDto,
    userId: string | { id: string },
    files: {
      images?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    },
  ): Promise<Property> {
    try {
      console.log('\n==================================================');
      console.log('🔄 PROPERTY SERVICE - CREATE METHOD');
      console.log('==================================================');

      const ownerId = this.extractUserId(userId);
      console.log('👤 Owner ID for property creation:', ownerId);

      console.log('\n📝 Processing DTO:', {
        title: createPropertyDto.title,
        propertyType: createPropertyDto.propertyType,
        price: createPropertyDto.price,
        coordinates: createPropertyDto.coordinates,
        address: createPropertyDto.address,
        ownerId,
      });

      const imageUrls = files.images
        ? await Promise.all(
            files.images.map(async (file) => {
              console.log('\n📤 Uploading image:', file.originalname);
              const url = await this.cloudinaryProvider.uploadFile(
                file,
                'properties/images',
              );
              console.log('✅ Image uploaded:', url);
              return url;
            }),
          )
        : [];

      const documentUrls = files.documents
        ? await Promise.all(
            files.documents.map(async (file) => {
              console.log('\n📤 Uploading document:', file.originalname);
              const url = await this.cloudinaryProvider.uploadFile(
                file,
                'properties/documents',
              );
              console.log('✅ Document uploaded:', url);
              return url;
            }),
          )
        : [];

      console.log('\n🏗️ Creating property document...');
      const property = new this.propertyModel({
        ...createPropertyDto,
        owner: ownerId,
        location: {
          type: 'Point',
          coordinates: createPropertyDto.coordinates,
        },
        images: imageUrls,
        documents: documentUrls,
        status: 'pending',
      });

      console.log('\n💾 Saving to database...');
      const savedProperty = await property.save();
      console.log('✅ Property saved successfully:', savedProperty._id);
      console.log('==================================================\n');

      return savedProperty;
    } catch (error) {
      console.error('\n❌ Error in create property service:', error);
      if (error.name === 'ValidationError') {
        console.error('Validation error details:', error.errors);
      }
      throw error;
    }
  }

  // ============ Get Properties ============
  async findAll(query: any = {}): Promise<Property[]> {
    return this.propertyModel
      .find(query)
      .populate('owner', 'name email')
      .exec();
  }

  async findOne(id: string): Promise<Property> {
    const property = await this.propertyModel
      .findById(id)
      .populate('owner', 'name email')
      .exec();

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  async findByOwner(userId: string | { id: string }): Promise<Property[]> {
    const ownerId = this.extractUserId(userId);
    console.log('\n🔍 Finding properties for owner:', ownerId);

    return this.propertyModel
      .find({ owner: ownerId })
      .populate('owner', 'name email')
      .exec();
  }

  // ============ Update Property ============
  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
    files?: {
      images?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    },
  ): Promise<Property> {
    const property = await this.propertyModel.findById(id);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Handle file uploads if any
    if (files) {
      if (files.images) {
        const newImageUrls = await Promise.all(
          files.images.map((file) =>
            this.cloudinaryProvider.uploadFile(file, 'properties/images'),
          ),
        );
        property.images = [...property.images, ...newImageUrls];
      }

      if (files.documents) {
        const newDocumentUrls = await Promise.all(
          files.documents.map((file) =>
            this.cloudinaryProvider.uploadFile(file, 'properties/documents'),
          ),
        );
        property.documents = [...property.documents, ...newDocumentUrls];
      }
    }

    // Update location if coordinates provided
    if (updatePropertyDto.coordinates) {
      property.location = {
        type: 'Point',
        coordinates: updatePropertyDto.coordinates,
      };
      delete updatePropertyDto.coordinates;
    }

    // Update other fields
    Object.assign(property, updatePropertyDto);

    return await property.save();
  }

  // ============ Delete Property ============
  async remove(id: string): Promise<void> {
    const property = await this.propertyModel.findById(id);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Delete associated files from Cloudinary
    await this.deleteFiles([...property.images, ...property.documents]);

    await property.deleteOne();
  }

  // ============ File Handling ============
  private async deleteFiles(urls: string[]): Promise<void> {
    const deletePromises = urls.map((url) =>
      this.cloudinaryProvider.deleteFile(url),
    );

    await Promise.all(deletePromises);
  }

  // ============ Additional Methods ============
  async removeFile(
    propertyId: string,
    fileUrl: string,
    fileType: 'image' | 'document',
  ): Promise<Property> {
    const property = await this.propertyModel.findById(propertyId);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Remove file from Cloudinary
    await this.cloudinaryProvider.deleteFile(fileUrl);

    // Remove URL from property
    if (fileType === 'image') {
      property.images = property.images.filter((url) => url !== fileUrl);
    } else {
      property.documents = property.documents.filter((url) => url !== fileUrl);
    }

    return await property.save();
  }

  async updateStatus(id: string, status: string): Promise<Property> {
    const property = await this.propertyModel.findById(id);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    property.status = status;
    return await property.save();
  }

  // ============ Blockchain Operations ============
  async tokenizeProperty(
    propertyId: string,
    userId: string | { id: string },
    tokenData: {
      tokenId: string;
      contractAddress: string;
      tokenURI: string;
      transactionHash: string;
    },
  ): Promise<Property> {
    const property = await this.propertyModel.findById(propertyId);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const currentUserId = this.extractUserId(userId);
    console.log('\n==== Ownership Debug Information ====');
    console.log('Property Owner ID:', property.owner.toString());
    console.log('Current User ID:', currentUserId);
    console.log('Are IDs equal?:', property.owner.toString() === currentUserId);
    console.log('================================\n');

    if (property.owner.toString() !== currentUserId) {
      throw new ForbiddenException('Not authorized to tokenize this property');
    }

    if (property.isTokenized) {
      throw new BadRequestException('Property is already tokenized');
    }

    try {
      console.log('\n🔄 Starting property tokenization process...');

      // Generate NFT metadata
      const nftMetadata = {
        name: property.title,
        description: property.description,
        image: property.images[0], // Use first image as NFT image
        attributes: [
          {
            trait_type: 'Property Type',
            value: property.propertyType,
          },
          {
            trait_type: 'Area',
            value: property.area || 0,
          },
          {
            trait_type: 'Bedrooms',
            value: property.bedrooms || 0,
          },
          {
            trait_type: 'Bathrooms',
            value: property.bathrooms || 0,
          },
          {
            trait_type: 'Year Built',
            value: property.yearBuilt || 'N/A',
          },
        ],
        externalUrl: `${process.env.FRONTEND_URL}/properties/${property._id}`,
      };

      // Update property with tokenization data
      property.isTokenized = true;
      property.tokenId = tokenData.tokenId;
      property.contractAddress = tokenData.contractAddress;
      property.tokenURI = tokenData.tokenURI;
      property.status = 'tokenized';
      property.nftMetadata = nftMetadata;

      // Add tokenization event to history
      property.history.push({
        type: 'tokenize',
        price: property.price,
        date: new Date(),
        transactionHash: tokenData.transactionHash,
        from: property.owner,
        tokenId: tokenData.tokenId,
        contractAddress: tokenData.contractAddress,
        tokenURI: tokenData.tokenURI,
        metadata: {
          blockNumber: Date.now(), // In a real scenario, this would come from the blockchain
          network: process.env.BLOCKCHAIN_NETWORK || 'polygon-mumbai',
          timestamp: new Date().toISOString(),
        },
      });

      console.log('✅ Property tokenized successfully');
      return await property.save();
    } catch (error) {
      console.error('❌ Error in tokenization:', error);
      throw new BadRequestException('Failed to tokenize property');
    }
  }

  async transferProperty(
    propertyId: string,
    fromUserId: string | { id: string },
    toUserId: string,
    price: number,
    transactionHash: string,
  ): Promise<Property> {
    const property = await this.propertyModel.findById(propertyId);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const currentUserId = this.extractUserId(fromUserId);
    console.log('\n==== Transfer Debug Information ====');
    console.log('Property Owner ID:', property.owner.toString());
    console.log('From User ID:', currentUserId);
    console.log('To User ID:', toUserId);
    console.log('================================\n');

    if (property.owner.toString() !== currentUserId) {
      throw new ForbiddenException('Not authorized to transfer this property');
    }

    if (!property.isTokenized) {
      throw new BadRequestException(
        'Property must be tokenized before transfer',
      );
    }

    try {
      console.log('\n🔄 Starting property transfer process...');

      // Verify toUserId is a valid MongoDB ObjectId
      if (!this.isValidObjectId(toUserId)) {
        throw new BadRequestException('Invalid recipient user ID format');
      }

      // Update property owner with proper ObjectId
      property.owner = toUserId as any as User;
      property.status = 'sold';

      // Add transfer event to history with proper ObjectId conversion
      property.history.push({
        type: 'transfer',
        price,
        date: new Date(),
        transactionHash,
        from: currentUserId as any as User,
        to: toUserId as any as User,
        tokenId: property.tokenId,
        contractAddress: property.contractAddress,
        metadata: {
          blockNumber: Date.now(),
          network: process.env.BLOCKCHAIN_NETWORK || 'polygon-mumbai',
          timestamp: new Date().toISOString(),
          previousOwner: currentUserId,
          newOwner: toUserId,
        },
      });

      console.log('✅ Property transferred successfully');
      return await property.save();
    } catch (error) {
      console.error('❌ Error in transfer:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to transfer property: ' + (error.message || 'Unknown error'),
      );
    }
  }

  async listPropertyForSale(
    propertyId: string,
    userId: string | { id: string },
    price: number,
    transactionHash: string,
  ): Promise<Property> {
    const property = await this.propertyModel.findById(propertyId);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const currentUserId = this.extractUserId(userId);
    if (property.owner.toString() !== currentUserId) {
      throw new ForbiddenException('Not authorized to list this property');
    }

    if (!property.isTokenized) {
      throw new BadRequestException('Property must be tokenized first');
    }

    if (property.status === 'listed') {
      throw new BadRequestException('Property is already listed');
    }

    property.status = 'listed';
    property.price = price;
    property.history.push({
      type: 'list',
      price,
      date: new Date(),
      transactionHash,
      from: property.owner,
    });

    return await property.save();
  }

  async unlistProperty(
    propertyId: string,
    userId: string | { id: string },
    transactionHash: string,
  ): Promise<Property> {
    const property = await this.propertyModel.findById(propertyId);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const currentUserId = this.extractUserId(userId);
    if (property.owner.toString() !== currentUserId) {
      throw new ForbiddenException('Not authorized to unlist this property');
    }

    if (property.status !== 'listed') {
      throw new BadRequestException('Property is not listed');
    }

    property.status = 'unlisted';
    property.history.push({
      type: 'unlist',
      price: property.price,
      date: new Date(),
      transactionHash,
      from: property.owner,
    });

    return await property.save();
  }

  async placeBid(
    propertyId: string,
    userId: string | { id: string },
    bidAmount: number,
    transactionHash: string,
  ): Promise<Property> {
    const property = await this.propertyModel.findById(propertyId);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const currentUserId = this.extractUserId(userId);
    if (!property.isAuctionEnabled) {
      throw new BadRequestException('Property is not available for auction');
    }

    if (property.auctionEndTime && new Date() > property.auctionEndTime) {
      throw new BadRequestException('Auction has ended');
    }

    if (bidAmount <= property.currentBid) {
      throw new BadRequestException(
        'Bid amount must be higher than current bid',
      );
    }

    if (property.minimumBid && bidAmount < property.minimumBid) {
      throw new BadRequestException(
        'Bid amount must be higher than minimum bid',
      );
    }

    property.currentBid = bidAmount;
    property.history.push({
      type: 'bid',
      price: bidAmount,
      date: new Date(),
      transactionHash,
      from: currentUserId as any,
    });

    return await property.save();
  }

  // ============ Property Analytics ============
  async incrementViews(propertyId: string): Promise<void> {
    await this.propertyModel.findByIdAndUpdate(propertyId, {
      $inc: { views: 1 },
    });
  }

  async toggleFavorite(
    propertyId: string,
    userId: string | { id: string },
  ): Promise<Property> {
    const property = await this.propertyModel.findById(propertyId);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const currentUserId = this.extractUserId(userId);
    const index = property.favorites.findIndex(
      (id) => id.toString() === currentUserId,
    );

    if (index === -1) {
      property.favorites.push(currentUserId as any);
    } else {
      property.favorites.splice(index, 1);
    }

    return await property.save();
  }

  async getPropertyHistory(propertyId: string): Promise<Property['history']> {
    const property = await this.propertyModel
      .findById(propertyId)
      .populate('history.from', 'name email')
      .populate('history.to', 'name email');

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property.history;
  }

  private extractUserId(userId: string | { id: string }): string {
    console.log('\n🔍 Extracting user ID from:', userId);
    const extractedId = typeof userId === 'string' ? userId : userId.id;
    console.log('📋 Extracted ID:', extractedId);
    return extractedId;
  }

  private isValidObjectId(id: string): boolean {
    try {
      return Types.ObjectId.isValid(id);
    } catch {
      return false;
    }
  }
}
