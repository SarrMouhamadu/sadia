import api from './api';
import type { Product } from '../types';

export interface Category {
  id: string;
  nom: string;
  description?: string;
  is_active?: boolean;
  productCount?: number;
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: 'ENTREE' | 'SORTIE';
  quantite: number;
  quantite_avant: number;
  quantite_apres: number;
  source?: string;
  destination?: string;
  reference?: string;
  notes?: string;
  created_at: string;
  product?: Product;
}

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get('/products?limit=100');
    // Backend uses ApiResponse.paginated() which returns: { success, message, data: items, pagination }
    return response.data?.data || [];
  },

  create: async (data: Partial<Product>): Promise<Product> => {
    const response = await api.post('/products', data);
    return response.data.data.product;
  },

  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    const response = await api.put(`/products/${id}`, data);
    return response.data.data.product;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    // Backend uses ApiResponse.success() which returns: { success, message, data: { categories: [...] } }
    // Backend uses ApiResponse.success() which returns: { success, message, data: { categories: [...] } }
    return response.data?.data?.categories || [];
  },

  createCategory: async (data: Partial<Category>): Promise<Category> => {
    const response = await api.post('/categories', data);
    return response.data.data.category;
  },

  updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data.data.category;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },

  // Stock Management
  recordEntry: async (data: { product_id: string; quantite: number; source?: string; reference?: string; notes?: string }) => {
    const response = await api.post('/stock/entry', data);
    return response.data.data;
  },

  importProducts: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data; // import controller returns stats in data
  },

  recordExit: async (data: { product_id: string; quantite: number; destination?: string; reference?: string; notes?: string }) => {
    const response = await api.post('/stock/exit', data);
    return response.data.data;
  },

  getMovements: async (params?: any): Promise<StockMovement[]> => {
    const response = await api.get('/stock/movements', { params });
    // Backend uses ApiResponse.paginated() which returns: { success, message, data: items, pagination }
    return response.data?.data || [];
  }
};

