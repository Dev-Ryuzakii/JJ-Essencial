import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../../config/supabase.config';

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
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = SupabaseConfig.getInstance(this.configService);
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
      let query = this.supabase
        .from('product')
        .select('*', { count: 'exact' });

      // Apply filters
      if (where.OR) {
        query = query.or(
          where.OR.map(condition => {
            const field = Object.keys(condition)[0];
            return `${field}.ilike.%${condition[field].contains}%`;
          }).join(',')
        );
      }

      if (category) {
        query = query.ilike('category', category);
      }

      if (where.price) {
        if (where.price.gte) query = query.gte('price', where.price.gte);
        if (where.price.lte) query = query.lte('price', where.price.lte);
      }

      if (inStock !== undefined) {
        query = query.gte('stock', inStock ? 1 : 0);
      }

      // Count total before pagination
      const { count } = await query;
      const total = count || 0;

      // Apply sorting and pagination
      query = query
        .order(Object.keys(orderBy)[0], {
          ascending: Object.values(orderBy)[0] === 'asc',
        })
        .range((page - 1) * limit, page * limit - 1);

      const { data: products, error } = await query;

      if (error) throw error;

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
      const { data: products, error } = await this.supabase
        .from('product')
        .select('name, category')
        .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(limit);

      if (error) throw error;

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
      const { data: products, error } = await this.supabase
        .from('product')
        .select('id, name, description, price, stock, images, category, created_at')
        .eq('is_active', true)
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

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
      let query = this.supabase
        .from('product')
        .select('category')
        .eq('is_active', true)

      if (filters.query) {
        query = query.or(
          `name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`
        );
      }

      const { data: categories, error } = await query;
      if (error) throw error;

      // Get price range facets
      const priceRanges = await this.getPriceRangeFacets(filters);

      return {
        categories: categories.reduce((acc, product) => {
          if (product.category) {
            const existing = acc.find(c => c.name === product.category);
            if (existing) {
              existing.count++;
            } else {
              acc.push({ name: product.category, count: 1 });
            }
          }
          return acc;
        }, [] as { name: string; count: number }[]),
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

      let query = this.supabase
        .from('product')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .gte('price', range.min);

      if (range.max) {
        query = query.lte('price', range.max);
      }

      if (filters.query) {
        query = query.or(
          `name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`
        );
      }

      const { count } = await query;

      if (count && count > 0) {
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
      const { data: originalProduct, error: originalError } = await this.supabase
        .from('product')
        .select('category, price')
        .eq('id', productId)
        .single();

      if (originalError || !originalProduct) {
        return [];
      }

      // Find similar products in the same category with similar price range
      const priceRange = parseFloat(originalProduct.price.toString()) * 0.3; // 30% price range
      const minPrice = parseFloat(originalProduct.price.toString()) - priceRange;
      const maxPrice = parseFloat(originalProduct.price.toString()) + priceRange;

      const { data: similarProducts, error } = await this.supabase
        .from('product')
        .select('id, name, description, price, stock, images, category')
        .neq('id', productId)
        .eq('is_active', true)
        .eq('category', originalProduct.category)
        .gte('price', minPrice)
        .lte('price', maxPrice)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

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
