import Dexie, { Table } from 'dexie';

// Define interfaces for our data models
export interface Product {
  id: string;
  title: string;
  handle: string;
  description?: string;
  vendor?: string;
  product_type?: string;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  tags?: string[];
  status?: string;
  published_at?: string;
  shop_id?: string;
  // AI-generated data
  ai_generated_images?: AIGeneratedImage[];
  ai_analysis?: {
    category: string;
    keywords: string[];
    sentiment?: number;
  };
}

export interface ProductImage {
  id: string;
  product_id: string;
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  position?: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  title: string;
  price: string;
  sku?: string;
  inventory_quantity?: number;
  weight?: number;
  option1?: string;
  option2?: string;
  option3?: string;
}

export interface Shop {
  id: string;
  name: string;
  email?: string;
  domain: string;
  shop_owner?: string;
  created_at: string;
  updated_at: string;
  country?: string;
  currency?: string;
  timezone?: string;
  // User interaction data
  followed_at?: string;
  is_followed: boolean;
  visit_count: number;
  last_visited: string;
}

export interface User {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
  // Activity tracking
  total_visits: number;
  followed_shops: string[]; // array of shop IDs
  favorite_products: string[]; // array of product IDs
  search_history: SearchQuery[];
  ai_interactions: AIInteraction[];
}

export interface SearchQuery {
  id: string;
  user_id: string;
  query: string;
  timestamp: string;
  results_count: number;
  filters_applied?: Record<string, any>;
}

export interface AIInteraction {
  id: string;
  user_id: string;
  type: 'image_generation' | 'product_analysis' | 'recommendation';
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  timestamp: string;
  processing_time?: number;
  success: boolean;
  error_message?: string;
}

export interface AIGeneratedImage {
  id: string;
  product_id?: string;
  user_id: string;
  prompt: string;
  image_url: string;
  model_used: string;
  generation_time: number;
  created_at: string;
  metadata?: {
    width: number;
    height: number;
    seed?: number;
    inference_steps?: number;
  };
}

export interface Analytics {
  id: string;
  event_type: string;
  entity_type: 'product' | 'shop' | 'user' | 'ai_interaction';
  entity_id: string;
  data: Record<string, any>;
  timestamp: string;
  session_id?: string;
}

// Database class extending Dexie
export class ShopifyDatabase extends Dexie {
  // Define tables
  products!: Table<Product>;
  product_images!: Table<ProductImage>;
  product_variants!: Table<ProductVariant>;
  shops!: Table<Shop>;
  users!: Table<User>;
  search_queries!: Table<SearchQuery>;
  ai_interactions!: Table<AIInteraction>;
  ai_generated_images!: Table<AIGeneratedImage>;
  analytics!: Table<Analytics>;

  constructor() {
    super('ShopifyMiniDatabase');
    
    this.version(1).stores({
      products: 'id, title, handle, vendor, product_type, created_at, updated_at, shop_id, status',
      product_images: 'id, product_id, src, position',
      product_variants: 'id, product_id, title, price, sku',
      shops: 'id, name, domain, created_at, is_followed, last_visited',
      users: 'id, email, created_at, total_visits',
      search_queries: 'id, user_id, query, timestamp',
      ai_interactions: 'id, user_id, type, timestamp, success',
      ai_generated_images: 'id, product_id, user_id, created_at, model_used',
      analytics: 'id, event_type, entity_type, entity_id, timestamp, session_id'
    });
  }
}

// Create singleton database instance
export const db = new ShopifyDatabase();

// Database service class for common operations
export class DatabaseService {
  private static instance: DatabaseService;
  
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Product operations
  async saveProduct(product: Product): Promise<void> {
    await db.products.put(product);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return await db.products.get(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.products.toArray();
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db.products
      .filter(product => 
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.toLowerCase()) ||
        product.vendor?.toLowerCase().includes(query.toLowerCase())
      )
      .toArray();
  }

  // Shop operations
  async saveShop(shop: Shop): Promise<void> {
    await db.shops.put(shop);
  }

  async getFollowedShops(): Promise<Shop[]> {
    return await db.shops.where('is_followed').equals(true).toArray();
  }

  async followShop(shopId: string): Promise<void> {
    await db.shops.update(shopId, { 
      is_followed: true, 
      followed_at: new Date().toISOString() 
    });
  }

  async unfollowShop(shopId: string): Promise<void> {
    await db.shops.update(shopId, { is_followed: false });
  }

  // AI operations
  async saveAIInteraction(interaction: AIInteraction): Promise<void> {
    await db.ai_interactions.add(interaction);
  }

  async saveAIGeneratedImage(image: AIGeneratedImage): Promise<void> {
    await db.ai_generated_images.add(image);
  }

  async getAIInteractionsByUser(userId: string): Promise<AIInteraction[]> {
    return await db.ai_interactions.where('user_id').equals(userId).toArray();
  }

  async getAIGeneratedImagesByUser(userId: string): Promise<AIGeneratedImage[]> {
    return await db.ai_generated_images.where('user_id').equals(userId).toArray();
  }

  // Analytics operations
  async trackEvent(event: Omit<Analytics, 'id' | 'timestamp'>): Promise<void> {
    const analyticsEvent: Analytics = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    await db.analytics.add(analyticsEvent);
  }

  async getAnalytics(
    eventType?: string, 
    entityType?: string, 
    dateRange?: { from: string; to: string }
  ): Promise<Analytics[]> {
    let query = db.analytics.orderBy('timestamp');
    
    if (eventType) {
      query = db.analytics.where('event_type').equals(eventType);
    }
    
    if (entityType) {
      query = query.and(item => item.entity_type === entityType);
    }
    
    if (dateRange) {
      query = query.and(item => 
        item.timestamp >= dateRange.from && item.timestamp <= dateRange.to
      );
    }
    
    return await query.toArray();
  }

  // User operations
  async saveUser(user: User): Promise<void> {
    await db.users.put(user);
  }

  async getUser(id: string): Promise<User | undefined> {
    return await db.users.get(id);
  }

  async updateUserActivity(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      await db.users.update(userId, {
        total_visits: user.total_visits + 1,
        updated_at: new Date().toISOString()
      });
    }
  }

  // Bulk operations for data sync
  async bulkSaveProducts(products: Product[]): Promise<void> {
    await db.products.bulkPut(products);
  }

  async bulkSaveShops(shops: Shop[]): Promise<void> {
    await db.shops.bulkPut(shops);
  }

  // Database management
  async clearAllData(): Promise<void> {
    await db.delete();
    await db.open();
  }

  async exportData(): Promise<any> {
    return {
      products: await db.products.toArray(),
      shops: await db.shops.toArray(),
      users: await db.users.toArray(),
      ai_interactions: await db.ai_interactions.toArray(),
      ai_generated_images: await db.ai_generated_images.toArray(),
      analytics: await db.analytics.toArray()
    };
  }
}
