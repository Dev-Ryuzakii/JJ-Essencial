import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '../../config/database.config';

export interface SearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
  tags?: string[];
  sortBy?: 'name' | 'price' | 'createdAt' | 'popularity' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  facets?: SearchFacets;
}

export interface SearchFacets {
  categories: { name: string; count: number }[];
  priceRanges: { range: string; count: number }[];
  brands: { name: string; count: number }[];
  ratings: { rating: number; count: number }[];
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private prisma: PrismaClient;

  constructor(private configService: ConfigService) {
    this.prisma = DatabaseConfig.getInstance(configService);
  }

  async searchProducts(filters: SearchFilters): Promise<SearchResult<any>> {
    const {
      query,
      category,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    // Text search across multiple fields
    if (query) {
      where.OR = [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          category: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Category filter
    if (category) {
      where.category = {
        equals: category,
        mode: 'insensitive',
      };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Stock filter
    if (inStock !== undefined) {
      if (inStock) {
        where.stock = {
          gt: 0,
        };
      } else {
        where.stock = {
          lte: 0,
        };
      }
    }

    // Build order by clause
    const orderBy: any = {};
    switch (sortBy) {
      case 'name':
        orderBy.name = sortOrder;
        break;
      case 'price':
        orderBy.price = sortOrder;
        break;
      case 'createdAt':
        orderBy.createdAt = sortOrder;
        break;
      case 'popularity':
        // Could be based on order count or views
        orderBy.createdAt = sortOrder; // Fallback for now
        break;
      case 'rating':
        // Could be based on average rating
        orderBy.createdAt = sortOrder; // Fallback for now
        break;
      default:
        orderBy.createdAt = sortOrder;
    }

    try {
      // Get total count
      const total = await this.prisma.product.count({ where });

      // Get products
      const products = await this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          images: true,
          category: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Format response
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      // Get search facets for advanced filtering
      const facets = await this.getSearchFacets(filters);

      return {
        items: products.map(product => ({
          ...product,
          price: parseFloat(product.price.toString()),
        })),
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
        facets,
      };
    } catch (error) {
      this.logger.error('Search error:', error);
      throw error;
    }
  }

  async getSearchSuggestions(query: string, limit: number = 10): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      // Get product names that match the query
      const products = await this.prisma.product.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              category: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
          isActive: true,
        },
        select: {
          name: true,
          category: true,
        },
        take: limit,
      });

      // Extract unique suggestions
      const suggestions = new Set<string>();
      
      products.forEach(product => {
        // Add product names
        if (product.name.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(product.name);
        }
        
        // Add categories
        if (product.category && product.category.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(product.category);
        }
      });

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      this.logger.error('Suggestions error:', error);
      return [];
    }
  }

  async getPopularSearches(limit: number = 10): Promise<string[]> {
    // For now, return static popular searches
    // In a real app, you'd track search queries and return the most popular ones
    return [
      'smartphone',
      'laptop',
      'headphones',
      'camera',
      'watch',
      'shoes',
      'clothing',
      'accessories',
      'electronics',
      'home decor',
    ].slice(0, limit);
  }

  async getTrendingProducts(limit: number = 10): Promise<any[]> {
    try {
      // Get products ordered by creation date (newest first) as a proxy for trending
      // In a real app, you might track views, orders, etc.
      const products = await this.prisma.product.findMany({
        where: {
          isActive: true,
          stock: {
            gt: 0,
          },
        },
        orderBy: [
          { createdAt: 'desc' },
          { updatedAt: 'desc' },
        ],
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          images: true,
          category: true,
          createdAt: true,
        },
      });

      return products.map(product => ({
        ...product,
        price: parseFloat(product.price.toString()),
      }));
    } catch (error) {
      this.logger.error('Trending products error:', error);
      return [];
    }
  }

  private async getSearchFacets(filters: SearchFilters): Promise<SearchFacets> {
    try {
      // Get category facets
      const categories = await this.prisma.product.groupBy({
        by: ['category'],
        where: {
          isActive: true,
          ...(filters.query && {
            OR: [
              { name: { contains: filters.query, mode: 'insensitive' } },
              { description: { contains: filters.query, mode: 'insensitive' } },
            ],
          }),
        },
        _count: {
          category: true,
        },
        orderBy: {
          _count: {
            category: 'desc',
          },
        },
      });

      // Get price range facets
      const priceRanges = await this.getPriceRangeFacets(filters);

      return {
        categories: categories
          .filter(cat => cat.category)
          .map(cat => ({
            name: cat.category!,
            count: cat._count.category,
          })),
        priceRanges,
        brands: [], // Could be implemented if you have brand field
        ratings: [], // Could be implemented if you have rating system
      };
    } catch (error) {
      this.logger.error('Facets error:', error);
      return {
        categories: [],
        priceRanges: [],
        brands: [],
        ratings: [],
      };
    }
  }

  private async getPriceRangeFacets(filters: SearchFilters): Promise<{ range: string; count: number }[]> {
    const ranges = [
      { label: '$0 - $50', min: 0, max: 50 },
      { label: '$50 - $100', min: 50, max: 100 },
      { label: '$100 - $200', min: 100, max: 200 },
      { label: '$200 - $500', min: 200, max: 500 },
      { label: '$500+', min: 500, max: null },
    ];

    const facets = [];

    for (const range of ranges) {
      const where: any = {
        isActive: true,
        ...(filters.query && {
          OR: [
            { name: { contains: filters.query, mode: 'insensitive' } },
            { description: { contains: filters.query, mode: 'insensitive' } },
          ],
        }),
        price: {
          gte: range.min,
          ...(range.max && { lte: range.max }),
        },
      };

      const count = await this.prisma.product.count({ where });

      if (count > 0) {
        facets.push({
          range: range.label,
          count,
        });
      }
    }

    return facets;
  }

  // Full-text search for more advanced search capabilities
  async fullTextSearch(query: string, filters: Omit<SearchFilters, 'query'>): Promise<SearchResult<any>> {
    // This would implement more sophisticated search using PostgreSQL full-text search
    // For now, fall back to regular search
    return this.searchProducts({ ...filters, query });
  }

  async searchSimilarProducts(productId: string, limit: number = 5): Promise<any[]> {
    try {
      // Get the original product
      const originalProduct = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { category: true, price: true },
      });

      if (!originalProduct) {
        return [];
      }

      // Find similar products in the same category with similar price range
      const priceRange = parseFloat(originalProduct.price.toString()) * 0.3; // 30% price range

      const similarProducts = await this.prisma.product.findMany({
        where: {
          id: { not: productId },
          isActive: true,
          category: originalProduct.category,
          price: {
            gte: parseFloat(originalProduct.price.toString()) - priceRange,
            lte: parseFloat(originalProduct.price.toString()) + priceRange,
          },
        },
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          images: true,
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return similarProducts.map(product => ({
        ...product,
        price: parseFloat(product.price.toString()),
      }));
    } catch (error) {
      this.logger.error('Similar products error:', error);
      return [];
    }
  }
}
