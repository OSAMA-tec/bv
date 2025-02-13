import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseProvider } from './firebase.provider';

@Module({
  imports: [ConfigModule],
  providers: [FirebaseProvider],
  exports: [FirebaseProvider],
})
export class FirebaseModule {}
