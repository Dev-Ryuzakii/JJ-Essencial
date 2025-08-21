import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AddToWishlistDto, WishlistItemResponseDto } from './dto/wishlist.dto';
import { SupabaseConfig } from '../../config/supabase.config';

@Injectable()
export class WishlistService {
  private supabase;

  constructor(private configService: ConfigService) {
    this.supabase = SupabaseConfig.getInstance(this.configService);
  }

  async getUserWishlist(userId: string): Promise<WishlistItemResponseDto[]> {
    const { data: wishlistItems, error } = await this.supabase
      .from('wishlist_item')
      .select(`
        *,
        product:product_id (
          id,
          name,
          price,
          images,
          stock,
          avg_rating,
          is_active
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

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
    const { data: product, error: productError } = await this.supabase
      .from('product')
      .select()
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      throw new NotFoundException('Product not found');
    }

    // Check if already in wishlist
    const { data: existingItem, error: existingError } = await this.supabase
      .from('wishlist_item')
      .select()
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existingItem) {
      throw new ConflictException('Product already in wishlist');
    }

    // Create wishlist item
    const { data: wishlistItem, error: createError } = await this.supabase
      .from('wishlist_item')
      .insert([{ user_id: userId, product_id: productId }])
      .select(`
        *,
        product:product_id (
          id,
          name,
          price,
          images,
          stock,
          avg_rating,
          is_active
        )
      `)
      .single();

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
    const { data: wishlistItem, error: findError } = await this.supabase
      .from('wishlist_item')
      .select()
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (!wishlistItem) {
      throw new NotFoundException('Product not found in wishlist');
    }

    const { error: deleteError } = await this.supabase
      .from('wishlist_item')
      .delete()
      .eq('id', wishlistItem.id);

    if (deleteError) throw new Error(deleteError.message);
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const { data: wishlistItem, error } = await this.supabase
      .from('wishlist_item')
      .select()
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    return !!wishlistItem;
  }

  async getWishlistCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('wishlist_item')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return count || 0;
  }
}
