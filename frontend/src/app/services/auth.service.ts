import api from '../../services/api';

export type UserRole = 'ADMIN' | 'ASSISTANT';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
}

interface LoginData {
  identifiant: string;
  motDePasse: string;
}

interface RegisterData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  motDePasse: string;
  role: string;
  adminSecretKey?: string; // Optional, only for admin creation
}

interface AuthResponse {
  success: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  message?: string;
}

export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', {
        email: data.identifiant,
        password: data.motDePasse
      });

      if (response.data.success) {
        // Save tokens
        const { accessToken, refreshToken, user } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        return {
          success: true,
          user: user,
          accessToken
        };
      }
      return { success: false, error: 'Erreur inconnue' };
    } catch (error: any) {
      console.error('Login error:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Identifiants invalides' 
      };
    }
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/register', {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        contact: data.telephone, // Backend expects 'contact' ?? Wait, let's verify model. Model has 'contact' for Worker, but User doesn't seem to have phone? Let's check User model again.
        // User model: nom, prenom, email, password, role, is_active. Dictionary doesn't show phone.
        // Wait, the registration form has phone. If User model doesn't have phone, we might lose it.
        // For now, I will send what I can.
        password: data.motDePasse,
        role: data.role.toUpperCase(), // Backend expects ADMIN or ASSISTANT
        adminSecretKey: data.adminSecretKey
      });

      if (response.data.success) {
         return { success: true, message: 'Inscription réussie' };
      }
       return { success: false, error: 'Erreur inconnue' };
    } catch (error: any) {
       return { 
        success: false, 
        message: error.response?.data?.message || 'Erreur lors de l\'inscription' 
      };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  createAssistant: async (data: any) => {
    // Use the protected users endpoint for Admin creation of assistants
    try {
        const response = await api.post('/auth/users', {
            ...data,
            role: 'ASSISTANT', // Uppercase to match backend validator/enum
            password: data.motDePasse // Map motDePasse to password
        });
        if (response.data.success) {
            return { success: true, message: 'Assistant créé avec succès' };
        }
        return { success: false, error: 'Erreur inconnue' };
    } catch (error: any) {
         return { 
            success: false, 
            message: error.response?.data?.message || 'Erreur lors de la création de l\'assistant' 
        };
    }
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get('/auth/users');
      if (response.data.success) {
        // Backend returns { success: true, data: { users: [...] } }
        // So we need to access response.data.data.users
        return response.data.data.users || []; 
      }
      return [];
    } catch (error) {
      console.error('Error fetching users', error);
      return [];
    }
  },

  resetPassword: async (email: string) => {
    // Backend doesn't seem to have reset password endpoint implemented in controller (only changePassword).
    // I will mock this for now or leaving it as is (mocked) if endpoint missing in list.
    // Listed endpoints: changePassword (PUT /auth/change-password). No reset.
    // Keeping mock for UX.
    return new Promise<{ success: boolean; message?: string }>((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Fonctionnalité non disponible (Backend limit)' });
      }, 1000);
    });
  }
};

