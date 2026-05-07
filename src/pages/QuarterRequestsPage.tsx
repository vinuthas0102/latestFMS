import React from 'react';
import { ClipboardList } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const QuarterRequestsPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
        <ClipboardList className="w-8 h-8 text-blue-600" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Quarter Requests</h1>
        <p className="text-gray-500 max-w-sm">
          {user
            ? `Welcome, ${user.full_name ?? user.email}. This section is being rebuilt and will be available shortly.`
            : 'This section is being rebuilt and will be available shortly.'}
        </p>
      </div>
    </div>
  );
};
