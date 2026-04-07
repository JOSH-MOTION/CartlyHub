// Product Management
export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  weight?: number;
  image?: string;
  attributes: {
    color?: string;
    size?: string;
    material?: string;
    [key: string]: string | undefined;
  };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  basePrice: number;
  images: string[];
  variants: ProductVariant[];
  isFeatured?: boolean;
  isActive: boolean;
  tags: string[];
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
  isActive: boolean;
  seo: {
    slug: string;
    title?: string;
    description?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Order System
export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  product: Product;
  variant: ProductVariant;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  paymentMethod: 'paystack' | 'momo_transfer' | 'manual';
  paymentDetails: {
    reference?: string;
    transactionId?: string;
    verifiedAt?: Date;
  };
  shippingAddress: Address;
  billingAddress: Address;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  total: number;
  product: Product;
  variant: ProductVariant;
}

// User Management
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'admin';
  isActive: boolean;
  addresses: Address[];
  preferences: {
    newsletter: boolean;
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: string;
  type: 'shipping' | 'billing';
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}

// Inventory & Finance
export interface InventoryProduct {
  id: string;
  productId: string;
  variantId: string;
  currentStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  lastUpdated: Date;
  costPrice: number;
  supplier?: string;
}

export interface ManualSale {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'momo' | 'bank_transfer';
  paymentStatus: 'paid' | 'pending';
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'inventory' | 'marketing' | 'operations' | 'utilities' | 'other';
  date: Date;
  receipt?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

// Promotions
export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  minimumAmount?: number;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
  applicableProducts?: string[];
  applicableCategories?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Store Settings
export interface StoreSettings {
  id: string;
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: Address;
  currency: {
    code: string;
    symbol: string;
    country: string;
    ghanaPhoneCode: string;
  };
  tax: {
    enabled: boolean;
    rate: number;
    included: boolean;
  };
  shipping: {
    enabled: boolean;
    flatRate: number;
    freeShippingThreshold?: number;
  };
  payment: {
    paystackEnabled: boolean;
    momoEnabled: boolean;
    manualPaymentEnabled: boolean;
  };
  social: {
    whatsapp: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    ghanaPhoneCode: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    favicon?: string;
  };
  updatedAt: Date;
}

// App Context Types
export interface AppContextType {
  // User & Auth
  user: User | null;
  profile: User | null;
  isAuthOpen: boolean;
  isLoading: boolean;
  
  // Data
  products: Product[];
  categories: Category[];
  promotions: Promotion[];
  settings: StoreSettings | null;
  
  // Cart
  cart: CartItem[];
  cartTotal: number;
  totalItems: number;
  isCartOpen: boolean;
  
  // Admin
  inventoryProducts: InventoryProduct[];
  expenses: Expense[];
  manualSales: ManualSale[];
  orders: Order[];
  
  // Wishlist
  wishlist: string[];
  
  // Actions
  // Auth
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  setAuthOpen: (open: boolean) => void;
  
  // Cart
  addToCart: (productId: string, variantId: string, quantity: number) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;
  
  // Wishlist
  toggleWishlist: (productId: string) => void;
  
  // Admin
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  addPromotion: (promotion: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<void>;
  updatePromotion: (id: string, updates: Partial<Promotion>) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;
  
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  
  updateSettings: (settings: Partial<StoreSettings>) => Promise<void>;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaymentVerificationResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    log: any;
    fees: number;
    fees_split: any;
    authorization: any;
    customer: any;
    plan: any;
    subaccount: any;
    split: any;
    order_id: string;
    paidAt: string;
    createdAt: string;
    transaction_date: string;
  };
}
