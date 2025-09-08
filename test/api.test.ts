import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Voxa API - Postman Style Tests', () => {
  let app: INestApplication;
  let authToken: string;
  const testFiles: string[] = []; // Track test files

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Add validation pipe like in main.ts
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    
    await app.init();
  });

  afterAll(async () => {
    // Get fresh token for cleanup
    try {
      const tokenResponse = await request(app.getHttpServer())
        .post('/auth/token');
      const cleanupToken = tokenResponse.body.access_token;
      
      // Clean up all test files
      for (const fileId of testFiles) {
        try {
          await request(app.getHttpServer())
            .delete(`/v1/blobs/${fileId}`)
            .set('Authorization', `Bearer ${cleanupToken}`);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
    
    await app.close();
  });

  beforeEach(async () => {
    // Get fresh token for each test
    const response = await request(app.getHttpServer())
      .post('/auth/token');
    authToken = response.body.access_token;
  });

  // Test 1: Get Auth Token
  it('1. Get Auth Token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/token')
      .expect(201);

    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('token_type', 'Bearer');
    
    console.log('✅ Got auth token');
  });

  // Test 2: Upload a File
  it('2. Upload File', async () => {
    const fileData = {
      id: `test-file-${Date.now()}`, // ← Unique ID
      data: 'SGVsbG8gV29ybGQh'
    };
    testFiles.push(fileData.id); // Track for cleanup

    const response = await request(app.getHttpServer())
      .post('/v1/blobs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(fileData)
      .expect(201);

    expect(response.body.id).toBe(fileData.id);
    expect(response.body.data).toBe(fileData.data);
    expect(response.body.size).toBeDefined();
    expect(response.body.created_at).toBeDefined();
    
    console.log('✅ File uploaded successfully');
  });

  // Test 3: Download a File (independent test)
  it('3. Download File', async () => {
    const fileData = {
      id: `download-test-${Date.now()}`, // ← Unique ID
      data: 'RG93bmxvYWQgVGVzdA==' // "Download Test" in base64
    };
    testFiles.push(fileData.id);

    // First upload
    await request(app.getHttpServer())
      .post('/v1/blobs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(fileData)
      .expect(201);

    // Then download
    const response = await request(app.getHttpServer())
      .get(`/v1/blobs/${fileData.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.id).toBe(fileData.id);
    expect(response.body.data).toBe(fileData.data);
    expect(response.body.size).toBe(Buffer.from(fileData.data, 'base64').length.toString());
    
    console.log('✅ File downloaded successfully');
  });

  // Test 4: Try to Download Non-existent File
  it('4. Try to Download Non-existent File', async () => {
    await request(app.getHttpServer())
      .get('/v1/blobs/non-existent-file')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
    
    console.log('✅ Correctly returned 404 for non-existent file');
  });

  // Test 5: Try to Upload Invalid Data
  it('5. Try to Upload Invalid Base64', async () => {
    const invalidData = {
      id: `invalid-test-${Date.now()}`,
      data: 'this-is-not-base64!'
    };

    await request(app.getHttpServer())
      .post('/v1/blobs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidData)
      .expect(400);
    
    console.log('✅ Correctly rejected invalid base64 data');
  });

  // Test 6: Try to Access Without Token
  it('6. Try to Access Without Token', async () => {
    await request(app.getHttpServer())
      .post('/v1/blobs')
      .send({
        id: `no-auth-test-${Date.now()}`,
        data: 'SGVsbG8gV29ybGQh'
      })
      .expect(401);
    
    console.log('✅ Correctly rejected request without auth token');
  });

  // Test 7: Delete File (independent test)
  it('7. Delete File', async () => {
    const fileData = {
      id: `delete-test-${Date.now()}`, // ← Unique ID
      data: 'RGVsZXRlIFRlc3Q=' // "Delete Test" in base64
    };
    testFiles.push(fileData.id);

    // First upload
    await request(app.getHttpServer())
      .post('/v1/blobs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(fileData)
      .expect(201);

    // Then delete
    const response = await request(app.getHttpServer())
      .delete(`/v1/blobs/${fileData.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.id).toBe(fileData.id);
    expect(response.body.message).toContain('deleted successfully');
    
    console.log('✅ File deleted successfully');
  });

  // Test 8: Try to Download Deleted File
  it('8. Try to Download Deleted File', async () => {
    const fileData = {
      id: `deleted-test-${Date.now()}`, // ← Unique ID
      data: 'RGVsZXRlZCBUZXN0' // "Deleted Test" in base64
    };

    // Upload
    await request(app.getHttpServer())
      .post('/v1/blobs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(fileData)
      .expect(201);

    // Delete
    await request(app.getHttpServer())
      .delete(`/v1/blobs/${fileData.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Try to download deleted file
    await request(app.getHttpServer())
      .get(`/v1/blobs/${fileData.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
    
    console.log('✅ Correctly returned 404 for deleted file');
  });
});
