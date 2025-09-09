import { Controller, Post, Get, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { BlobService } from './blob.service';
import { CreateBlobDto } from './dto/create-blob.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('File Storage')
@ApiBearerAuth()
@Controller('v1/blobs')
@UseGuards(JwtAuthGuard)
export class BlobController {
  constructor(private readonly blobService: BlobService) {}

  @Post()
  async createBlob(@Body() createBlobDto: CreateBlobDto) {
    return await this.blobService.storeBlob(createBlobDto);
  }

  @Get(':id')
  async getBlob(@Param('id') id: string) {
    return await this.blobService.getBlob(id);
  }
  
  @Delete(':id')
  async deleteBlob(@Param('id') id: string) {
    return await this.blobService.deleteBlob(id);
  }
}
