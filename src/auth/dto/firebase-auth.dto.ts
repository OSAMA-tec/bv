import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class FirebaseAuthDto {
  @IsNotEmpty()
  @IsString()
  idToken: string;

  @IsNotEmpty()
  @IsEnum(['google', 'facebook'])
  provider: 'google' | 'facebook';
}
