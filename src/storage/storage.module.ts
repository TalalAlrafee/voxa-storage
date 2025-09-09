import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlobData } from './entities/blob-data.entity';
import { LocalStorageService } from './backends/local-storage.service';
import { DatabaseStorageService } from './backends/database-storage.service';
import { S3StorageService } from './backends/s3-storage.service';
import { FtpStorageService } from './backends/ftp-storage.service';
import { StorageConfigService } from './storage-config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlobData]),
  ],
  providers: [
    LocalStorageService,
    DatabaseStorageService,
    S3StorageService,
    FtpStorageService,
    StorageConfigService,
  ],
  exports: [
    LocalStorageService,
    DatabaseStorageService,
    S3StorageService,
    FtpStorageService,
    StorageConfigService,
  ],
})
export class StorageModule {}
