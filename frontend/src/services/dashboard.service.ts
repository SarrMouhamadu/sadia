import api from './api';

export interface DashboardStats {
    period: {
        mois: number;
        annee: number;
    };
    workers: {
        total: number;
        actifs: number;
    };
    salaries: {
        total: number;
        paye: number;
        enAttente: number;
        restant: number;
    };
    stock: {
        totalProducts: number;
        alertes: number;
        ruptures: number;
    };
    clients?: {
        total: number;
        enCours: number;
        totalContrats: number;
        totalPaye: number;
        totalDu: number;
    };
    alertProducts: {
        id: string;
        nom: string;
        quantite_actuelle: number;
        seuil_alerte: number;
        statut: 'ALERTE' | 'RUPTURE';
    }[];
}

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    created_at: string;
    data?: any;
}

export interface RecentActivity {
    id: string;
    type: 'STOCK_IN' | 'STOCK_OUT' | 'SALARY_PAYMENT' | 'CLIENT_PAYMENT';
    title: string;
    description: string;
    details: string;
    user: string | null;
    amount: number | null;
    date: string;
    icon: string;
    color: string;
}

export const dashboardService = {
    getStats: async (month?: number, year?: number): Promise<DashboardStats> => {
        const response = await api.get('/dashboard/stats', {
            params: { month, year }
        });
        return response.data?.data?.stats || response.data?.data;
    },

    getRecentActivities: async (limit: number = 10): Promise<RecentActivity[]> => {
        const response = await api.get('/dashboard/activities', {
            params: { limit }
        });
        return response.data?.data?.activities || [];
    },

    getNotifications: async (params?: { page?: number; limit?: number; type?: string }): Promise<Notification[]> => {
        const response = await api.get('/notifications', { params });
        // Handle both paginated and direct array responses
        const data = response.data?.data;
        if (Array.isArray(data)) return data;
        if (data?.items) return data.items;
        if (data?.notifications) return data.notifications;
        return [];
    },

    markNotificationAsRead: async (id: string): Promise<void> => {
        await api.put(`/notifications/${id}/read`);
    },

    markAllNotificationsAsRead: async (): Promise<void> => {
        await api.put('/notifications/read-all');
    }
};
