import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateReviewDto, CreateReviewWithImagesDto, UpdateReviewDto, UpdateReviewWithImagesDto, ReviewResponseDto, ProductRatingStatsDto } from './dto/review.dto';
import { PaginationDto } from '../../common/dto/common.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class ReviewsService {
  private prisma = new PrismaClient();

  constructor(private readonly uploadService: UploadService) {}

  async createReview(userId: string, createReviewDto: CreateReviewDto): Promise<ReviewResponseDto> {
    const { productId, orderId, rating, title, comment, images } = createReviewDto;

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user has already reviewed this product
    const existingReview = await this.prisma.productReview.findUnique({
      where: {
        userId_productId_orderId: {
          userId,
          productId,
          orderId: orderId || null,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    // If orderId is provided, verify the user bought this product
    let isVerified = false;
    if (orderId) {
      const order = await this.prisma.orders.findFirst({
        where: {
          id: orderId,
          userId,
          status: { in: ['PAID', 'COMPLETED'] },
          orderItems: {
            some: { productId },
          },
        },
      });

      if (order) {
        isVerified = true;
      } else {
        throw new BadRequestException('You can only review products you have purchased');
      }
    }

    const review = await this.prisma.productReview.create({
      data: {
        userId,
        productId,
        orderId,
        rating,
        title,
        comment,
        images: images || [],
        isVerified,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    // Update product rating
    await this.updateProductRating(productId);

    return this.mapToResponseDto(review);
  }

  async createReviewWithImages(userId: string, createReviewDto: CreateReviewWithImagesDto, images?: Express.Multer.File[]): Promise<ReviewResponseDto> {
    const { productId, orderId, rating, title, comment } = createReviewDto;

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user has already reviewed this product
    const existingReview = await this.prisma.productReview.findUnique({
      where: {
        userId_productId_orderId: {
          userId,
          productId,
          orderId: orderId || null,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    // Upload images if provided
    let imageUrls: string[] = [];
    if (images && images.length > 0) {
      const uploadResults = await this.uploadService.uploadMultipleToSupabase(images, 'reviews');
      imageUrls = uploadResults.map(result => result.url);
    }

    // If orderId is provided, verify the user bought this product
    let isVerified = false;
    if (orderId) {
      const order = await this.prisma.orders.findFirst({
        where: {
          id: orderId,
          userId,
          status: { in: ['PAID', 'COMPLETED'] },
          orderItems: {
            some: { productId },
          },
        },
      });

      if (order) {
        isVerified = true;
      } else {
        throw new BadRequestException('You can only review products you have purchased');
      }
    }

    const review = await this.prisma.productReview.create({
      data: {
        userId,
        productId,
        orderId,
        rating,
        title,
        comment,
        images: imageUrls,
        isVerified,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    // Update product rating
    await this.updateProductRating(productId);

    return this.mapToResponseDto(review);
  }

  async getProductReviews(
    productId: string,
    paginationDto: PaginationDto,
  ): Promise<{ reviews: ReviewResponseDto[]; total: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where: {
          productId,
          isVisible: true,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
            },
          },
        },
        orderBy: [
          { isVerified: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.productReview.count({
        where: {
          productId,
          isVisible: true,
        },
      }),
    ]);

    return {
      reviews: reviews.map(review => this.mapToResponseDto(review)),
      total,
    };
  }

  async getUserReviews(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<{ reviews: ReviewResponseDto[]; total: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.productReview.count({
        where: { userId },
      }),
    ]);

    return {
      reviews: reviews.map(review => this.mapToResponseDto(review)),
      total,
    };
  }

  async updateReview(
    userId: string,
    reviewId: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const existingReview = await this.prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      throw new NotFoundException('Review not found');
    }

    if (existingReview.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const updatedReview = await this.prisma.productReview.update({
      where: { id: reviewId },
      data: {
        rating: updateReviewDto.rating,
        title: updateReviewDto.title,
        comment: updateReviewDto.comment,
        images: updateReviewDto.images,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    // Update product rating if rating changed
    if (updateReviewDto.rating !== undefined) {
      await this.updateProductRating(existingReview.productId);
    }

    return this.mapToResponseDto(updatedReview);
  }

  async deleteReview(userId: string, reviewId: string): Promise<void> {
    const existingReview = await this.prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      throw new NotFoundException('Review not found');
    }

    if (existingReview.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.productReview.delete({
      where: { id: reviewId },
    });

    // Update product rating
    await this.updateProductRating(existingReview.productId);
  }

  async getProductRatingStats(productId: string): Promise<ProductRatingStatsDto> {
    const reviews = await this.prisma.productReview.findMany({
      where: {
        productId,
        isVisible: true,
      },
      select: { rating: true },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    return {
      averageRating: Math.round(averageRating * 100) / 100,
      totalReviews,
      ratingDistribution,
    };
  }

  private async updateProductRating(productId: string): Promise<void> {
    const stats = await this.getProductRatingStats(productId);

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: stats.averageRating,
        reviewCount: stats.totalReviews,
      },
    });
  }

  private mapToResponseDto(review: any): ReviewResponseDto {
    return {
      id: review.id,
      userId: review.userId,
      productId: review.productId,
      orderId: review.orderId,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images,
      isVerified: review.isVerified,
      isVisible: review.isVisible,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        id: review.user.id,
        fullName: review.user.fullName,
        avatar: review.user.avatar,
      },
    };
  }
}
