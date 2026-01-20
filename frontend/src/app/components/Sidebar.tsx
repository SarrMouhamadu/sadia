import { LayoutDashboard, Users, Wallet, Package, LogOut, UserCog } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import type { UserRole } from '../services/auth.service';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ currentPage, onNavigate, userRole, isOpen, onClose }: SidebarProps) {
  const { logout } = useAuthContext();

  const handleLogout = () => {
    logout();
    onClose();
  };
  // Normalize role to lowercase for comparison if needed, OR update array to match Backend uppercase.
  // Backend sends 'ADMIN' or 'ASSISTANT'.
  // auth.service.ts defines type UserRole = 'ADMIN' | 'ASSISTANT';
  // So we should use uppercase here.
  
  const menuItems: { id: string; label: string; icon: any; roles: UserRole[] }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['ADMIN', 'ASSISTANT'] },
    { id: 'workers', label: 'Travailleurs', icon: Users, roles: ['ADMIN', 'ASSISTANT'] },
    { id: 'salaries', label: 'Salaires', icon: Wallet, roles: ['ADMIN', 'ASSISTANT'] },
    { id: 'stock', label: 'Stocks', icon: Package, roles: ['ADMIN', 'ASSISTANT'] },
    { id: 'clients', label: 'Clients', icon: Users, roles: ['ADMIN'] },
    { id: 'assistants', label: 'Assistants', icon: UserCog, roles: ['ADMIN'] },
  ];

  const availableItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300" 
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-emerald-600 to-emerald-700 text-white shadow-xl z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-6 border-b border-emerald-500 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Salihate Clean</h1>
            <p className="text-sm text-emerald-100 mt-1">Plateforme de gestion</p>
          </div>
          {/* Close button for mobile */}
          <button onClick={onClose} className="lg:hidden text-white hover:text-emerald-200">
            x 
          </button>
        </div>
        
        <nav className="mt-6">
          {availableItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose(); // Close sidebar on selection on mobile
                }}
                className={`w-full flex items-center gap-3 px-6 py-3 transition-all ${
                  isActive
                    ? 'bg-white text-emerald-700 border-r-4 border-emerald-500'
                    : 'text-white hover:bg-emerald-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-emerald-500">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-white hover:text-emerald-100 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
