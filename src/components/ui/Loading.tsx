import React from 'react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 ${sizeClasses[size]}`}
      />
    </div>
  );
};

export const FullPageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-28 bg-gray-200" />
      <div className="p-2.5">
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-1.5" />
        <div className="h-3 bg-gray-200 rounded w-3/4 mb-1.5" />
        <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-6 bg-gray-200 rounded w-12" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-12 bg-gray-200" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 border-t border-gray-200 bg-white" />
      ))}
    </div>
  );
};
