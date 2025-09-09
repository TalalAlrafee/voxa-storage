import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blob } from './entities/blob.entity';
import { StorageConfigService } from '../storage/storage-config.service';
import { CreateBlobDto } from './dto/create-blob.dto';

@Injectable()
export class BlobService {
  constructor(
    @InjectRepository(Blob)
    private readonly blobRepository: Repository<Blob>,
    private readonly storageConfigService: StorageConfigService,
  ) {}

  async storeBlob(createBlobDto: CreateBlobDto) {
    const { id, data } = createBlobDto;
    
    // Check if file already exists
    const existingBlob = await this.blobRepository.findOne({ where: { id } });
    if (existingBlob) {
      throw new BadRequestException(`File with ID '${id}' already exists`);
    }
    let buffer: Buffer;
    try {
      // Convert base64 to Buffer
      buffer = Buffer.from(data, 'base64');
    } catch (error) {
      throw new BadRequestException('Invalid base64 data');
    }
    
    // Get the storage backend
    const storageBackend = this.storageConfigService.getStorageBackend();
    
    // Store the file using the selected backend
    const storagePath = await storageBackend.store(id, buffer);
    
    // Save metadata to database
    const blob = new Blob();
    blob.id = id;
    blob.size = buffer.length;
    blob.storageBackend = storageBackend.getName();
    blob.storagePath = storagePath;
    blob.created_at = new Date();

    await this.blobRepository.save(blob);
    
    return {
      id: blob.id,
      data: data,
      size: blob.size.toString(),
      created_at: blob.created_at.toISOString(),
    };
  }

  async getBlob(id: string) {
    const blob = await this.blobRepository.findOne({ where: { id } });
    
    if (!blob) {
      throw new NotFoundException(`Blob with ID ${id} not found`);
    }
    
    try {
      const storageBackend = this.storageConfigService.getStorageBackendByName(blob.storageBackend);
      const data = await storageBackend.retrieve(blob.storagePath);
      
      return {
        id: blob.id,
        data: data.toString('base64'),
        size: blob.size.toString(),
        created_at: blob.created_at.toISOString(),
      };
    } catch (error) {
      // File exists in database but not in storage
      throw new NotFoundException(`File data not found in storage for ID ${id}`);
    }
  }

  async deleteBlob(id: string) {
    // Find blob metadata in database
    const blob = await this.blobRepository.findOne({
      where: { id }
    });
    
    if (!blob) {
      throw new NotFoundException(`Blob with ID ${id} not found`);
    }
    
    // Get the storage backend
    const storageBackend = this.storageConfigService.getStorageBackendByName(blob.storageBackend);
    
    // Delete the file from storage
    await storageBackend.delete(blob.storagePath);
    
    // Delete metadata from database
    await this.blobRepository.delete(id);
    
    return {
      message: `Blob with ID ${id} has been deleted successfully`,
      id: id,
      storageBackend: blob.storageBackend,
    };
  }
}
