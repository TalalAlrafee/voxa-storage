import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { BlobsModule } from './blobs/blobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule, 
    AuthModule, 
    BlobsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}