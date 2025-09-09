import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageBackend } from '../interfaces/storage.interface';
import { BlobData } from '../entities/blob-data.entity';

@Injectable()
export class DatabaseStorageService implements StorageBackend {
  constructor(
    @InjectRepository(BlobData)
    private readonly blobDataRepository: Repository<BlobData>,
  ) {}

  async store(id: string, data: Buffer): Promise<string> {
    const blobData = new BlobData();
    blobData.id = id;
    blobData.data = data;

    await this.blobDataRepository.save(blobData);

    return id; // Return the ID as the storage path
  }

  async retrieve(path: string): Promise<Buffer> {
    const blobData = await this.blobDataRepository.findOne({
      where: { id: path }
    });

    if (!blobData) {
      throw new Error(`Blob data not found for ID: ${path}`);
    }

    return blobData.data;
  }

  async delete(path: string): Promise<void> {
    await this.blobDataRepository.delete(path);
  }

  getName(): string {
    return 'database';
  }
}
