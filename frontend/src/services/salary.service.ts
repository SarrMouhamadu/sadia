import api from './api';
import type { Salary, SalaryStats, CreateSalaryData, UpdateSalaryData, PaySalaryData } from '../types';

interface GetSalariesParams {
  month?: number;
  year?: number;
  statut?: 'EN_ATTENTE' | 'PAYE' | 'ANNULE';
  worker_id?: string;
  page?: number;
  limit?: number;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export const salaryService = {
  /**
   * Get all salaries with optional filters
   */
  getAll: async (params?: GetSalariesParams): Promise<PaginatedResponse<Salary>> => {
    const response = await api.get('/salaries', { params });
    return {
      items: response.data.data,
      pagination: response.data.pagination
    };
  },

  /**
   * Get salary by ID
   */
  getById: async (id: string): Promise<Salary> => {
    const response = await api.get(`/salaries/${id}`);
    return response.data.data.salary;
  },

  /**
   * Get salary statistics for a specific month/year
   */
  getStats: async (month?: number, year?: number): Promise<SalaryStats> => {
    const response = await api.get('/salaries/stats', {
      params: { month, year }
    });
    // Backend returns { data: { stats: { ... } } }
    return response.data.data.stats || response.data.data;
  },

  /**
   * Get salary history for a specific worker
   */
  getWorkerSalaries: async (workerId: string, page?: number, limit?: number): Promise<PaginatedResponse<Salary>> => {
    const response = await api.get(`/salaries/worker/${workerId}`, {
      params: { page, limit }
    });
    return {
      items: response.data.data.salaries,
      pagination: response.data.pagination
    };
  },

  /**
   * Create a new salary record
   */
  create: async (data: CreateSalaryData): Promise<Salary> => {
    const response = await api.post('/salaries', data);
    return response.data.data.salary;
  },

  /**
   * Update an existing salary record
   */
  update: async (id: string, data: UpdateSalaryData): Promise<Salary> => {
    const response = await api.put(`/salaries/${id}`, data);
    return response.data.data.salary;
  },

  /**
   * Mark a salary as paid
   */
  paySalary: async (id: string, paymentData: PaySalaryData): Promise<Salary> => {
    const response = await api.patch(`/salaries/${id}/pay`, paymentData);
    return response.data.data.salary;
  },

  /**
   * Cancel a salary payment
   */
  cancelPayment: async (id: string): Promise<Salary> => {
    const response = await api.patch(`/salaries/${id}/cancel-payment`);
    return response.data.data.salary;
  },

  /**
   * Generate salary bulletin PDF for an existing salary
   */
  generateBulletin: async (id: string): Promise<Blob> => {
    const response = await api.get(`/salaries/${id}/bulletin`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Generate salary bulletin PDF for a worker (auto-creates salary if needed)
   */
  generateBulletinForWorker: async (workerId: string, mois?: number, annee?: number): Promise<Blob> => {
    const response = await api.post('/salaries/bulletin', {
      worker_id: workerId,
      mois,
      annee
    }, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Generate salaries for all active workers for a specific month (Admin only)
   */
  generateMonthSalaries: async (mois: number, annee: number): Promise<{ created: number; skipped: number }> => {
    const response = await api.post('/salaries/generate-month', { mois, annee });
    return {
      created: response.data.data.created,
      skipped: response.data.data.skipped
    };
  },

  /**
   * Download salary bulletin as PDF file
   */
  downloadBulletin: async (id: string, workerName: string, month: number, year: number): Promise<void> => {
    const blob = await salaryService.generateBulletin(id);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bulletin_${workerName}_${month}_${year}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
