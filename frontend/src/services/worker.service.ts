import api from './api';
import type { Worker } from '../types';

export const workerService = {
  getAll: async (params?: { month?: number; year?: number; paymentStatus?: string; search?: string }): Promise<Worker[]> => {
    const response = await api.get('/workers', { params });
    return response.data.data.workers || response.data.data;
  },
  
  create: async (data: Partial<Worker>): Promise<Worker> => {
    const response = await api.post('/workers', data);
    return response.data.data.worker;
  },

  update: async (id: string, data: Partial<Worker>): Promise<Worker> => {
    const response = await api.put(`/workers/${id}`, data);
    return response.data.data.worker;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/workers/${id}`);
  },
  
  /**
   * Generate salary bulletin PDF for a worker
   * @param workerId - Worker ID
   * @param mois - Month (1-12), defaults to current month
   * @param annee - Year, defaults to current year
   * @returns PDF blob
   */
  generateBulletin: async (workerId: string, mois?: number, annee?: number): Promise<Blob> => {
    const response = await api.post('/salaries/bulletin', {
      worker_id: workerId,
      mois,
      annee
    }, {
      responseType: 'blob'
    });
    return response.data;
  }
};
