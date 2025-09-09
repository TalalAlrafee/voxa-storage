import { Injectable } from '@nestjs/common';
import { StorageBackend } from '../interfaces/storage.interface';
import * as crypto from 'crypto';
import * as https from 'https';

@Injectable()
export class S3StorageService implements StorageBackend {
  private readonly bucketName = process.env.S3_BUCKET_NAME || 'voxa-storage';
  private readonly region = process.env.AWS_REGION || 'us-east-1';
  private readonly accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  private readonly secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  async store(id: string, data: Buffer): Promise<string> {
    const key = id; // Simplified - no "files/" prefix
    await this.uploadToS3(key, data);
    return key;
  }

  async retrieve(path: string): Promise<Buffer> {
    return await this.downloadFromS3(path);
  }

  async delete(path: string): Promise<void> {
    await this.deleteFromS3(path);
  }

  getName(): string {
    return 's3';
  }

  private async uploadToS3(key: string, data: Buffer): Promise<string> {
    const host = `${this.bucketName}.s3.${this.region}.amazonaws.com`; // Fixed host format
    const url = `https://${host}/${key}`;
    const method = 'PUT';
    
    const headers = this.createS3Headers(method, key, host, data);
    
    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method,
        headers,
      }, (res) => {
        if (res.statusCode === 200) {
          resolve(key);
        } else {
          reject(new Error(`S3 upload failed: ${res.statusCode} ${res.statusMessage}`));
        }
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  private async downloadFromS3(key: string): Promise<Buffer> {
    const host = `${this.bucketName}.s3.${this.region}.amazonaws.com`;
    const url = `https://${host}/${key}`;
    const method = 'GET';
    
    const headers = this.createS3Headers(method, key, host);
    
    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method,
        headers,
      }, (res) => {
        if (res.statusCode === 200) {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
        } else {
          reject(new Error(`S3 download failed: ${res.statusCode} ${res.statusMessage}`));
        }
      });

      req.on('error', reject);
      req.end();
    });
  }

  private async deleteFromS3(key: string): Promise<void> {
    const host = `${this.bucketName}.s3.${this.region}.amazonaws.com`;
    const url = `https://${host}/${key}`;
    const method = 'DELETE';
    
    const headers = this.createS3Headers(method, key, host);
    
    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method,
        headers,
      }, (res) => {
        if (res.statusCode === 204) {
          resolve();
        } else {
          reject(new Error(`S3 delete failed: ${res.statusCode} ${res.statusMessage}`));
        }
      });

      req.on('error', reject);
      req.end();
    });
  }

  private createS3Headers(method: string, key: string, host: string, body?: Buffer): Record<string, string> {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const dateString = now.toISOString().split('T')[0].replace(/-/g, '');
    
    const headers: Record<string, string> = {
      'Host': host,
      'X-Amz-Date': amzDate,
      'X-Amz-Content-Sha256': this.getContentSha256(body),
    };

    if (body) {
      headers['Content-Type'] = 'application/octet-stream';
      headers['Content-Length'] = body.length.toString();
    }

    // Create AWS Signature V4
    const signature = this.createSignature(method, key, headers, body, dateString, amzDate);
    headers['Authorization'] = signature;

    return headers;
  }

  private createSignature(method: string, key: string, headers: Record<string, string>, body: Buffer | undefined, dateString: string, amzDate: string): string {
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateString}/${this.region}/s3/aws4_request`;
    const signedHeaders = Object.keys(headers).map(k => k.toLowerCase()).sort().join(';');
    
    const canonicalRequest = this.createCanonicalRequest(method, key, headers, signedHeaders, body);
    const stringToSign = this.createStringToSign(algorithm, credentialScope, canonicalRequest, amzDate);
    const signingKey = this.getSigningKey(dateString);
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
    
    return `${algorithm} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }

  private createCanonicalRequest(method: string, key: string, headers: Record<string, string>, signedHeaders: string, body?: Buffer): string {
    const canonicalUri = `/${key}`;
    const canonicalQueryString = '';
    const canonicalHeaders = Object.keys(headers)
      .map(k => k.toLowerCase())
      .sort()
      .map(k => `${k}:${headers[Object.keys(headers).find(h => h.toLowerCase() === k)!]}`)
      .join('\n') + '\n';
    
    const payloadHash = this.getContentSha256(body);
    
    return [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');
  }

  private createStringToSign(algorithm: string, credentialScope: string, canonicalRequest: string, amzDate: string): string {
    const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
    return [
      algorithm,
      amzDate,
      credentialScope,
      hashedCanonicalRequest
    ].join('\n');
  }

  private getSigningKey(dateString: string): Buffer {
    const dateKey = crypto.createHmac('sha256', `AWS4${this.secretAccessKey}`).update(dateString).digest();
    const dateRegionKey = crypto.createHmac('sha256', dateKey).update(this.region).digest();
    const dateRegionServiceKey = crypto.createHmac('sha256', dateRegionKey).update('s3').digest();
    return crypto.createHmac('sha256', dateRegionServiceKey).update('aws4_request').digest();
  }

  private getContentSha256(body?: Buffer): string {
    if (body) {
      return crypto.createHash('sha256').update(body).digest('hex');
    }
    return crypto.createHash('sha256').update('').digest('hex');
  }
}
