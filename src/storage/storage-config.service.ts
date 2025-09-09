import { Injectable } from '@nestjs/common';
import { StorageBackend } from './interfaces/storage.interface';
import { LocalStorageService } from './backends/local-storage.service';
import { DatabaseStorageService } from './backends/database-storage.service';
import { S3StorageService } from './backends/s3-storage.service';
import { FtpStorageService } from './backends/ftp-storage.service';

@Injectable()
export class StorageConfigService {
  constructor(
    private readonly localStorageService: LocalStorageService,
    private readonly databaseStorageService: DatabaseStorageService,
    private readonly s3StorageService: S3StorageService,
    private readonly ftpStorageService: FtpStorageService,
  ) {}

  getStorageBackend(): StorageBackend {
    const backendName = process.env.STORAGE_BACKEND || 'local';
    return this.getStorageBackendByName(backendName);
  }

  getStorageBackendByName(name: string): StorageBackend {
    switch (name.toLowerCase()) {
      case 'local':
        return this.localStorageService;
      case 'database':
        return this.databaseStorageService;
      case 's3':
        return this.s3StorageService;
      case 'ftp':
        return this.ftpStorageService;
      default:
        console.warn(`Unknown storage backend: ${name}. Falling back to local storage.`);
        return this.localStorageService; 
    }
  }

  getAvailableStorageBackends(): string[] {
    return ['local', 'database', 's3', 'ftp'];
  }

  getCurrentStorageBackend(): string {
    return process.env.STORAGE_BACKEND || 'local';
  }

  isStorageBackendAvailable(name: string): boolean {
    const availableBackends = this.getAvailableStorageBackends();
    return availableBackends.includes(name.toLowerCase());
  }
}
