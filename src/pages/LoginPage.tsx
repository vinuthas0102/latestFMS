import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, LogIn } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const addToast = useUIStore((state) => state.addToast);

  const [email, setEmail] = useState('demo@fms.com');
  const [password, setPassword] = useState('demo123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('public');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password, selectedRole);
      addToast('Login successful', 'success');
      navigate(ROUTES.DASHBOARD);
    } catch (error: any) {
      addToast(error.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-xl mb-4">
            <Building2 size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Facilities Management</h1>
          <p className="text-gray-600">Sign in to access your dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 animate-slideUp">
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={20} />}
              required
            />

            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={20} />}
              required
            />

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              icon={<LogIn size={20} />}
            >
              Sign In
            </Button>
          </form>
        </div>

        <div className="mt-6 bg-white rounded-2xl shadow-xl p-6 animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Demo Role Switcher</h3>
          <div className="space-y-2">
            {Object.values(ROLES).map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-150 ${
                  selectedRole === role
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">{ROLE_LABELS[role]}</div>
                <div className={`text-xs mt-1 ${selectedRole === role ? 'text-blue-100' : 'text-gray-500'}`}>
                  {ROLE_DESCRIPTIONS[role]}
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Demo credentials: demo@fms.com / demo123
        </p>
      </div>
    </div>
  );
};
