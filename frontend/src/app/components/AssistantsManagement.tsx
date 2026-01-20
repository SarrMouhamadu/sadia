import { useState, useEffect } from 'react';
import { Plus, Search, Mail, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

import { authService } from '../services/auth.service';
import type { UserRole, User } from '../services/auth.service';

interface AssistantsManagementProps {
  userRole: UserRole;
}

export function AssistantsManagement({ userRole }: AssistantsManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assistants, setAssistants] = useState<User[]>([]);
  
  const loadAssistants = async () => {
    try {
      const users = await authService.getUsers();
      // Filter only assistants
      const assistantsList = users.filter(u => u.role === 'ASSISTANT');
      setAssistants(assistantsList);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAssistants();
  }, []);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    adminSecretKey: '' // Not needed for creating assistant as admin, but type might require it? No, authService generic register needs it for ADMIN creation.
  });

  const [successMessage, setSuccessMessage] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    try {
      const res = await authService.createAssistant({
        ...formData,
        telephone: '', // Not used by backend
        role: 'assistant'
      });
      
      if (res.success) {
        setIsDialogOpen(false);
        setSuccessMessage('Assistant créé avec succès !');
        setTimeout(() => setSuccessMessage(''), 3000);

        setFormData({
            nom: '',
            prenom: '',
            email: '',
            motDePasse: '',
            adminSecretKey: ''
        });
        await loadAssistants(); // Ensure list is reloaded
      } else {
        // Show validation error details if available
        const errorMsg = res.error || res.message || "Erreur lors de la création";
        alert(errorMsg); 
      }
    } catch (error) {
      alert("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const filteredAssistants = assistants.filter(a => 
    a.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg flex items-center justify-between animate-fade-in border border-emerald-200">
            <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                {successMessage}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setSuccessMessage('')} className="h-6 w-6 p-0 hover:bg-emerald-100 text-emerald-700">
                ✕
            </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Gestion des assistants</h1>
          <p className="text-gray-600">Gérez les comptes d'accès pour vos assistants</p>
        </div>
        
        {/* Only Admin can create assistants */}
        {(userRole === 'ADMIN' || userRole.toUpperCase() === 'ADMIN' /* Safer check */) && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                <Plus className="w-4 h-4" />
                Nouvel Assistant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un compte assistant</DialogTitle>
                <DialogDescription>
                  Cet utilisateur aura accès à tout sauf la gestion des clients et assistants.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input 
                      id="prenom" 
                      placeholder="Prénom" 
                      value={formData.prenom}
                      onChange={e => setFormData({...formData, prenom: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input 
                      id="nom" 
                      placeholder="Nom"
                      value={formData.nom}
                      onChange={e => setFormData({...formData, nom: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="email@salihate.sn" 
                      className="pl-9"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {/* Telephone removed as backend User model does not support it */}

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe provisoire</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      id="password" 
                      type="password"
                      placeholder="••••••••" 
                      className="pl-9"
                      value={formData.motDePasse}
                      onChange={e => setFormData({...formData, motDePasse: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                    {loading ? 'Création...' : 'Créer le compte'}
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
              <CardTitle>Liste des assistants</CardTitle>
              <CardDescription>
                {filteredAssistants.length} compte{filteredAssistants.length > 1 ? 's' : ''} actif{filteredAssistants.length > 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Rechercher un assistant..." 
                className="pl-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
             <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssistants.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            Aucun assistant trouvé.
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredAssistants.map(assistant => (
                    <TableRow key={assistant.id}>
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                            {assistant.prenom?.[0] || '?'}{assistant.nom?.[0] || '?'}
                            </div>
                            <div>
                            <div className="font-medium">{assistant.prenom} {assistant.nom}</div>
                            <div className="text-sm text-gray-500">{assistant.role}</div>
                            </div>
                        </div>
                        </TableCell>
                        <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {assistant.email}
                        </div>
                        </TableCell>
                        <TableCell>
                        <Badge className={`${assistant.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} border-none`}>
                            {assistant.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500">
                        {assistant.created_at ? new Date(assistant.created_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                            Éditer
                        </Button>
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
