import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Phone, AlertCircle, Loader2, PlayCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { useAuthContext } from '../context/AuthContext';
import { authService } from '../services/auth.service';

export function LoginPage() {
  const { login } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot-password'>('login');

  // États UI
  const [showPassword, setShowPassword] = useState(false);
  
  // États LOGIN
  const [loginData, setLoginData] = useState({
    identifiant: '',
    motDePasse: ''
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // États REGISTER
  const [registerData, setRegisterData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    motDePasse: '',
    confirmPassword: '',
    role: 'worker', // Default to assistant/worker
    adminSecretKey: ''
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [isValidPhone, setIsValidPhone] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // VALIDATION TÉLÉPHONE
  const handlePhoneChange = (value: string) => {
    setRegisterData(prev => ({ ...prev, telephone: value }));
    const phoneRegex = /^(77|76|70|78)\d{7}$/;
    setIsValidPhone(phoneRegex.test(value.replace(/\s/g, '')) || value === '');
  };

  // GESTION LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginData.identifiant || !loginData.motDePasse) {
      setLoginError('Tous les champs sont requis');
      return;
    }

    setLoginLoading(true);

    try {
      const result = await login(loginData);
      
      if (!result.success) {
        setLoginError(result.error || 'Erreur de connexion');
      }
      // Si success, le state user changera dans AuthContext et App.tsx re-rendera le contenu principal
    } catch (error: any) {
      setLoginError('Erreur inattendue');
    } finally {
      setLoginLoading(false);
    }
  };

  // GESTION REGISTER
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess(false);

    if (!registerData.nom || !registerData.prenom || !registerData.email || 
        !registerData.telephone || !registerData.motDePasse || !registerData.confirmPassword) {
      setRegisterError('Tous les champs obligatoires doivent être remplis');
      return;
    }

    if (!isValidPhone) {
      setRegisterError('Numéro de téléphone invalide');
      return;
    }

    if (registerData.motDePasse !== registerData.confirmPassword) {
      setRegisterError('Les mots de passe ne correspondent pas');
      return;
    }

    if (registerData.motDePasse.length < 6) {
      setRegisterError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!acceptTerms) {
      setRegisterError('Vous devez accepter les conditions d\'utilisation');
      return;
    }

    setRegisterLoading(true);

    try {
        const response = await authService.register(registerData);

      if (response.success) {
        setRegisterSuccess(true);
        setRegisterError('');
        
        setRegisterData({
          nom: '',
          prenom: '',
          email: '',
          telephone: '',
          motDePasse: '',
          confirmPassword: '',
          role: 'worker',
          adminSecretKey: ''
        });
        setAcceptTerms(false);

        setTimeout(() => {
          setActiveTab('login');
          setRegisterSuccess(false);
        }, 2000);
      } else {
        setRegisterError(response.message || response.error || 'Erreur lors de l\'inscription');
      }
    } catch (error: any) {
      setRegisterError('Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Gradient Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-emerald-800 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg text-emerald-600 font-bold text-2xl">
              SC
            </div>
            <span className="font-bold text-3xl text-white">
              Salihate Clean
            </span>
          </div>
          
          <h2 className="text-3xl font-bold mb-4 text-white">
            Votre solution de gestion professionnelle
          </h2>
          
          <p className="text-lg text-emerald-50 mb-8">
            Gérez vos équipes, salaires, stocks et clients en toute simplicité avec notre plateforme tout-en-un.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <PlayCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white">Tableau de bord intuitif</div>
                <div className="text-emerald-100 text-sm">Vue d'ensemble de votre activité</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white">Gestion complète</div>
                <div className="text-emerald-100 text-sm">RH, Paie, Inventaire centralisés</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white">Sécurisé et fiable</div>
                <div className="text-emerald-100 text-sm">Vos données d'entreprise protégées</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
              <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl text-white font-bold">SC</span>
              </div>
              <span className="font-bold text-2xl text-emerald-900">
                Salihate Clean
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bienvenue
            </h1>
            <p className="text-gray-600">
              {activeTab === 'login' ? 'Connectez-vous à votre espace' : activeTab === 'register' ? 'Créez votre compte pour commencer' : 'Récupération de mot de passe'}
            </p>
          </div>

          {/* Custom Tabs Navigation - Hide if forgot password */}
          {activeTab !== 'forgot-password' && (
            <div className="relative bg-gray-200 rounded-xl p-1 shadow-sm mb-8">
              <div
                className={`
                  absolute top-1 bottom-1 w-[calc(50%-4px)] 
                  bg-white rounded-lg shadow-md
                  transition-all duration-300 ease-out
                  ${activeTab === 'login' ? 'left-1' : 'left-[calc(50%+2px)]'}
                `}
              />
              <div className="relative grid grid-cols-2 gap-1">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`
                    relative z-10 px-6 py-3 rounded-lg font-semibold 
                    transition-colors duration-300
                    ${activeTab === 'login'
                      ? 'text-emerald-700'
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  Connexion
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`
                    relative z-10 px-6 py-3 rounded-lg font-semibold 
                    transition-colors duration-300
                    ${activeTab === 'register'
                      ? 'text-emerald-700'
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  Inscription
                </button>
              </div>
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
              <form onSubmit={handleLogin} className="space-y-5">
                {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{loginError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="login-identifiant" className="text-gray-700 font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="login-identifiant"
                      type="text"
                      placeholder="admin@salihate.sn"
                      value={loginData.identifiant}
                      onChange={(e) => setLoginData(prev => ({ ...prev, identifiant: e.target.value }))}
                      className="pl-10 h-12 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      disabled={loginLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-gray-700 font-medium">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginData.motDePasse}
                      onChange={(e) => setLoginData(prev => ({ ...prev, motDePasse: e.target.value }))}
                      className="pl-10 pr-10 h-12 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      disabled={loginLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={loginLoading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        <p>Admin: admin@salihate.sn / password</p>
                        <p>Assistant: assistant@salihate.sn / password</p>
                    </div>
                </div>

                 <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                    onClick={() => setActiveTab('forgot-password')}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <Button 
                  type="submit"
                  disabled={loginLoading}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
              <form onSubmit={handleRegister} className="space-y-5">
                {registerError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{registerError}</span>
                  </div>
                )}

                {registerSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    <span className="text-sm">Inscription réussie ! Redirection...</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-nom" className="text-gray-700 font-medium">
                      Nom <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="register-nom"
                        type="text"
                        placeholder="Ndiaye"
                        value={registerData.nom}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, nom: e.target.value }))}
                        className="pl-10 h-12 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                        disabled={registerLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-prenom" className="text-gray-700 font-medium">
                      Prénom <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="register-prenom"
                        type="text"
                        placeholder="Moussa"
                        value={registerData.prenom}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, prenom: e.target.value }))}
                        className="pl-10 h-12 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                        disabled={registerLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-phone" className="text-gray-700 font-medium">
                    Téléphone <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="77 123 4567"
                      value={registerData.telephone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={`
                        pl-10 h-12 border 
                        ${isValidPhone 
                          ? 'border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200' 
                          : 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red/20'
                        }
                      `}
                      disabled={registerLoading}
                    />
                  </div>
                  {!isValidPhone && registerData.telephone && (
                    <p className="text-sm text-red-600 mt-1">
                      Numéro invalide. Format: 77 123 4567
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-gray-700 font-medium">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="votre.email@exemple.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10 h-12 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      disabled={registerLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-gray-700 font-medium">
                      Mot de passe <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={registerData.motDePasse}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, motDePasse: e.target.value }))}
                        className="pl-10 pr-10 h-12 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                        disabled={registerLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm" className="text-gray-700 font-medium">
                      Confirmer <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="register-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="pl-10 h-12 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                        disabled={registerLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-admin-key" className="text-gray-700 font-medium">
                    Clé Secrète Admin (Optionnel)
                  </Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="register-admin-key"
                      type="password"
                      placeholder="Clé pour création compte Admin"
                      value={registerData.adminSecretKey || ''}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, adminSecretKey: e.target.value, role: e.target.value ? 'admin' : 'worker' }))}
                      className="pl-10 h-12 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      disabled={registerLoading}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Remplir uniquement pour créer un compte Administrateur.</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={acceptTerms}
                    onCheckedChange={(checked: boolean | 'indeterminate') => setAcceptTerms(checked === true)}
                    disabled={registerLoading}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-gray-600 cursor-pointer select-none"
                  >
                    J'accepte les{' '}
                    <button
                      type="button"
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      conditions d'utilisation
                    </button>
                  </label>
                </div>

                <Button 
                  type="submit"
                  disabled={registerLoading || !acceptTerms}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {registerLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Inscription...
                    </>
                  ) : (
                    registerData.adminSecretKey ? 'Créer un compte Admin' : 'Demander un compte Assistant'
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Forgot Password Form */}
          {activeTab === 'forgot-password' && (
             <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Mot de passe oublié ?</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Entrez votre email pour recevoir les instructions de réinitialisation.
                </p>
              </div>

               <form onSubmit={async (e) => {
                 e.preventDefault();
                 setLoginLoading(true);
                 setLoginError('');
                 try {
                    const res = await authService.resetPassword(loginData.identifiant);
                    if(res.success) {
                        alert(res.message);
                        setActiveTab('login');
                    }
                 } catch (error) {
                     setLoginError('Erreur lors de la demande.');
                 } finally {
                     setLoginLoading(false);
                 }
               }} className="space-y-5">
                 {loginError && (
                   <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                     <AlertCircle className="w-5 h-5 flex-shrink-0" />
                     <span className="text-sm">{loginError}</span>
                   </div>
                 )}
 
                 <div className="space-y-2">
                   <Label htmlFor="reset-email" className="text-gray-700 font-medium">
                     Email
                   </Label>
                   <div className="relative">
                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                     <Input
                       id="reset-email"
                       type="email"
                       placeholder="votre.email@exemple.com"
                       value={loginData.identifiant}
                       onChange={(e) => setLoginData(prev => ({ ...prev, identifiant: e.target.value }))}
                       className="pl-10 h-12 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                       disabled={loginLoading}
                       required
                     />
                   </div>
                 </div>
 
                 <Button 
                   type="submit"
                   disabled={loginLoading}
                   className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
                 >
                   {loginLoading ? (
                     <>
                       <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                       Envoi en cours...
                     </>
                   ) : (
                     'Envoyer le lien'
                   )}
                 </Button>

                 <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveTab('login')}
                    className="w-full text-gray-600 hover:text-gray-900"
                  >
                    Retour à la connexion
                  </Button>
               </form>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
