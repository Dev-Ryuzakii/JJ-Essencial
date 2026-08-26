import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../../config/supabase.config';
import { CreateReviewDto, CreateReviewWithImagesDto, UpdateReviewDto, UpdateReviewWithImagesDto, ReviewResponseDto, ProductRatingStatsDto } from './dto/review.dto';
import { PaginationDto } from '../../common/dto/common.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class ReviewsService {
  private supabase: SupabaseClient;

  constructor(private readonly uploadService: UploadService) {
    this.supabase = SupabaseConfig.getInstance();
  }

  async createReview(userId: string, createReviewDto: CreateReviewDto): Promise<ReviewResponseDto> {
    const { productId, orderId, rating, title, comment, images } = createReviewDto;

    // Check if product exists
    const { data: product } = await this.supabase
      .from('product')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user has already reviewed this product
    const { data: existingReview } = await this.supabase
      .from('product_review')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('order_id', orderId || null)
      .single();

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    // If orderId is provided, verify the user bought this product
    let isVerified = false;
    if (orderId) {
      const { data: orderItems } = await this.supabase
        .from('order_item')
        .select('orders!inner(*)')
        .eq('orders.id', orderId)
        .eq('orders.userId', userId)
        .in('orders.status', ['PAID', 'COMPLETED'])
        .eq('product_id', productId)
        .single();

      if (orderItems) {
        isVerified = true;
      } else {
        throw new BadRequestException('You can only review products you have purchased');
      }
    }

    const { data: user } = await this.supabase
      .from('profile')
      .select('id, full_name, avatar')
      .eq('id', userId)
      .single();

    const { data: review } = await this.supabase
      .from('product_review')
      .insert([{
        user_id: userId,
        product_id: productId,
        order_id: orderId,
        rating,
        title,
        comment,
        images: images || [],
        is_verified: isVerified,
      }])
      .select('*, user:profile(id, full_name, avatar)')
      .single();

    // Update product rating
    await this.updateProductRating(productId);

    return this.mapToResponseDto(review);
  }

  async createReviewWithImages(userId: string, createReviewDto: CreateReviewWithImagesDto, images?: Express.Multer.File[]): Promise<ReviewResponseDto> {
    const { productId, orderId, rating, title, comment } = createReviewDto;

    // Check if product exists
    const { data: product } = await this.supabase
      .from('product')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user has already reviewed this product
    const { data: existingReview } = await this.supabase
      .from('product_review')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('order_id', orderId || null)
      .single();

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
      const { data: orderItems } = await this.supabase
        .from('order_item')
        .select('orders!inner(*)')
        .eq('orders.id', orderId)
        .eq('orders.userId', userId)
        .in('orders.status', ['PAID', 'COMPLETED'])
        .eq('product_id', productId)
        .single();

      if (orderItems) {
        isVerified = true;
      } else {
        throw new BadRequestException('You can only review products you have purchased');
      }
    }

    const { data: review } = await this.supabase
      .from('product_review')
      .insert([{
        user_id: userId,
        product_id: productId,
        order_id: orderId,
        rating,
        title,
        comment,
        images: imageUrls,
        is_verified: isVerified,
      }])
      .select('*, user:profile(id, full_name, avatar)')
      .single();

    // Update product rating
    await this.updateProductRating(productId);

    return this.mapToResponseDto(review);
  }

  async getProductReviews(
    productId: string,
    paginationDto: PaginationDto,
  ): Promise<{ reviews: ReviewResponseDto[]; total: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const [{ data: reviews, count }, { count: total }] = await Promise.all([
      this.supabase
        .from('product_review')
        .select('*, user:profile(id, full_name, avatar)', { count: 'exact' })
        .eq('product_id', productId)
        .eq('is_visible', true)
        .order('is_verified', { ascending: false })
        .order('created_at', { ascending: false })
        .range(start, end),
      this.supabase
        .from('product_review')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', productId)
        .eq('is_visible', true)
    ]);

    return {
      reviews: (reviews || []).map(review => this.mapToResponseDto(review)),
      total,
    };
  }

  async getUserReviews(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<{ reviews: ReviewResponseDto[]; total: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const [{ data: reviews, count }, { count: total }] = await Promise.all([
      this.supabase
        .from('product_review')
        .select('*, user:profile(id, full_name, avatar)', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(start, end),
      this.supabase
        .from('product_review')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
    ]);

    return {
      reviews: (reviews || []).map(review => this.mapToResponseDto(review)),
      total,
    };
  }

  async updateReview(
    userId: string,
    reviewId: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const { data: existingReview } = await this.supabase
      .from('product_review')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (!existingReview) {
      throw new NotFoundException('Review not found');
    }

    if (existingReview.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const { data: updatedReview } = await this.supabase
      .from('product_review')
      .update({
        rating: updateReviewDto.rating,
        title: updateReviewDto.title,
        comment: updateReviewDto.comment,
        images: updateReviewDto.images,
      })
      .eq('id', reviewId)
      .select('*, user:profile(id, full_name, avatar)')
      .single();

    // Update product rating if rating changed
    if (updateReviewDto.rating !== undefined) {
      await this.updateProductRating(existingReview.productId);
    }

    return this.mapToResponseDto(updatedReview);
  }

  async deleteReview(userId: string, reviewId: string): Promise<void> {
    const { data: existingReview } = await this.supabase
      .from('product_review')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (!existingReview) {
      throw new NotFoundException('Review not found');
    }

    if (existingReview.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.supabase
      .from('product_review')
      .delete()
      .eq('id', reviewId);

    // Update product rating
    await this.updateProductRating(existingReview.productId);
  }

  async getProductRatingStats(productId: string): Promise<ProductRatingStatsDto> {
    const { data: reviews } = await this.supabase
      .from('product_review')
      .select('rating')
      .eq('product_id', productId)
      .eq('is_visible', true);

    if (!reviews) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

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

    await this.supabase
      .from('product')
      .update({
        avg_rating: stats.averageRating,
        review_count: stats.totalReviews,
      })
      .eq('id', productId);
  }

  private mapToResponseDto(review: any): ReviewResponseDto {
    return {
      // The keys are the API's shape, which clients already parse. The values
      // read the row, and a row comes back named the way the column is.
      id: review.id,
      userId: review.user_id,
      productId: review.product_id,
      orderId: review.order_id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images,
      isVerified: review.is_verified,
      isVisible: review.is_visible,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      user: {
        id: review.user.id,
        fullName: review.user.full_name,
        avatar: review.user.avatar,
      },
    };
  }
}
