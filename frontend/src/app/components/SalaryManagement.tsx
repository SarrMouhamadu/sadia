import { useState, useEffect } from 'react';
import { DollarSign, Download, Filter, Calendar, TrendingUp, Loader2, Plus, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';

import type { UserRole } from '../services/auth.service';
import { salaryService } from '../../services/salary.service';
import type { Salary, SalaryStats, PaySalaryData } from '../../types';

interface SalaryManagementProps {
  userRole: UserRole;
}

export function SalaryManagement({ userRole }: SalaryManagementProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [stats, setStats] = useState<SalaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);
  const [paymentMode, setPaymentMode] = useState<'ESPECES' | 'VIREMENT' | 'CHEQUE'>('VIREMENT');
  const [paymentReference, setPaymentReference] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [generatingMonth, setGeneratingMonth] = useState(false);
  const [cancellingPayment, setCancellingPayment] = useState<string | null>(null);

  const canManage = userRole === 'ADMIN' || userRole === 'ASSISTANT';

  // Load salaries and stats
  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load salaries and stats in parallel
      const [salariesResponse, statsData] = await Promise.all([
        salaryService.getAll({
          month: selectedMonth,
          year: selectedYear,
          limit: 100
        }),
        salaryService.getStats(selectedMonth, selectedYear)
      ]);

      setSalaries(salariesResponse.items);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading salary data:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handlePaySalary = async () => {
    if (!selectedSalary) return;

    try {
      setProcessingPayment(true);
      const paymentData: PaySalaryData = {
        mode_paiement: paymentMode,
        reference_paiement: paymentReference || undefined
      };

      await salaryService.paySalary(selectedSalary.id, paymentData);
      
      // Reload data
      await loadData();
      
      // Close dialog and reset
      setPaymentDialogOpen(false);
      setSelectedSalary(null);
      setPaymentReference('');
    } catch (err: any) {
      console.error('Error paying salary:', err);
      alert(err.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDownloadBulletin = async (salary: Salary) => {
    try {
      const workerName = salary.worker ? `${salary.worker.nom}_${salary.worker.prenom}` : 'bulletin';
      await salaryService.downloadBulletin(salary.id, workerName, salary.mois, salary.annee);
    } catch (err: any) {
      console.error('Error downloading bulletin:', err);
      alert(err.response?.data?.message || 'Erreur lors du téléchargement');
    }
  };

  const handleGenerateMonth = async () => {
    if (!window.confirm(`Voulez-vous générer les salaires pour ${monthNames[selectedMonth - 1]} ${selectedYear} ?`)) {
      return;
    }

    try {
      setGeneratingMonth(true);
      const result = await salaryService.generateMonthSalaries(selectedMonth, selectedYear);
      alert(`${result.created} salaires générés, ${result.skipped} ignorés.`);
      await loadData();
    } catch (err: any) {
      console.error('Error generating month salaries:', err);
      alert(err.response?.data?.message || 'Erreur lors de la génération');
    } finally {
      setGeneratingMonth(false);
    }
  };

  const handleCancelPayment = async (salary: Salary) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler ce paiement ? Le statut reviendra à "En attente".')) {
      return;
    }

    try {
      setCancellingPayment(salary.id);
      await salaryService.cancelPayment(salary.id);
      await loadData();
    } catch (err: any) {
      console.error('Error cancelling payment:', err);
      alert(err.response?.data?.message || 'Erreur lors de l\'annulation');
    } finally {
      setCancellingPayment(null);
    }
  };

  const openPaymentDialog = (salary: Salary) => {
    setSelectedSalary(salary);
    setPaymentDialogOpen(true);
  };

  // Filter salaries based on active tab
  const filteredSalaries = salaries.filter(salary => {
    if (activeTab === 'all') return true;
    if (activeTab === 'paid') return salary.statut === 'PAYE';
    if (activeTab === 'pending') return salary.statut === 'EN_ATTENTE';
    if (activeTab === 'processing') return salary.statut === 'ANNULE'; // Using ANNULE as processing for now
    return true;
  });

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'PAYE':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Payé
          </Badge>
        );
      case 'EN_ATTENTE':
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
            En attente
          </Badge>
        );
      case 'ANNULE':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            Annulé
          </Badge>
        );
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  // Generate month options for the last 12 months
  const monthOptions: { value: string; label: string; month: number; year: number }[] = [];
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    monthOptions.push({
      value: `${year}-${month}`,
      label: `${monthNames[month - 1]} ${year}`,
      month,
      year
    });
  }

  const handleMonthChange = (value: string) => {
    const option = monthOptions.find(opt => opt.value === value);
    if (option) {
      setSelectedMonth(option.month);
      setSelectedYear(option.year);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <Button onClick={loadData} className="mt-2" variant="outline">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Gestion des salaires</h1>
          <p className="text-gray-600">Suivez et gérez les paiements de votre équipe</p>
        </div>
        <div className="flex gap-2">
          {userRole === 'ADMIN' && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 gap-2"
              onClick={handleGenerateMonth}
              disabled={generatingMonth}
            >
              {generatingMonth ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Générer le mois
            </Button>
          )}
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtrer
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total du mois</p>
                <p className="text-3xl text-gray-900">
                  {stats?.totalAmount.toLocaleString('fr-FR') || 0} FCFA
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {monthNames[selectedMonth - 1]} {selectedYear}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Salaires payés</p>
                <p className="text-3xl text-emerald-600">
                  {stats?.paidAmount.toLocaleString('fr-FR') || 0} FCFA
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {stats?.paidCount || 0} paiements effectués
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En attente</p>
                <p className="text-3xl text-orange-600">
                  {stats?.pendingAmount.toLocaleString('fr-FR') || 0} FCFA
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {stats?.pendingCount || 0} paiements à venir
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registre des salaires</CardTitle>
              <CardDescription>Historique et détails des paiements</CardDescription>
            </div>
            <Select 
              value={`${selectedYear}-${selectedMonth}`} 
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Tous ({salaries.length})</TabsTrigger>
              <TabsTrigger value="paid">
                Payés ({salaries.filter(s => s.statut === 'PAYE').length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                En attente ({salaries.filter(s => s.statut === 'EN_ATTENTE').length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              {filteredSalaries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Aucun salaire trouvé pour cette période</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Travailleur</TableHead>
                      <TableHead>Salaire de base</TableHead>
                      <TableHead>Primes</TableHead>
                      <TableHead>Déductions</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Statut</TableHead>
                      {canManage && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSalaries.map((salary) => (
                      <TableRow key={salary.id}>
                        <TableCell>
                          {salary.worker 
                            ? `${salary.worker.nom} ${salary.worker.prenom}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{salary.salaire_base.toLocaleString('fr-FR')} FCFA</TableCell>
                        <TableCell className="text-emerald-600">
                          {salary.primes > 0 ? `+${salary.primes.toLocaleString('fr-FR')} FCFA` : '-'}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {salary.deductions > 0 ? `-${salary.deductions.toLocaleString('fr-FR')} FCFA` : '-'}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {salary.salaire_net.toLocaleString('fr-FR')} FCFA
                        </TableCell>
                        <TableCell>{getStatusBadge(salary.statut)}</TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDownloadBulletin(salary)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Bulletin
                              </Button>
                              {salary.statut === 'EN_ATTENTE' && userRole !== 'ASSISTANT' && (
                                <Button 
                                  size="sm" 
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => openPaymentDialog(salary)}
                                >
                                  Payer
                                </Button>
                              )}
                              {salary.statut === 'EN_ATTENTE' && userRole === 'ASSISTANT' && (
                                <Button 
                                  size="sm" 
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => openPaymentDialog(salary)}
                                >
                                  Payer
                                </Button>
                              )}
                              {salary.statut === 'PAYE' && userRole === 'ADMIN' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleCancelPayment(salary)}
                                  disabled={cancellingPayment === salary.id}
                                >
                                  {cancellingPayment === salary.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Annuler
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer comme payé</DialogTitle>
            <DialogDescription>
              Confirmer le paiement du salaire de{' '}
              {selectedSalary?.worker 
                ? `${selectedSalary.worker.nom} ${selectedSalary.worker.prenom}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-mode">Mode de paiement</Label>
              <Select 
                value={paymentMode} 
                onValueChange={(value: any) => setPaymentMode(value)}
              >
                <SelectTrigger id="payment-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIREMENT">Virement</SelectItem>
                  <SelectItem value="ESPECES">Espèces</SelectItem>
                  <SelectItem value="CHEQUE">Chèque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-ref">Référence de paiement (optionnel)</Label>
              <Input
                id="payment-ref"
                placeholder="Ex: REF-2024-001"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Montant à payer</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedSalary?.salaire_net.toLocaleString('fr-FR')} FCFA
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setPaymentDialogOpen(false)}
              disabled={processingPayment}
            >
              Annuler
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handlePaySalary}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                'Confirmer le paiement'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
