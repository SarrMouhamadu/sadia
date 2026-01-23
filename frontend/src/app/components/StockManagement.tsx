import { useState, useEffect } from 'react';
import { Search, AlertTriangle, ArrowDown, ArrowUp, Package as PackageIcon, Loader2, RefreshCw, Edit, Trash2, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';

import type { UserRole } from '../services/auth.service';
import { productService, type Category, type StockMovement } from '../../services/product.service';
import type { Product } from '../../types';

interface StockManagementProps {
  userRole: UserRole;
}

export function StockManagement({ userRole }: StockManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);

  // Product Dialog State
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Stock Entry/Exit Form Data
  const [formData, setFormData] = useState({
    product_id: '',
    quantite: '',
    source: '',
    destination: '',
    reference: '',
    notes: ''
  });

  // Category State
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({ nom: '', description: '' });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Product Form Data
  const [productFormData, setProductFormData] = useState({
    nom: '',
    category_id: '',
    unite: 'Unité',
    quantite_actuelle: '0',
    seuil_alerte: '5',
    code_produit: '',
    description: ''
  });

  // Filter State
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM


  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [productsData, categoriesData, movementsData] = await Promise.all([
        productService.getAll(),
        productService.getCategories(),
        productService.getMovements({ 
          startDate: selectedMonth ? `${selectedMonth}-01` : undefined,
          endDate: selectedMonth ? new Date(new Date(selectedMonth).getFullYear(), new Date(selectedMonth).getMonth() + 1, 0).toISOString().split('T')[0] : undefined,
          limit: 100 
        })
      ]);
      
      setProducts(productsData);
      setCategories(categoriesData);
      setMovements(movementsData);
    } catch (err: any) {
      console.error('Error loading stock data:', err);
      console.error('Error details:', err.response?.status, err.response?.data);
      const errorMessage = err.response?.data?.message
        || err.message
        || 'Impossible de charger les données de stock.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      quantite: '',
      source: '',
      destination: '',
      reference: '',
      notes: ''
    });
  };

  const resetProductForm = () => {
    setProductFormData({
      nom: '',
      category_id: '',
      unite: 'Unité',
      quantite_actuelle: '0',
      seuil_alerte: '5',
      code_produit: '',
      description: ''
    });
    setEditingProduct(null);
  };

  const handeOpenProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductFormData({
        nom: product.nom,
        category_id: product.category_id || '',
        unite: product.unite,
        quantite_actuelle: product.quantite_actuelle?.toString() || '0',
        seuil_alerte: product.seuil_alerte.toString(),
        code_produit: product.code_produit || '',
        description: product.description || ''
      });
    } else {
      resetProductForm();
    }
    setIsProductDialogOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload: any = {
        ...productFormData,
        quantite_actuelle: Number(productFormData.quantite_actuelle),
        seuil_alerte: Number(productFormData.seuil_alerte),
      };

      // Handle empty code_produit
      if (!payload.code_produit) delete payload.code_produit;
      // Handle empty category_id
      if (!payload.category_id) delete payload.category_id;

      if (editingProduct) {
        await productService.update(editingProduct.id, payload);
      } else {
        await productService.create(payload);
      }

      await loadData();
      setIsProductDialogOpen(false);
      resetProductForm();
    } catch (err: any) {
      console.error('Error saving product:', err);
      alert(err.response?.data?.message || "Erreur lors de l'enregistrement du produit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await productService.recordEntry({
        product_id: formData.product_id,
        quantite: Number(formData.quantite),
        source: formData.source,
        notes: formData.notes
      });

      await loadData(); // Reload to get updated quantities and history
      setIsEntryDialogOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Error recording entry:', err);
      alert(err.response?.data?.message || "Erreur lors de l'entrée de stock");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockExit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation côté frontend
    if (!formData.product_id) {
      alert('Veuillez sélectionner un produit');
      return;
    }
    if (!formData.quantite || Number(formData.quantite) <= 0) {
      alert('Veuillez entrer une quantité valide');
      return;
    }
    if (!formData.destination || formData.destination.trim() === '') {
      alert('La destination est obligatoire');
      return;
    }

    try {
      setSubmitting(true);
      await productService.recordExit({
        product_id: formData.product_id,
        quantite: Number(formData.quantite),
        destination: formData.destination.trim(),
        notes: formData.notes
      });

      await loadData();
      setIsExitDialogOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Error recording exit:', err);
      alert(err.response?.data?.message || "Erreur lors de la sortie de stock");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        setSubmitting(true);
        if (editingCategory) {
            await productService.updateCategory(editingCategory.id, categoryFormData);
        } else {
            await productService.createCategory(categoryFormData);
        }
        await loadData();
        setCategoryFormData({ nom: '', description: '' });
        setEditingCategory(null);
        // Don't close dialog, just reset form to allow adding more or see list
    } catch (err: any) {
        console.error('Error saving category:', err);
        alert(err.response?.data?.message || "Erreur lors de l'enregistrement de la catégorie");
    } finally {
        setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
        try {
            await productService.deleteCategory(id);
            await loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || "Erreur lors de la suppression");
        }
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        setSubmitting(true);
        const stats = await productService.importProducts(file);
        alert(`Import terminé !\nTotal: ${stats.total}\nCréés: ${stats.created}\nMis à jour: ${stats.updated}\nErreurs: ${stats.errors.length}`);
        if (stats.errors.length > 0) {
            console.error('Import errors:', stats.errors);
            alert('Certaines erreurs sont survenues, consultez la console pour les détails.');
        }
        await loadData();
    } catch (err: any) {
        console.error('Import error:', err);
        alert(err.response?.data?.message || "Erreur lors de l'importation");
    } finally {
        setSubmitting(false);
        // Reset input
        e.target.value = '';
    }
  };

  const filteredProducts = products.filter(product =>
    product.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.code_produit || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category?.nom || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const alertProducts = products.filter(p => p.statut === 'ALERTE' || p.statut === 'RUPTURE');
  const canManage = userRole === 'ADMIN' || userRole === 'ASSISTANT';

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <Loader2 className="animate-spin w-8 h-8 text-emerald-600" />
        <p className="text-gray-500">Chargement du stock...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 mb-4">{error}</p>
        <Button onClick={loadData} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Gestion des stocks</h1>
          <p className="text-gray-600">Suivez vos produits et équipements de nettoyage</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button onClick={() => handeOpenProductDialog()} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <PackageIcon className="w-4 h-4" />
              Nouveau Produit
            </Button>

            <div className="relative">
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={submitting}
                />
                <Button variant="outline" className="gap-2" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-blue-600" />}
                    Import Excel
                </Button>
            </div>
            
            <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => { setIsCategoryDialogOpen(open); if (!open) { setEditingCategory(null); setCategoryFormData({ nom: '', description: '' }); } }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                   Gérer Catégories
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Gestion des Catégories</DialogTitle>
                  <DialogDescription>Ajouter ou modifier des catégories de produits</DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCategorySubmit} className="space-y-4 border-b pb-4 mb-4">
                    <div className="space-y-2">
                        <Label htmlFor="cat-nom">Nom de la catégorie</Label>
                        <div className="flex gap-2">
                            <Input 
                                id="cat-nom" 
                                value={categoryFormData.nom} 
                                onChange={(e) => setCategoryFormData({...categoryFormData, nom: e.target.value})}
                                placeholder="Ex: Détergents"
                                required
                            />
                            <Button type="submit" disabled={submitting} size="sm" className="bg-emerald-600">
                                {editingCategory ? 'Modifier' : 'Ajouter'}
                            </Button>
                        </div>
                    </div>
                </form>

                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-500">Catégories existantes</h4>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                <span>{cat.nom} ({cat.productCount || 0})</span>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingCategory(cat); setCategoryFormData({ nom: cat.nom, description: cat.description || '' }); }}>
                                        <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => handleDeleteCategory(cat.id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isProductDialogOpen} onOpenChange={(open) => { setIsProductDialogOpen(open); if (!open) resetProductForm(); }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'Modifier le produit' : 'Nouveau Produit'}</DialogTitle>
                  <DialogDescription>
                    {editingProduct ? 'Modifier les informations du produit' : 'Ajouter un nouveau produit au catalogue'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nom">Nom du produit</Label>
                    <Input
                      id="nom"
                      value={productFormData.nom}
                      onChange={(e) => setProductFormData({ ...productFormData, nom: e.target.value })}
                      placeholder="Ex: Désinfectant Sol"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Catégorie</Label>
                      <Select
                        value={productFormData.category_id}
                        onValueChange={(val) => setProductFormData({ ...productFormData, category_id: val })}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Catégorie" />
                        </SelectTrigger>
                        <SelectContent className="z-[200] bg-white">
                          {categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="unite">Unité</Label>
                      <Select
                        value={productFormData.unite}
                        onValueChange={(val) => setProductFormData({ ...productFormData, unite: val })}
                      >
                        <SelectTrigger id="unite">
                          <SelectValue placeholder="Unité" />
                        </SelectTrigger>
                        <SelectContent className="z-[200] bg-white">
                          <SelectItem value="Unité">Unité</SelectItem>
                          <SelectItem value="Litre">Litre</SelectItem>
                          <SelectItem value="Kg">Kg</SelectItem>
                          <SelectItem value="Boite">Boite</SelectItem>
                          <SelectItem value="Paquet">Paquet</SelectItem>
                          <SelectItem value="Flacon">Flacon</SelectItem>
                          <SelectItem value="Rouleau">Rouleau</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantite">Quantité initiale</Label>
                      <Input
                        id="quantite"
                        type="number"
                        min="0"
                        value={productFormData.quantite_actuelle}
                        onChange={(e) => setProductFormData({ ...productFormData, quantite_actuelle: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="seuil">Seuil d'alerte</Label>
                      <Input
                        id="seuil"
                        type="number"
                        value={productFormData.seuil_alerte}
                        onChange={(e) => setProductFormData({ ...productFormData, seuil_alerte: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="desc">Description</Label>
                    <Textarea
                      id="desc"
                      value={productFormData.description}
                      onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                      placeholder="Description du produit..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsProductDialogOpen(false)} disabled={submitting}>
                      Annuler
                    </Button>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingProduct ? 'Mettre à jour' : 'Créer'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isEntryDialogOpen} onOpenChange={(open) => { setIsEntryDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <ArrowDown className="w-4 h-4 text-emerald-600" />
                  Entrée
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enregistrer une entrée de stock</DialogTitle>
                  <DialogDescription>
                    Ajouter des produits au stock existant
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleStockEntry} className="space-y-4">
                  <div>
                    <Label htmlFor="entry-product">Produit</Label>
                    <Select
                      value={formData.product_id}
                      onValueChange={(val) => setFormData({ ...formData, product_id: val })}
                    >
                      <SelectTrigger id="entry-product">
                        <SelectValue placeholder="Sélectionner un produit" />
                      </SelectTrigger>
                      <SelectContent className="z-[200] bg-white max-h-64">
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nom} (Stock: {p.quantite_actuelle})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="entry-quantity">Quantité ({products.find(p => p.id === formData.product_id)?.unite || ''})</Label>
                    <Input
                      id="entry-quantity"
                      type="number"
                      placeholder="Ex: 10"
                      required
                      min="0.01"
                      step="0.01"
                      value={formData.quantite}
                      onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="entry-source">Source / Fournisseur</Label>
                    <Input
                      id="entry-source"
                      placeholder="Ex: Supermarché X"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="entry-notes">Notes</Label>
                    <Textarea
                      id="entry-notes"
                      placeholder="Informations supplémentaires..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsEntryDialogOpen(false)} disabled={submitting}>
                      Annuler
                    </Button>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Enregistrer
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isExitDialogOpen} onOpenChange={(open) => { setIsExitDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <ArrowUp className="w-4 h-4 text-orange-600" />
                  Sortie
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enregistrer une sortie de stock</DialogTitle>
                  <DialogDescription>
                    Sortir des produits pour utilisation
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleStockExit} className="space-y-4">
                  <div>
                    <Label htmlFor="exit-product">Produit</Label>
                    <Select
                      value={formData.product_id}
                      onValueChange={(val) => setFormData({ ...formData, product_id: val })}
                    >
                      <SelectTrigger id="exit-product">
                        <SelectValue placeholder="Sélectionner un produit" />
                      </SelectTrigger>
                      <SelectContent className="z-[200] bg-white max-h-64">
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nom} (Stock: {p.quantite_actuelle})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="exit-quantity">Quantité ({products.find(p => p.id === formData.product_id)?.unite || ''})</Label>
                    <Input
                      id="exit-quantity"
                      type="number"
                      placeholder="Ex: 5"
                      required
                      min="0.01"
                      step="0.01"
                      value={formData.quantite}
                      onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="exit-destination">Destination / Lieu</Label>
                    <Input
                      id="exit-destination"
                      placeholder="Ex: Bureau Central"
                      required
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="exit-notes">Notes</Label>
                    <Textarea
                      id="exit-notes"
                      placeholder="Motif de la sortie..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsExitDialogOpen(false)} disabled={submitting}>
                      Annuler
                    </Button>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Enregistrer
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Alert Cards */}
      {alertProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="w-5 h-5" />
              {alertProducts.length} produit{alertProducts.length > 1 ? 's' : ''} en alerte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {alertProducts.map(product => (
                <div key={product.id} className="bg-white p-4 rounded-lg border border-orange-200">
                  <p className="text-sm text-gray-900 mb-1">{product.nom}</p>
                  <p className="text-xs text-gray-600">
                    Stock actuel: {product.quantite_actuelle} {product.unite} / Seuil: {product.seuil_alerte}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventaire</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inventaire des produits</CardTitle>
                  <CardDescription>
                    {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} en stock
                  </CardDescription>
                </div>
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un produit..."
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
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Quantité actuelle</TableHead>
                    <TableHead>Seuil d'alerte</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière MAJ</TableHead>
                    {canManage && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                        Aucun produit trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const isLow = product.quantite_actuelle <= product.seuil_alerte;
                      const isCritical = product.quantite_actuelle <= 0;

                      return (
                        <TableRow key={product.id} className={canManage ? "cursor-pointer hover:bg-gray-50" : ""} onClick={() => canManage && handeOpenProductDialog(product)}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <PackageIcon className="w-4 h-4 text-gray-400" />
                              {product.nom}
                            </div>
                          </TableCell>
                          <TableCell>{product.category?.nom || '-'}</TableCell>
                          <TableCell>
                            <span className={isLow ? 'text-orange-600' : ''}>
                              {product.quantite_actuelle} {product.unite}
                            </span>
                          </TableCell>
                          <TableCell>{product.seuil_alerte} {product.unite}</TableCell>
                          <TableCell>
                            <Badge
                              variant={isCritical ? 'destructive' : isLow ? 'outline' : 'default'}
                              className={
                                !isCritical && isLow ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  !isLow ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''
                              }
                            >
                              {product.statut}
                            </Badge>
                          </TableCell>
                          <TableCell>{product.derniere_maj ? new Date(product.derniere_maj).toLocaleDateString('fr-FR') : '-'}</TableCell>
                          {canManage && (
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handeOpenProductDialog(product); }}>Modifier</Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des mouvements</CardTitle>
              <CardDescription>Entrées et sorties de stock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                 <div className="flex items-center gap-2">
                    <Label htmlFor="month-filter">Filtrer par mois :</Label>
                    <Input 
                        id="month-filter"
                        type="month" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-40"
                    />
                 </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Source / Destination</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map(m => (
                    <TableRow key={m.id}>
                      <TableCell>{new Date(m.created_at).toLocaleDateString()} {new Date(m.created_at).toLocaleTimeString()}</TableCell>
                      <TableCell>
                        <Badge variant={m.type === 'ENTREE' ? 'default' : 'secondary'} className={m.type === 'ENTREE' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}>
                          {m.type === 'ENTREE' ? 'Entrée' : 'Sortie'}
                        </Badge>
                      </TableCell>
                      <TableCell>{m.product?.nom || 'Produit supprimé'}</TableCell>
                      <TableCell className="font-medium">
                        {m.type === 'ENTREE' ? '+' : '-'}{m.quantite}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {m.type === 'ENTREE' ? m.source : m.destination}
                      </TableCell>
                    </TableRow>
                  ))}
                  {movements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-500">Aucun mouvement enregistré</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
