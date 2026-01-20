import { useState } from 'react';
import { Menu } from 'lucide-react'; // Import Menu icon
import { Dashboard } from './app/components/Dashboard';
import { WorkersManagement } from './app/components/WorkersManagement';
import { SalaryManagement } from './app/components/SalaryManagement';
import { StockManagement } from './app/components/StockManagement';
import { ClientsManagement } from './app/components/ClientsManagement';
import { AssistantsManagement } from './app/components/AssistantsManagement';
import { ProfilePage } from './app/components/ProfilePage';
import { Sidebar } from './app/components/Sidebar';
import { Header } from './app/components/Header';
import { AuthProvider, useAuthContext } from './app/context/AuthContext';
import { LoginPage } from './app/components/LoginPage';

function AppContent() {
  const { user, isAuthenticated } = useAuthContext();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'workers':
        return <WorkersManagement userRole={user.role} />;
      case 'salaries':
        return <SalaryManagement userRole={user.role} />;
      case 'stock':
        return <StockManagement userRole={user.role} />;
      case 'clients':
        return <ClientsManagement userRole={user.role} />;
      case 'assistants':
        return <AssistantsManagement userRole={user.role} />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden p-4 bg-emerald-600 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="p-1 hover:bg-emerald-500 rounded">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-lg">Salihate Clean</span>
        </div>
      </div>

      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        userRole={user.role}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 lg:ml-64 transition-all duration-300">
        <div className="hidden lg:block">
          <Header userRole={user.role} onNavigateToProfile={() => setCurrentPage('profile')} />
        </div>
        <main className="p-4 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
