// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// API response types
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface User {
  id: string;
  phone: string;
  phoneVerified: boolean;
  onboardingComplete: boolean;
  profileComplete: boolean;
  age?: number;
  location?: string;
  interests?: string[];
  fits?: string[];
}

interface Product {
  _id: string;
  name: string;
  description: string;
  brand: string;
  images: Array<{
    url: string;
    filename?: string;
    isPrimary: boolean;
  }>;
  price: {
    original: number;
    current: number;
    currency: string;
  };
  category: string;
  gender: string;
  sizes: Array<{
    size: string;
    inStock: boolean;
  }>;
  colors: string[];
  isActive: boolean;
  inStock: boolean;
  createdAt: string;
}

// API utility function
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Authentication APIs
export const authAPI = {
  // Send verification code
  sendVerificationCode: async (phone: string): Promise<ApiResponse<{ phone: string; expiresIn: number; code?: string }>> => {
    return apiCall('/api/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  // Verify phone and login
  verifyPhone: async (phone: string, code: string): Promise<ApiResponse<{ user: User; token: string; isNewUser: boolean }>> => {
    return apiCall('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  },

  // Complete onboarding
  completeOnboarding: async (userData: {
    userId: string;
    age: number;
    interests: string[];
    fits: string[];
    location: string;
  }): Promise<ApiResponse<{ user: User }>> => {
    return apiCall('/api/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Get user profile
  getProfile: async (token: string): Promise<ApiResponse<{ user: User }>> => {
    return apiCall('/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

// Product APIs
export const productAPI = {
  // Get sample products
  getSampleProducts: async (): Promise<ApiResponse<{ products: Product[]; count: number }>> => {
    return apiCall('/api/products/sample');
  },

  // Get all products
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    gender?: string;
  }): Promise<ApiResponse<{ products: Product[]; pagination: any }>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.category) searchParams.append('category', params.category);
    if (params?.gender) searchParams.append('gender', params.gender);

    const query = searchParams.toString();
    return apiCall(`/api/products${query ? `?${query}` : ''}`);
  },

  // Get single product
  getProduct: async (id: string): Promise<ApiResponse<{ product: Product }>> => {
    return apiCall(`/api/products/${id}`);
  },
};

// Upload APIs
export const uploadAPI = {
  // Upload single image
  uploadImage: async (file: File): Promise<ApiResponse<{ filename: string; url: string }>> => {
    const formData = new FormData();
    formData.append('image', file);

    return fetch(`${API_BASE_URL}/api/upload/image`, {
      method: 'POST',
      body: formData,
    }).then(res => res.json());
  },

  // Upload multiple images
  uploadImages: async (files: File[]): Promise<ApiResponse<{ images: Array<{ filename: string; url: string }> }>> => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    return fetch(`${API_BASE_URL}/api/upload/images`, {
      method: 'POST',
      body: formData,
    }).then(res => res.json());
  },
};

// Local storage utilities for user session
export const storage = {
  setUser: (user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('casa_user', JSON.stringify(user));
    }
  },

  getUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('casa_user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('casa_token', token);
    }
  },

  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('casa_token');
    }
    return null;
  },

  clearSession: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('casa_user');
      localStorage.removeItem('casa_token');
    }
  },
};

// Export types
export type { User, Product, ApiResponse };
