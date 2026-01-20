import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, FileText, Calendar, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

import type { UserRole } from '../services/auth.service';
import { workerService } from '../../services/worker.service';
import type { Worker } from '../../types';

interface WorkersManagementProps {
  userRole: UserRole;
}

export function WorkersManagement({ userRole }: WorkersManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  const loadWorkers = async () => {
    try {
      const params: any = {
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
        search: searchTerm || undefined
      };
      
      if (paymentFilter !== 'ALL') {
        params.paymentStatus = paymentFilter;
      }

      const data = await workerService.getAll(params);
      setWorkers(data);
    } catch (e) {
      console.error("Failed to load workers", e);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, [selectedMonth, selectedYear, paymentFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        salaire_base: isNaN(Number(formData.salaire_base)) ? 0 : Number(formData.salaire_base),
        contact: formData.contact === '' ? undefined : formData.contact,
        email: formData.email === '' ? undefined : formData.email,
        site_affectation: formData.site_affectation === '' ? undefined : formData.site_affectation,
        cin: formData.cin === '' ? undefined : formData.cin,
      };

      if (editingWorker) {
        await workerService.update(editingWorker.id, payload);
        alert("Travailleur modifié avec succès");
      } else {
        await workerService.create(payload);
        alert("Travailleur créé avec succès");
      }
      setIsDialogOpen(false);
      setEditingWorker(null);
      resetForm();
      loadWorkers();
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || error.message || "Erreur lors de l'opération";
      alert(`Erreur: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      nom: worker.nom,
      prenom: worker.prenom,
      poste: worker.poste,
      contact: worker.contact || '',
      email: worker.email || '',
      date_embauche: worker.date_embauche,
      salaire_base: worker.salaire_base,
      statut: worker.statut,
      site_affectation: worker.site_affectation || '',
      cin: worker.cin || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce travailleur ?")) {
      try {
        await workerService.delete(id);
        loadWorkers();
        alert("Travailleur supprimé avec succès");
      } catch (e) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleGenerateBulletin = async (workerId: string, workerName: string) => {
    try {
      const mois = parseInt(selectedMonth);
      const annee = parseInt(selectedYear);

      const blob = await workerService.generateBulletin(workerId, mois, annee);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulletin_${workerName}_${mois}_${annee}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      const message = e.response?.data?.message || e.message || "Erreur lors de la génération du bulletin";
      alert(`Erreur: ${message}`);
      console.error(e);
    }
  };

  const [formData, setFormData] = useState<Partial<Worker>>({
    nom: '',
    prenom: '',
    poste: '',
    contact: '',
    email: '',
    date_embauche: '',
    salaire_base: 0,
    statut: 'ACTIF',
    site_affectation: '',
    cin: ''
  });

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      poste: '',
      contact: '',
      email: '',
      date_embauche: '',
      salaire_base: 0,
      statut: 'ACTIF',
      site_affectation: '',
      cin: ''
    });
  };

  const onOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingWorker(null);
      resetForm();
    }
  };

  const filteredWorkers = workers; // Filtering is now done on backend for payment status

  const canEdit = userRole === 'ADMIN' || userRole === 'ASSISTANT';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Gestion des travailleurs</h1>
          <p className="text-gray-600">Gérez votre équipe et leurs informations</p>
        </div>
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un travailleur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingWorker ? 'Modifier le travailleur' : 'Ajouter un nouveau travailleur'}</DialogTitle>
                <DialogDescription>
                  Remplissez les informations du {editingWorker ? 'travailleur' : 'nouveau membre de l\'équipe'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nom">Nom</Label>
                    <Input 
                      id="nom" 
                      value={formData.nom}
                      onChange={e => setFormData({...formData, nom: e.target.value})}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input 
                      id="prenom" 
                      value={formData.prenom}
                      onChange={e => setFormData({...formData, prenom: e.target.value})}
                      required 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="poste">Poste</Label>
                    <Input 
                      id="poste" 
                      value={formData.poste}
                      onChange={e => setFormData({...formData, poste: e.target.value})}
                      placeholder="Ex: Agent de nettoyage"
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="site">Site d'affectation</Label>
                    <Input 
                      id="site" 
                      value={formData.site_affectation}
                      onChange={e => setFormData({...formData, site_affectation: e.target.value})}
                      placeholder="Ex: Dakar Centre"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact">Téléphone</Label>
                    <Input 
                      id="contact" 
                      value={formData.contact}
                      onChange={e => setFormData({...formData, contact: e.target.value})}
                      placeholder="77..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cin">CIN</Label>
                    <Input 
                      id="cin" 
                      value={formData.cin}
                      onChange={e => setFormData({...formData, cin: e.target.value})}
                      placeholder="Numéro CIN"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_embauche">Date d'embauche</Label>
                    <Input 
                      id="date_embauche" 
                      type="date"
                      value={formData.date_embauche}
                      onChange={e => setFormData({...formData, date_embauche: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="salaire">Salaire mensuel (FCFA)</Label>
                    <Input 
                      id="salaire" 
                      type="number"
                      value={formData.salaire_base}
                      onChange={e => {
                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        setFormData({...formData, salaire_base: val});
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="statut">Statut</Label>
                    <Select 
                      value={formData.statut} 
                      onValueChange={(val: any) => setFormData({...formData, statut: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir le statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIF">Actif</SelectItem>
                        <SelectItem value="INACTIF">Inactif</SelectItem>
                        <SelectItem value="SUSPENDU">Suspendu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <Label className="flex items-center gap-2 mb-2 font-semibold">
            <Search className="w-4 h-4" /> Rechercher
          </Label>
          <Input
            placeholder="Nom, poste, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadWorkers()}
          />
        </div>

        <div className="w-40">
          <Label className="flex items-center gap-2 mb-2 font-semibold">
            <Calendar className="w-4 h-4" /> Mois
          </Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                { v: "1", l: "Janvier" }, { v: "2", l: "Février" }, { v: "3", l: "Mars" },
                { v: "4", l: "Avril" }, { v: "5", l: "Mai" }, { v: "6", l: "Juin" },
                { v: "7", l: "Juillet" }, { v: "8", l: "Août" }, { v: "9", l: "Septembre" },
                { v: "10", l: "Octobre" }, { v: "11", l: "Novembre" }, { v: "12", l: "Décembre" }
              ].map(m => (
                <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-32">
          <Label className="flex items-center gap-2 mb-2 font-semibold">
             Année
          </Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <Label className="flex items-center gap-2 mb-2 font-semibold">
            <Wallet className="w-4 h-4" /> Paiement
          </Label>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="PAYE">Payés</SelectItem>
              <SelectItem value="EN_ATTENTE">En attente</SelectItem>
              <SelectItem value="NOT_CREATED">Non planifiés</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" onClick={loadWorkers} className="hover:bg-emerald-50">
          Filtrer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des travailleurs</CardTitle>
              <CardDescription>
                Période : {selectedMonth}/{selectedYear} - {filteredWorkers.length} travailleur{filteredWorkers.length > 1 ? 's' : ''} au total
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Date d'embauche</TableHead>
                <TableHead>Salaire</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Aucun travailleur trouvé pour ces critères.
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkers.map((worker) => {
                  const salary = worker.salaries?.[0];
                  return (
                    <TableRow key={worker.id}>
                      <TableCell className="font-medium">
                        <div>{worker.nom} {worker.prenom}</div>
                        {worker.site_affectation && (
                          <div className="text-xs text-gray-500">{worker.site_affectation}</div>
                        )}
                      </TableCell>
                      <TableCell>{worker.poste}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{worker.contact || 'N/A'}</div>
                          <div className="text-gray-500">{worker.email || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(worker.date_embauche).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="font-bold">{worker.salaire_base.toLocaleString()} FCFA</TableCell>
                      <TableCell>
                        {salary ? (
                          <Badge 
                            variant={salary.statut === 'PAYE' ? 'default' : 'outline'}
                            className={salary.statut === 'PAYE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700 border-amber-200'}
                          >
                            {salary.statut === 'PAYE' ? 'Payé' : 'En attente'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                            Non défini
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={worker.statut === 'ACTIF' ? 'default' : 'secondary'}
                          className={worker.statut === 'ACTIF' ? 'bg-blue-50 text-blue-700 hover:bg-blue-50' : ''}
                        >
                          {worker.statut === 'ACTIF' ? (
                            <><UserCheck className="w-3 h-3 mr-1" /> Actif</>
                          ) : (
                            <><UserX className="w-3 h-3 mr-1" /> {worker.statut}</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                title="Générer bulletin de salaire"
                                onClick={() => handleGenerateBulletin(worker.id, `${worker.nom}_${worker.prenom}`)}
                              >
                                <FileText className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(worker)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(worker.id)}>
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
