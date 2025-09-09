import { Injectable } from '@nestjs/common';
import { StorageBackend } from '../interfaces/storage.interface';
import { FTPResponse, Client } from 'basic-ftp';

@Injectable()
export class FtpStorageService implements StorageBackend {
  private readonly host = process.env.FTP_HOST ;
  private readonly port = parseInt(process.env.FTP_PORT);
  private readonly username = process.env.FTP_USERNAME ;
  private readonly password = process.env.FTP_PASSWORD ;
  private readonly basePath = process.env.FTP_BASE_PATH ;

  async store(id: string, data: Buffer): Promise<string> {
    const remotePath = `${this.basePath}/${id}`;
    await this.uploadToFtp(remotePath, data);
    return remotePath;
  }

  async retrieve(path: string): Promise<Buffer> {
    return await this.downloadFromFtp(path);
  }

  async delete(path: string): Promise<void> {
    await this.deleteFromFtp(path);
  }

  getName(): string {
    return 'ftp';
  }

  private async uploadToFtp(remotePath: string, data: Buffer): Promise<void> {
    const client = new Client();
    
    try {
      await client.access({
        host: this.host,
        port: this.port,
        user: this.username,
        password: this.password,
        secure: false, 
      });
      
      await client.ensureDir(this.basePath);
      
      const { Readable } = require('stream');
      const readable = Readable.from(data);
      await client.uploadFrom(readable, remotePath);
      
    } finally {
      client.close();
    }
  }

  private async downloadFromFtp(remotePath: string): Promise<Buffer> {
    const client = new Client();
    
    try {
      await client.access({
        host: this.host,
        port: this.port,
        user: this.username,
        password: this.password,
        secure: false,
      });
      
      const chunks: Buffer[] = [];
      const { PassThrough } = require('stream');
      const stream = new PassThrough();
      
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      await client.downloadTo(stream, remotePath);
      
      return Buffer.concat(chunks);
      
    } finally {
      client.close();
    }
  }

  private async deleteFromFtp(remotePath: string): Promise<void> {
    const client = new Client();
    
    try {
      await client.access({
        host: this.host,
        port: this.port,
        user: this.username,
        password: this.password,
        secure: false, 
      });
      
     
      await client.remove(remotePath);
      
    } finally {
      client.close();
    }
  }
}
