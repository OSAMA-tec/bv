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
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
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

      // Generate verification code
      const verificationCode = this.emailService.generateVerificationCode();
      const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create new user
      const newUser = new this.userModel({
        ...registerDto,
        password: hashedPassword,
        verificationCode,
        verificationCodeExpiry: verificationExpiry,
        isEmailVerified: false,
      });

      const savedUser = await newUser.save();

      // Send verification email
      await this.emailService.sendVerificationEmail(
        savedUser.email,
        verificationCode,
      );

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

  // ============ Email Verification Functions ============

  async verifyEmail(email: string, code: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (!user.verificationCode || !user.verificationCodeExpiry) {
      throw new BadRequestException('No verification code found');
    }

    if (new Date() > user.verificationCodeExpiry) {
      throw new BadRequestException('Verification code expired');
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    return true;
  }

  async resendVerificationCode(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verificationCode = this.emailService.generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationCode = verificationCode;
    user.verificationCodeExpiry = verificationExpiry;
    await user.save();

    await this.emailService.sendVerificationEmail(email, verificationCode);
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
        isEmailVerified: user.isEmailVerified,
      },
      token,
    };
  }
}
