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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { 
  CreateReviewDto, 
  UpdateReviewDto, 
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
