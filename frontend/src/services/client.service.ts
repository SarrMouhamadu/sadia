import api from './api';

export interface Client {
  id: string;
  nom: string;
  adresse: string;
  site?: string;
  telephone: string;
  email: string;
  contact_principal?: string;
  type_contrat: string; // Service type
  prix_contrat: number; // Montant
  montant_paye: number;
  montant_du?: number;
  statut: 'EN_COURS' | 'TERMINE' | 'SUSPENDU';
  date_debut?: string;
  date_fin?: string;
  notes?: string;
}

export const clientService = {
  getAll: async () => {
    const response = await api.get('/clients');
    return response.data.data;
  },


  create: async (data: Partial<Client>) => {
    const response = await api.post('/clients', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Client>) => {
    const response = await api.put(`/clients/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },

  generateReceipt: async (id: string) => {
    // This returns a blob (PDF)
    const response = await api.get(`/clients/${id}/receipt`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Toggle payment status for a client (simulate: set montant_paye to prix_contrat or 0)
  togglePaymentStatus: async (client: Client) => {
    const isPaid = (client.montant_paye ?? 0) >= (client.prix_contrat ?? 0);
    const newMontant = isPaid ? 0 : client.prix_contrat;
    const response = await api.put(`/clients/${client.id}`, { montant_paye: newMontant });
    return response.data;
  },
};
