import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AddToWishlistDto, WishlistItemResponseDto } from './dto/wishlist.dto';

@Injectable()
export class WishlistService {
  private prisma = new PrismaClient();

  async getUserWishlist(userId: string): Promise<WishlistItemResponseDto[]> {
    const wishlistItems = await this.prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
            stock: true,
            avgRating: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return wishlistItems.map(item => ({
      id: item.id,
      userId: item.userId,
      productId: item.productId,
      createdAt: item.createdAt,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: parseFloat(item.product.price.toString()),
        images: item.product.images,
        stock: item.product.stock,
        avgRating: item.product.avgRating ? parseFloat(item.product.avgRating.toString()) : 0,
        isActive: item.product.isActive,
      },
    }));
  }

  async addToWishlist(userId: string, addToWishlistDto: AddToWishlistDto): Promise<WishlistItemResponseDto> {
    const { productId } = addToWishlistDto;

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if already in wishlist
    const existingItem = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingItem) {
      throw new ConflictException('Product already in wishlist');
    }

    const wishlistItem = await this.prisma.wishlistItem.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
            stock: true,
            avgRating: true,
            isActive: true,
          },
        },
      },
    });

    return {
      id: wishlistItem.id,
      userId: wishlistItem.userId,
      productId: wishlistItem.productId,
      createdAt: wishlistItem.createdAt,
      product: {
        id: wishlistItem.product.id,
        name: wishlistItem.product.name,
        price: parseFloat(wishlistItem.product.price.toString()),
        images: wishlistItem.product.images,
        stock: wishlistItem.product.stock,
        avgRating: wishlistItem.product.avgRating ? parseFloat(wishlistItem.product.avgRating.toString()) : 0,
        isActive: wishlistItem.product.isActive,
      },
    };
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    const wishlistItem = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!wishlistItem) {
      throw new NotFoundException('Product not found in wishlist');
    }

    await this.prisma.wishlistItem.delete({
      where: { id: wishlistItem.id },
    });
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const wishlistItem = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return !!wishlistItem;
  }

  async getWishlistCount(userId: string): Promise<number> {
    return this.prisma.wishlistItem.count({
      where: { userId },
    });
  }
}
