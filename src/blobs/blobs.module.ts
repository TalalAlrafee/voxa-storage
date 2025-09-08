import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blob } from './entities/blob.entity';
import { BlobService } from './blob.service';
import { BlobController } from './blob.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Blob]),
    StorageModule,
  ],
  providers: [BlobService],
  controllers: [BlobController],
  exports: [BlobService],
})
export class BlobsModule {}
