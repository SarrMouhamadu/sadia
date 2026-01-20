import { useState, useEffect } from 'react';
import { Users, Wallet, Package, Building2, AlertTriangle, CheckCircle, Loader2, RefreshCw, PackagePlus, PackageMinus, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { dashboardService, type DashboardStats, type RecentActivity } from '../../services/dashboard.service';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsData, activitiesData] = await Promise.all([
        dashboardService.getStats(currentMonth, currentYear),
        dashboardService.getRecentActivities(10)
      ]);
      setStats(statsData);
      setActivities(activitiesData);
    } catch (err: any) {
      console.error('Error loading dashboard stats:', err);
      setError(err.response?.data?.message || 'Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const getActivityIcon = (activity: RecentActivity) => {
    switch (activity.type) {
      case 'STOCK_IN':
        return <PackagePlus className="w-5 h-5 text-emerald-600" />;
      case 'STOCK_OUT':
        return <PackageMinus className="w-5 h-5 text-orange-600" />;
      case 'SALARY_PAYMENT':
        return <Wallet className="w-5 h-5 text-blue-600" />;
      case 'CLIENT_PAYMENT':
        return <Building2 className="w-5 h-5 text-purple-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActivityBgColor = (activity: RecentActivity) => {
    switch (activity.color) {
      case 'emerald':
        return 'bg-emerald-50';
      case 'orange':
        return 'bg-orange-50';
      case 'blue':
        return 'bg-blue-50';
      case 'purple':
        return 'bg-purple-50';
      default:
        return 'bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <Loader2 className="animate-spin w-8 h-8 text-emerald-600" />
        <p className="text-gray-500">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 mb-4">{error}</p>
        <Button onClick={loadStats} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Travailleurs actifs',
      value: stats.workers.actifs.toString(),
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      trend: `${stats.workers.total} au total`
    },
    {
      title: 'Salaires du mois',
      value: formatCurrency(stats.salaries.total),
      icon: Wallet,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      trend: `${stats.salaries.enAttente} en attente`
    },
    {
      title: 'Produits en stock',
      value: stats.stock.totalProducts.toString(),
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      trend: `${stats.stock.alertes + stats.stock.ruptures} alertes`
    },
    ...(stats.clients ? [{
      title: 'Clients actifs',
      value: stats.clients.enCours.toString(),
      icon: Building2,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      trend: `${stats.clients.total} au total`
    }] : [])
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Tableau de bord</h1>
          <p className="text-gray-600">Vue d'ensemble de votre activité - {monthNames[currentMonth - 1]} {currentYear}</p>
        </div>
        <Button onClick={loadStats} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-xl text-gray-900 mb-2">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.trend}</p>
                  </div>
                  <div className={`${stat.bg} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Alertes de stock
            </CardTitle>
            <CardDescription>Produits nécessitant un réapprovisionnement</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.alertProducts && stats.alertProducts.length > 0 ? (
              <div className="space-y-4">
                {stats.alertProducts.map((product) => (
                  <div key={product.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{product.nom}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Quantité: {product.quantite_actuelle} / Seuil: {product.seuil_alerte}
                        </p>
                      </div>
                      <Badge
                        variant={product.statut === 'RUPTURE' ? 'destructive' : 'outline'}
                        className={product.statut === 'ALERTE' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                      >
                        {product.statut === 'RUPTURE' ? 'Rupture' : 'Alerte'}
                      </Badge>
                    </div>
                    <Progress
                      value={Math.min((product.quantite_actuelle / product.seuil_alerte) * 100, 100)}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <p>Aucune alerte de stock</p>
                <p className="text-sm">Tous les produits sont à niveau</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Salary Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              Résumé des salaires
            </CardTitle>
            <CardDescription>{monthNames[currentMonth - 1]} {currentYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Total à payer</span>
                <span className="font-semibold text-gray-900">{formatCurrency(stats.salaries.total)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                <span className="text-sm text-emerald-700">Déjà payé</span>
                <span className="font-semibold text-emerald-700">{formatCurrency(stats.salaries.paye)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-sm text-orange-700">Restant à payer</span>
                <span className="font-semibold text-orange-700">{formatCurrency(stats.salaries.restant)}</span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Progression des paiements</span>
                  <span>{stats.salaries.total > 0 ? Math.round((stats.salaries.paye / stats.salaries.total) * 100) : 0}%</span>
                </div>
                <Progress
                  value={stats.salaries.total > 0 ? (stats.salaries.paye / stats.salaries.total) * 100 : 0}
                  className="h-3"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Summary (Admin only) */}
      {stats.clients && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Résumé des contrats clients
            </CardTitle>
            <CardDescription>Vue d'ensemble des paiements clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-700">{stats.clients.total}</p>
                <p className="text-sm text-blue-600">Clients total</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-lg font-bold text-gray-700">{formatCurrency(stats.clients.totalContrats)}</p>
                <p className="text-sm text-gray-600">Valeur des contrats</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg text-center">
                <p className="text-lg font-bold text-emerald-700">{formatCurrency(stats.clients.totalPaye)}</p>
                <p className="text-sm text-emerald-600">Montant reçu</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <p className="text-lg font-bold text-orange-700">{formatCurrency(stats.clients.totalDu)}</p>
                <p className="text-sm text-orange-600">Montant dû</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            Activités récentes
          </CardTitle>
          <CardDescription>Dernières actions effectuées dans le système</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className={`p-2 rounded-lg ${getActivityBgColor(activity)}`}>
                    {getActivityIcon(activity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      {activity.type === 'STOCK_IN' && (
                        <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                      )}
                      {activity.type === 'STOCK_OUT' && (
                        <ArrowUpRight className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{activity.details}</span>
                      {activity.user && (
                        <>
                          <span className="text-xs text-gray-300">•</span>
                          <span className="text-xs text-gray-500">par {activity.user}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.amount !== null && (
                      <p className={`text-sm font-semibold ${activity.type === 'STOCK_OUT' ? 'text-orange-600' :
                          activity.type === 'CLIENT_PAYMENT' ? 'text-purple-600' : 'text-emerald-600'
                        }`}>
                        {formatCurrency(activity.amount)}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(activity.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Aucune activité récente</p>
              <p className="text-sm">Les dernières actions apparaîtront ici</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
