import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Delete,
  Param,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UploadService, UploadResult } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminOnly } from '../../common/decorators/roles.decorator';
import { SuccessResponseDto } from '../../common/dto/common.dto';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a single image (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file to upload',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: SuccessResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<SuccessResponseDto<UploadResult>> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const result = await this.uploadService.uploadToSupabase(file);
    return new SuccessResponseDto(result, 'Image uploaded successfully');
  }

  @Post('images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 files
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload multiple images (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Multiple image files to upload',
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Images uploaded successfully',
    type: SuccessResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<SuccessResponseDto<UploadResult[]>> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No image files provided');
    }

    const results = await this.uploadService.uploadMultipleToSupabase(files);
    return new SuccessResponseDto(results, 'Images uploaded successfully');
  }

  @Post('product-images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload product image with multiple sizes (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Product image to upload',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Product image uploaded with multiple sizes',
    type: SuccessResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<SuccessResponseDto<Record<string, UploadResult>>> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const results = await this.uploadService.generateImageSizes(file);
    return new SuccessResponseDto(results, 'Product image uploaded with multiple sizes');
  }

  @Delete(':bucket/:filename')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an uploaded file (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    type: SuccessResponseDto,
  })
  async deleteFile(
    @Param('bucket') bucket: string,
    @Param('filename') filename: string,
  ): Promise<SuccessResponseDto<null>> {
    await this.uploadService.deleteFromSupabase(filename, bucket);
    return new SuccessResponseDto(null, 'File deleted successfully');
  }
}
