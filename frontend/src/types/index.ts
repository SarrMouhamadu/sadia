export interface Product {
    id: string;
    nom: string;
    description?: string;
    category_id?: string;
    category?: { id: string; nom: string }; // Assuming backend populates category or it's separate
    code_produit?: string;
    unite: string;
    quantite_actuelle: number;
    seuil_alerte: number;
    prix_unitaire?: number;
    statut: 'OK' | 'ALERTE' | 'RUPTURE';
    derniere_maj: string;
    emplacement?: string;
    fournisseur?: string;
}

export interface Worker {
    id: string;
    nom: string;
    prenom: string;
    poste: string;
    contact?: string;
    email?: string;
    date_embauche: string;
    salaire_base: number;
    statut: 'ACTIF' | 'INACTIF' | 'SUSPENDU';
    site_affectation?: string;
    cin?: string;
    adresse?: string;
    notes?: string;
    salaries?: Salary[];
}

export interface PrimeDetail {
    label: string;
    amount: number;
}

export interface DeductionDetail {
    label: string;
    amount: number;
}

export interface Salary {
    id: string;
    worker_id: string;
    worker?: {
        id: string;
        nom: string;
        prenom: string;
        poste: string;
        site_affectation?: string;
        cin?: string;
        date_embauche?: string;
    };
    mois: number;
    annee: number;
    salaire_base: number;
    primes: number;
    primes_details?: PrimeDetail[];
    deductions: number;
    deductions_details?: DeductionDetail[];
    salaire_net: number;
    statut: 'EN_ATTENTE' | 'PAYE' | 'ANNULE';
    date_paiement?: string;
    mode_paiement?: 'ESPECES' | 'VIREMENT' | 'CHEQUE';
    reference_paiement?: string;
    notes?: string;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
}

export interface SalaryStats {
    totalWorkers: number;
    totalAmount: number;
    paidCount: number;
    paidAmount: number;
    pendingCount: number;
    pendingAmount: number;
}

export interface CreateSalaryData {
    worker_id: string;
    mois: number;
    annee: number;
    salaire_base: number;
    primes?: number;
    primes_details?: PrimeDetail[];
    deductions?: number;
    deductions_details?: DeductionDetail[];
    notes?: string;
}

export interface UpdateSalaryData {
    primes?: number;
    primes_details?: PrimeDetail[];
    deductions?: number;
    deductions_details?: DeductionDetail[];
    notes?: string;
}

export interface PaySalaryData {
    mode_paiement: 'ESPECES' | 'VIREMENT' | 'CHEQUE';
    reference_paiement?: string;
}
