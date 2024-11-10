import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as admin from 'firebase-admin';
import { User, UserDocument } from '../models/user.model';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { FirebaseAuthDto } from './dto/firebase-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      // Check if user exists
      const existingUser = await this.userModel.findOne({
        email: registerDto.email,
      });

      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Create new user
      const newUser = new this.userModel({
        ...registerDto,
        password: hashedPassword,
      });

      const savedUser = await newUser.save();

      // Generate JWT token
      const token = this.generateToken(savedUser);

      return this.buildResponse(savedUser, token);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Registration failed');
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    try {
      // Find user
      const user = await this.userModel.findOne({ email: loginDto.email });
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate JWT token
      const token = this.generateToken(user);

      return this.buildResponse(user, token);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Login failed');
    }
  }

  async validateFirebaseToken(firebaseAuthDto: FirebaseAuthDto) {
    try {
      // Verify Firebase token
      const decodedToken = await admin
        .auth()
        .verifyIdToken(firebaseAuthDto.idToken);

      // Find or create user
      let user = await this.userModel.findOne({
        email: decodedToken.email,
        provider: firebaseAuthDto.provider,
      });

      if (!user) {
        // Create new user if doesn't exist
        user = await this.userModel.create({
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.email,
          provider: firebaseAuthDto.provider,
          providerId: decodedToken.uid,
          profileImage: decodedToken.picture,
          role: 'user',
        });
      }

      // Generate JWT token
      const token = this.generateToken(user);

      return this.buildResponse(user, token);
    } catch {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  private generateToken(user: UserDocument): string {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      provider: user.provider,
    };
    return this.jwtService.sign(payload);
  }

  private buildResponse(user: UserDocument, token: string): AuthResponse {
    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        isKYCVerified: user.isKYCVerified,
      },
      token,
    };
  }
}
