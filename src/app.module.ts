import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SettingsModule } from './settings/settings.module';
import { PropertiesModule } from './properties/properties.module';
import { NftsModule } from './nfts/nfts.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import configuration from './config/configuration';
import { User, UserSchema } from './models/user.model';
import { Property, PropertySchema } from './models/property.model';
import { NFT, NFTSchema } from './models/nft.model';
import { Transaction, TransactionSchema } from './models/transaction.model';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),

    // Models
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Property.name, schema: PropertySchema },
      { name: NFT.name, schema: NFTSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),

    // Feature Modules
    AuthModule,
    UsersModule,
    SettingsModule,
    PropertiesModule,
    NftsModule,
    BlockchainModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
