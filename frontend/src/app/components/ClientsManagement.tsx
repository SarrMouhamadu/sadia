import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';


import type { UserRole } from '../services/auth.service';
import { clientService, type Client } from '../../services/client.service';

interface ClientsManagementProps {
  userRole: UserRole;
}

export function ClientsManagement({ userRole }: ClientsManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [editingClient, setEditingClient] = useState<Client | null>(null);


  const [formData, setFormData] = useState<Partial<Client>>({
    nom: '',
    adresse: '',
    telephone: '',
    email: '',
    type_contrat: '',
    prix_contrat: 0,
    statut: 'EN_COURS'
  });

  const loadClients = async () => {
    try {
      const data = await clientService.getAll();
      setClients(data);
    } catch (e) {
      console.error("Failed to load clients", e);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        prix_contrat: isNaN(Number(formData.prix_contrat)) ? 0 : Number(formData.prix_contrat),
        email: formData.email === '' ? undefined : formData.email,
        telephone: formData.telephone === '' ? undefined : formData.telephone,
        adresse: formData.adresse === '' ? undefined : formData.adresse,
        type_contrat: formData.type_contrat === '' ? undefined : formData.type_contrat,
      };

      if (editingClient) {
        await clientService.update(editingClient.id, payload);
        alert("Client modifié avec succès");
      } else {
        await clientService.create(payload);
        alert("Client créé avec succès");
      }
      setIsDialogOpen(false);
      setEditingClient(null);
      setFormData({
        nom: '',
        adresse: '',
        telephone: '',
        email: '',
        type_contrat: '',
        prix_contrat: 0,
        statut: 'EN_COURS'
      });
      loadClients();
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || error.message || "Erreur lors de l'opération";
      alert(`Erreur: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      nom: client.nom,
      adresse: client.adresse || '',
      telephone: client.telephone || '',
      email: client.email || '',
      type_contrat: client.type_contrat || '',
      prix_contrat: client.prix_contrat,
      statut: client.statut
    });
    setIsDialogOpen(true);
  };


  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      try {
        await clientService.delete(id);
        loadClients();
      } catch (e) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleGenerateReceipt = async (id: string, name: string) => {
    try {
      const blob = await clientService.generateReceipt(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recu_${name}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      alert("Erreur lors de la génération du reçu");
      console.error(e);
    }
  };

  const onOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingClient(null);
      setFormData({
        nom: '',
        adresse: '',
        telephone: '',
        email: '',
        type_contrat: '',
        prix_contrat: 0,
        statut: 'EN_COURS'
      });
    }
  }

  const filteredClients = clients.filter(client =>
    client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.adresse?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = userRole === 'ADMIN';

  // Format currency FCFA
  const formatFCFA = (amount: number) => {
    if (isNaN(amount) || amount == null) return '0 FCFA';
    return amount.toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + ' FCFA';
  };

  // Dashboard totals
  const totalAverser = clients.reduce((sum, c) => sum + (parseFloat(c.prix_contrat?.toString() || '0')), 0);
  const totalVerse = clients.reduce((sum, c) => sum + (parseFloat(c.montant_paye?.toString() || '0')), 0);
  const totalRestant = Math.max(totalAverser - totalVerse, 0);

  // Optimistic toggle for payment status
  const handleTogglePayment = async (client: Client) => {
    try {
      await clientService.togglePaymentStatus(client);
      // Update local state instantly for UX
      setClients(prev => prev.map(c =>
        c.id === client.id
          ? { ...c, montant_paye: (c.montant_paye ?? 0) >= (c.prix_contrat ?? 0) ? 0 : c.prix_contrat }
          : c
      ));
      // Reload from server to be sure
      await loadClients();
    } catch (error) {
      console.error("Failed to toggle payment status", error);
      alert("Erreur lors de la mise à jour du paiement");
    }
  };

  return (
    <div className="space-y-6">
      {/* DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-blue-50 rounded-lg text-center">
          <p className="text-lg font-bold text-blue-700">{formatFCFA(totalAverser)}</p>
          <p className="text-sm text-blue-600">Total à verser</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-lg text-center">
          <p className="text-lg font-bold text-emerald-700">{formatFCFA(totalVerse)}</p>
          <p className="text-sm text-emerald-600">Total versé</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg text-center">
          <p className="text-lg font-bold text-orange-700">{formatFCFA(totalRestant)}</p>
          <p className="text-sm text-orange-600">Total restant</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Gestion des Clients</h1>
          <p className="text-gray-600">Gérez votre portefeuille clients</p>
        </div>
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingClient ? 'Modifier le client' : 'Ajouter un nouveau client'}</DialogTitle>
                <DialogDescription>
                  Saisissez les informations du client
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom / Entreprise</Label>
                    <Input
                      id="name"
                      value={formData.nom}
                      onChange={e => setFormData({ ...formData, nom: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="serviceType">Type de service</Label>
                    <Input
                      id="serviceType"
                      value={formData.type_contrat}
                      onChange={e => setFormData({ ...formData, type_contrat: e.target.value })}
                      required
                      placeholder="Ex: Nettoyage Bureaux"
                    />
                  </div>
                  <div>
                    <Label htmlFor="montant">Montant à payer (FCFA)</Label>
                    <Input
                      id="montant"
                      type="number"
                      value={formData.prix_contrat}
                      onChange={e => {
                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        setFormData({ ...formData, prix_contrat: val });
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="statut">Statut</Label>
                    <Select
                      value={formData.statut}
                      onValueChange={(val: any) => setFormData({ ...formData, statut: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Changer le statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EN_COURS">En cours</SelectItem>
                        <SelectItem value="TERMINE">Terminé</SelectItem>
                        <SelectItem value="SUSPENDU">Suspendu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={formData.telephone}
                      onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                      placeholder="33..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@client.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.adresse}
                    onChange={e => setFormData({ ...formData, adresse: e.target.value })}
                    placeholder="Adresse complète"
                  />
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des clients</CardTitle>
              <CardDescription>
                {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} au total
              </CardDescription>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Payé</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Aucun client trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <div>{client.nom}</div>
                      <div className="text-xs text-gray-500">{client.adresse}</div>
                    </TableCell>
                    <TableCell>{client.type_contrat}</TableCell>
                    <TableCell className="font-bold">{parseInt(client.prix_contrat?.toString() || '0').toLocaleString()} FCFA</TableCell>
                    <TableCell className={`font-bold ${(client.montant_paye ?? 0) >= (client.prix_contrat ?? 0) ? 'text-green-600' : 'text-orange-600'}`}>
                      {canEdit && (
                        <Button
                          size="sm"
                          variant={(client.montant_paye ?? 0) >= (client.prix_contrat ?? 0) ? 'default' : 'outline'}
                          className={`ml-2 ${((client.montant_paye ?? 0) >= (client.prix_contrat ?? 0)) ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}
                          onClick={() => handleTogglePayment(client)}
                        >
                          {((client.montant_paye ?? 0) >= (client.prix_contrat ?? 0)) ? 'Payé' : 'Non payé'}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{client.telephone}</div>
                        <div className="text-gray-500">{client.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={client.statut === 'EN_COURS' ? 'default' : 'secondary'}
                        className={client.statut === 'EN_COURS' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                      >
                        {client.statut === 'EN_COURS' ? (
                          <><UserCheck className="w-3 h-3 mr-1" /> Actif</>
                        ) : (
                          <><UserX className="w-3 h-3 mr-1" /> {client.statut}</>
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
                              title="Générer reçu"
                              onClick={() => handleGenerateReceipt(client.id, client.nom)}
                            >
                              <Download className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(client)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(client.id)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
