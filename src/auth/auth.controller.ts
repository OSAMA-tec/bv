import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthResponse } from './interfaces/auth-response.interface';
import { FirebaseAuthDto } from './dto/firebase-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body('email') email: string,
    @Body('code') code: string,
  ): Promise<{ success: boolean }> {
    const result = await this.authService.verifyEmail(email, code);
    return { success: result };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    await this.authService.resendVerificationCode(email);
    return { message: 'Verification code sent successfully' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  getProfile(@CurrentUser() user) {
    return user;
  }

  @Get('admin-dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdminDashboard(@CurrentUser() user) {
    return {
      message: 'Welcome to admin dashboard',
      user,
    };
  }

  @Post('firebase')
  async firebaseAuth(@Body() firebaseAuthDto: FirebaseAuthDto) {
    return this.authService.validateFirebaseToken(firebaseAuthDto);
  }
}
