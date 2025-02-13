import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from '../models/property.model';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CloudinaryProvider } from '../cloudinary/cloudinary.provider';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    private readonly cloudinaryProvider: CloudinaryProvider,
  ) {}

  // ============ Create Property ============
  async create(
    createPropertyDto: CreatePropertyDto,
    userId: string,
    files: {
      images?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    },
  ): Promise<Property> {
    try {
      const imageUrls = files.images
        ? await Promise.all(
            files.images.map((file) =>
              this.cloudinaryProvider.uploadFile(file, 'properties/images'),
            ),
          )
        : [];

      const documentUrls = files.documents
        ? await Promise.all(
            files.documents.map((file) =>
              this.cloudinaryProvider.uploadFile(file, 'properties/documents'),
            ),
          )
        : [];

      const property = new this.propertyModel({
        ...createPropertyDto,
        owner: userId,
        location: {
          type: 'Point',
          coordinates: createPropertyDto.coordinates,
        },
        images: imageUrls,
        documents: documentUrls,
        status: 'pending',
      });

      return await property.save();
    } catch (error) {
      console.error('Property creation error:', error);
      throw new BadRequestException('Failed to create property');
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

  async findByOwner(userId: string): Promise<Property[]> {
    return this.propertyModel
      .find({ owner: userId })
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
    userId: string,
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

    if (property.owner.toString() !== userId) {
      throw new ForbiddenException('Not authorized to tokenize this property');
    }

    if (property.isTokenized) {
      throw new BadRequestException('Property is already tokenized');
    }

    property.isTokenized = true;
    property.tokenId = tokenData.tokenId;
    property.contractAddress = tokenData.contractAddress;
    property.tokenURI = tokenData.tokenURI;
    property.history.push({
      type: 'mint',
      price: property.price,
      date: new Date(),
      transactionHash: tokenData.transactionHash,
      from: property.owner,
      to: property.owner,
    });

    return await property.save();
  }

  async listPropertyForSale(
    propertyId: string,
    userId: string,
    price: number,
    transactionHash: string,
  ): Promise<Property> {
    const property = await this.propertyModel.findById(propertyId);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.owner.toString() !== userId) {
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
    userId: string,
    transactionHash: string,
  ): Promise<Property> {
    const property = await this.propertyModel.findById(propertyId);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.owner.toString() !== userId) {
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

  async transferProperty(
    propertyId: string,
    fromUserId: string,
    toUserId: string,
    price: number,
    transactionHash: string,
  ): Promise<Property> {
    const property = await this.propertyModel.findById(propertyId);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.owner.toString() !== fromUserId) {
      throw new ForbiddenException('Not authorized to transfer this property');
    }

    property.owner = toUserId as any;
    property.status = 'sold';
    property.history.push({
      type: 'sale',
      price,
      date: new Date(),
      transactionHash,
      from: fromUserId as any,
      to: toUserId as any,
    });

    return await property.save();
  }

  async placeBid(
    propertyId: string,
    userId: string,
    bidAmount: number,
    transactionHash: string,
  ): Promise<Property> {
    const property = await this.propertyModel.findById(propertyId);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

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
      from: userId as any,
    });

    return await property.save();
  }

  // ============ Property Analytics ============
  async incrementViews(propertyId: string): Promise<void> {
    await this.propertyModel.findByIdAndUpdate(propertyId, {
      $inc: { views: 1 },
    });
  }

  async toggleFavorite(propertyId: string, userId: string): Promise<Property> {
    const property = await this.propertyModel.findById(propertyId);

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const userIdStr = userId.toString();
    const index = property.favorites.findIndex(
      (id) => id.toString() === userIdStr,
    );

    if (index === -1) {
      property.favorites.push(userId as any);
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
}
