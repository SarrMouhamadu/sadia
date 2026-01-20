import { useState } from 'react';
import { User, Mail, Shield, Key, Save, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { useAuthContext } from '../context/AuthContext';
import api from '../../services/api';

export function ProfilePage() {
    const { user } = useAuthContext();

    // Profile form state
    const [profileData, setProfileData] = useState({
        nom: user?.nom || '',
        prenom: user?.prenom || '',
        email: user?.email || ''
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Password form state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const roleLabels: Record<string, string> = {
        ADMIN: 'Administrateur',
        ASSISTANT: 'Assistant'
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMessage(null);

        try {
            const response = await api.put('/auth/me', profileData);
            if (response.data.success) {
                // Update user in localStorage
                const updatedUser = { ...user, ...profileData };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setProfileMessage({ type: 'success', text: 'Profil mis à jour avec succès' });
            }
        } catch (error: any) {
            setProfileMessage({
                type: 'error',
                text: error.response?.data?.message || 'Erreur lors de la mise à jour du profil'
            });
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        // Validation
        if (passwordData.newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
            return;
        }

        setPasswordLoading(true);

        try {
            const response = await api.put('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            if (response.data.success) {
                setPasswordMessage({ type: 'success', text: 'Mot de passe modifié avec succès' });
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error: any) {
            setPasswordMessage({
                type: 'error',
                text: error.response?.data?.message || 'Erreur lors du changement de mot de passe'
            });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl text-gray-900 mb-2">Mon profil</h1>
                <p className="text-gray-600">Gérez vos informations personnelles et votre sécurité</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Info Card */}
                <Card className="lg:col-span-1">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl font-bold text-emerald-700">
                                    {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
                                </span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">{user?.prenom} {user?.nom}</h3>
                            <p className="text-gray-500 mt-1">{user?.email}</p>
                            <Badge variant="outline" className="mt-3 bg-emerald-50 text-emerald-700 border-emerald-200">
                                {roleLabels[user?.role || 'ASSISTANT']}
                            </Badge>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                            <div className="flex items-center gap-3 text-gray-600">
                                <User className="w-5 h-5 text-gray-400" />
                                <span>{user?.prenom} {user?.nom}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600">
                                <Mail className="w-5 h-5 text-gray-400" />
                                <span>{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600">
                                <Shield className="w-5 h-5 text-gray-400" />
                                <span>{roleLabels[user?.role || 'ASSISTANT']}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Forms Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Update Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-emerald-600" />
                                Informations personnelles
                            </CardTitle>
                            <CardDescription>Mettez à jour vos informations de base</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="prenom">Prénom</Label>
                                        <Input
                                            id="prenom"
                                            value={profileData.prenom}
                                            onChange={(e) => setProfileData({ ...profileData, prenom: e.target.value })}
                                            placeholder="Votre prénom"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nom">Nom</Label>
                                        <Input
                                            id="nom"
                                            value={profileData.nom}
                                            onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })}
                                            placeholder="Votre nom"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        placeholder="votre@email.com"
                                    />
                                </div>

                                {profileMessage && (
                                    <div className={`flex items-center gap-2 p-3 rounded-lg ${profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                        }`}>
                                        {profileMessage.type === 'success' ? (
                                            <CheckCircle className="w-5 h-5" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5" />
                                        )}
                                        <span className="text-sm">{profileMessage.text}</span>
                                    </div>
                                )}

                                <Button type="submit" disabled={profileLoading} className="gap-2">
                                    {profileLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Enregistrer les modifications
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Password Change Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="w-5 h-5 text-orange-600" />
                                Changer le mot de passe
                            </CardTitle>
                            <CardDescription>Sécurisez votre compte avec un nouveau mot de passe</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                                    <div className="relative">
                                        <Input
                                            id="currentPassword"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500">Minimum 6 caractères</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {passwordMessage && (
                                    <div className={`flex items-center gap-2 p-3 rounded-lg ${passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                        }`}>
                                        {passwordMessage.type === 'success' ? (
                                            <CheckCircle className="w-5 h-5" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5" />
                                        )}
                                        <span className="text-sm">{passwordMessage.text}</span>
                                    </div>
                                )}

                                <Button type="submit" variant="outline" disabled={passwordLoading} className="gap-2">
                                    {passwordLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Key className="w-4 h-4" />
                                    )}
                                    Changer le mot de passe
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
