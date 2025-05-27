import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, Users, CreditCard, Utensils, Wallet, 
  LogOut, Menu, X, ChevronRight, Building2
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <Home size={20} /> },
    { path: '/rooms', label: 'Rooms', icon: <Building2 size={20} /> },
    { path: '/tenants', label: 'Tenants', icon: <Users size={20} /> },
    { path: '/rent', label: 'Rent Tracking', icon: <CreditCard size={20} /> },
    { path: '/mess', label: 'Mess Tracking', icon: <Utensils size={20} /> },
    { path: '/deposits', label: 'Deposits', icon: <Wallet size={20} /> },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">Rental Manager</h1>
        </div>
        <nav className="flex-1 px-4 pb-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <LogOut size={20} className="mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Menu */}
      <div 
        className={`fixed inset-0 z-20 bg-gray-900 bg-opacity-50 transition-opacity duration-200 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobileMenu}
      ></div>

      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">Rental Manager</h1>
          <button onClick={closeMobileMenu} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={closeMobileMenu}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                  <ChevronRight size={16} className="ml-auto" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 mt-auto border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <LogOut size={20} className="mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 md:px-6">
            <button 
              onClick={toggleMobileMenu}
              className="p-2 text-gray-600 rounded-md md:hidden hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
            <div className="text-xl font-semibold text-gray-800 md:hidden">
              {navItems.find(item => item.path === location.pathname)?.label || 'Rental Manager'}
            </div>
            <div className="flex items-center">
              <span className="hidden text-sm text-gray-600 md:block">
                Admin
              </span>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;