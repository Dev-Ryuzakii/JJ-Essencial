import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto, WishlistItemResponseDto } from './dto/wishlist.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserId } from '../../common/decorators/user.decorator';
import { SuccessResponseDto } from '../../common/dto/common.dto';

@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get user wishlist' })
  @ApiResponse({
    status: 200,
    description: 'Wishlist retrieved successfully',
    type: [WishlistItemResponseDto],
  })
  async getUserWishlist(@UserId() userId: string): Promise<SuccessResponseDto<WishlistItemResponseDto[]>> {
    const wishlist = await this.wishlistService.getUserWishlist(userId);
    return new SuccessResponseDto(wishlist, 'Wishlist retrieved successfully');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add product to wishlist' })
  @ApiResponse({
    status: 201,
    description: 'Product added to wishlist successfully',
    type: WishlistItemResponseDto,
  })
  async addToWishlist(
    @UserId() userId: string,
    @Body() addToWishlistDto: AddToWishlistDto,
  ): Promise<SuccessResponseDto<WishlistItemResponseDto>> {
    const wishlistItem = await this.wishlistService.addToWishlist(userId, addToWishlistDto);
    return new SuccessResponseDto(wishlistItem, 'Product added to wishlist successfully');
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove product from wishlist' })
  @ApiResponse({ status: 204, description: 'Product removed from wishlist successfully' })
  async removeFromWishlist(
    @UserId() userId: string,
    @Param('productId') productId: string,
  ): Promise<void> {
    await this.wishlistService.removeFromWishlist(userId, productId);
  }

  @Get('check/:productId')
  @ApiOperation({ summary: 'Check if product is in wishlist' })
  @ApiResponse({ status: 200, description: 'Wishlist status checked successfully' })
  async isInWishlist(
    @UserId() userId: string,
    @Param('productId') productId: string,
  ): Promise<SuccessResponseDto<{ inWishlist: boolean }>> {
    const inWishlist = await this.wishlistService.isInWishlist(userId, productId);
    return new SuccessResponseDto({ inWishlist }, 'Wishlist status checked successfully');
  }

  @Get('count')
  @ApiOperation({ summary: 'Get wishlist items count' })
  @ApiResponse({ status: 200, description: 'Wishlist count retrieved successfully' })
  async getWishlistCount(
    @UserId() userId: string,
  ): Promise<SuccessResponseDto<{ count: number }>> {
    const count = await this.wishlistService.getWishlistCount(userId);
    return new SuccessResponseDto({ count }, 'Wishlist count retrieved successfully');
  }
}
