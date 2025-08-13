import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { 
  CreateReviewDto, 
  CreateReviewWithImagesDto,
  UpdateReviewDto,
  UpdateReviewWithImagesDto,
  ReviewResponseDto, 
  ProductRatingStatsDto 
} from './dto/review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserId } from '../../common/decorators/user.decorator';
import { SuccessResponseDto, PaginatedResponseDto, PaginationDto } from '../../common/dto/common.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a product review' })
  @ApiResponse({
    status: 201,
    description: 'Review created successfully',
    type: ReviewResponseDto,
  })
  async createReview(
    @UserId() userId: string,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<SuccessResponseDto<ReviewResponseDto>> {
    const review = await this.reviewsService.createReview(userId, createReviewDto);
    return new SuccessResponseDto(review, 'Review created successfully');
  }

  @Post('with-images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5)) // Max 5 images
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a product review with image uploads' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Review data with image files',
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'string', example: 'product-uuid' },
        orderId: { type: 'string', example: 'order-uuid' },
        rating: { type: 'number', example: 5, minimum: 1, maximum: 5 },
        title: { type: 'string', example: 'Great product!' },
        comment: { type: 'string', example: 'I really love this product!' },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Review created successfully with images',
    type: ReviewResponseDto,
  })
  async createReviewWithImages(
    @UserId() userId: string,
    @Body() createReviewDto: CreateReviewWithImagesDto,
    @UploadedFiles() images?: Express.Multer.File[]
  ): Promise<SuccessResponseDto<ReviewResponseDto>> {
    const review = await this.reviewsService.createReviewWithImages(userId, createReviewDto, images);
    return new SuccessResponseDto(review, 'Review created successfully');
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get reviews for a product' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Product reviews retrieved successfully',
    type: PaginatedResponseDto<ReviewResponseDto>,
  })
  async getProductReviews(
    @Param('productId') productId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ReviewResponseDto>> {
    const { reviews, total } = await this.reviewsService.getProductReviews(productId, paginationDto);
    const { page = 1, limit = 10 } = paginationDto;
    
    return new PaginatedResponseDto(
      reviews,
      total,
      page,
      limit,
      'Product reviews retrieved successfully',
    );
  }

  @Get('product/:productId/stats')
  @ApiOperation({ summary: 'Get product rating statistics' })
  @ApiResponse({
    status: 200,
    description: 'Product rating stats retrieved successfully',
    type: ProductRatingStatsDto,
  })
  async getProductRatingStats(
    @Param('productId') productId: string,
  ): Promise<SuccessResponseDto<ProductRatingStatsDto>> {
    const stats = await this.reviewsService.getProductRatingStats(productId);
    return new SuccessResponseDto(stats, 'Product rating stats retrieved successfully');
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user reviews' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'User reviews retrieved successfully',
    type: PaginatedResponseDto<ReviewResponseDto>,
  })
  async getUserReviews(
    @UserId() userId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ReviewResponseDto>> {
    const { reviews, total } = await this.reviewsService.getUserReviews(userId, paginationDto);
    const { page = 1, limit = 10 } = paginationDto;
    
    return new PaginatedResponseDto(
      reviews,
      total,
      page,
      limit,
      'User reviews retrieved successfully',
    );
  }

  @Put(':reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review' })
  @ApiResponse({
    status: 200,
    description: 'Review updated successfully',
    type: ReviewResponseDto,
  })
  async updateReview(
    @UserId() userId: string,
    @Param('reviewId') reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<SuccessResponseDto<ReviewResponseDto>> {
    const review = await this.reviewsService.updateReview(userId, reviewId, updateReviewDto);
    return new SuccessResponseDto(review, 'Review updated successfully');
  }

  @Delete(':reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({ status: 204, description: 'Review deleted successfully' })
  async deleteReview(
    @UserId() userId: string,
    @Param('reviewId') reviewId: string,
  ): Promise<void> {
    await this.reviewsService.deleteReview(userId, reviewId);
  }
}
