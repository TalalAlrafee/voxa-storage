import { Injectable } from '@nestjs/common';
import { StorageBackend } from '../interfaces/storage.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalStorageService implements StorageBackend {
  private readonly storageDir = process.env.LOCAL_STORAGE_PATH || './storage';

  constructor() {
    this.ensureStorageDirectory();
  }

  async store(id: string, data: Buffer): Promise<string> {
    const filePath = path.join(this.storageDir, id);
    
    await fs.promises.writeFile(filePath, data);
    
    return filePath;
  }

  async retrieve(path: string): Promise<Buffer> {
    return await fs.promises.readFile(path);
  }

  async delete(path: string): Promise<void> {
    await fs.promises.unlink(path);
  }

  getName(): string {
    return 'local';
  }

  private ensureStorageDirectory(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }
}
