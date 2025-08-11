import {
  Controller,
  Get,
  Query,
  Param,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { SearchService, SearchFilters, SearchResult } from './search.service';
import { SuccessResponseDto } from '../../common/dto/common.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('products')
  @ApiOperation({ summary: 'Advanced product search with filters and facets' })
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiQuery({ name: 'category', required: false, description: 'Product category' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price' })
  @ApiQuery({ name: 'inStock', required: false, type: Boolean, description: 'Only in-stock products' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'price', 'createdAt', 'popularity', 'rating'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    type: SuccessResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async searchProducts(@Query() filters: SearchFilters): Promise<SuccessResponseDto<SearchResult<any>>> {
    const results = await this.searchService.searchProducts(filters);
    return new SuccessResponseDto(results, 'Search completed successfully');
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions based on query' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query for suggestions' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of suggestions' })
  @ApiResponse({
    status: 200,
    description: 'Search suggestions retrieved successfully',
    type: SuccessResponseDto,
  })
  async getSearchSuggestions(
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ): Promise<SuccessResponseDto<string[]>> {
    const suggestions = await this.searchService.getSearchSuggestions(query, limit);
    return new SuccessResponseDto(suggestions, 'Suggestions retrieved successfully');
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular search queries' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of popular searches' })
  @ApiResponse({
    status: 200,
    description: 'Popular searches retrieved successfully',
    type: SuccessResponseDto,
  })
  async getPopularSearches(@Query('limit') limit?: number): Promise<SuccessResponseDto<string[]>> {
    const popular = await this.searchService.getPopularSearches(limit);
    return new SuccessResponseDto(popular, 'Popular searches retrieved successfully');
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending products' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of trending products' })
  @ApiResponse({
    status: 200,
    description: 'Trending products retrieved successfully',
    type: SuccessResponseDto,
  })
  async getTrendingProducts(@Query('limit') limit?: number): Promise<SuccessResponseDto<any[]>> {
    const trending = await this.searchService.getTrendingProducts(limit);
    return new SuccessResponseDto(trending, 'Trending products retrieved successfully');
  }

  @Get('similar/:productId')
  @ApiOperation({ summary: 'Get products similar to a specific product' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of similar products' })
  @ApiResponse({
    status: 200,
    description: 'Similar products retrieved successfully',
    type: SuccessResponseDto,
  })
  async getSimilarProducts(
    @Param('productId') productId: string,
    @Query('limit') limit?: number,
  ): Promise<SuccessResponseDto<any[]>> {
    const similar = await this.searchService.searchSimilarProducts(productId, limit);
    return new SuccessResponseDto(similar, 'Similar products retrieved successfully');
  }

  @Get('fulltext')
  @ApiOperation({ summary: 'Full-text search across all product fields' })
  @ApiQuery({ name: 'q', required: true, description: 'Full-text search query' })
  @ApiQuery({ name: 'category', required: false, description: 'Product category filter' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Full-text search results retrieved successfully',
    type: SuccessResponseDto,
  })
  async fullTextSearch(
    @Query('q') query: string,
    @Query() filters: Omit<SearchFilters, 'query'>,
  ): Promise<SuccessResponseDto<SearchResult<any>>> {
    const results = await this.searchService.fullTextSearch(query, filters);
    return new SuccessResponseDto(results, 'Full-text search completed successfully');
  }
}
