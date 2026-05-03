import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, ChevronRight, IndianRupee, ArrowLeft, Clock } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { ROUTES } from '../constants/routes';

export const QuarterRentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const allotmentId = searchParams.get('allotment_id');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
          <Home size={11} />
          <ChevronRight size={10} />
          <span>My Workspace</span>
          <ChevronRight size={10} />
          <button
            onClick={() => navigate(ROUTES.QUARTERS_REQUESTS)}
            className="text-blue-600 hover:underline font-medium"
          >
            Quarter Requests
          </button>
          <ChevronRight size={10} />
          <span className="text-gray-600 font-medium">Rent Details</span>
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate(ROUTES.QUARTERS_REQUESTS)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-all"
        >
          <ArrowLeft size={15} /> Back to Quarter Requests
        </button>

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header strip */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <IndianRupee size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Rent Details</h1>
                <p className="text-teal-100 text-sm mt-0.5">
                  Monthly rent ledger & payment history
                  {allotmentId && (
                    <span className="ml-2 font-mono bg-white/20 px-2 py-0.5 rounded text-xs">
                      {allotmentId.slice(0, 8)}…
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Coming soon body */}
          <div className="px-8 py-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-50 border-2 border-teal-100 mb-6">
              <Clock size={32} className="text-teal-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Rent Module Coming Soon</h2>
            <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
              The rental ledger and payment history module is currently under development. You will be able to view monthly rent dues, receipts, and arrears here once it is available.
            </p>

            <div className="mt-8 grid sm:grid-cols-3 gap-4 max-w-xl mx-auto text-left">
              {[
                { label: 'Monthly Rent Due',    placeholder: '—' },
                { label: 'Last Payment Date',   placeholder: '—' },
                { label: 'Outstanding Arrears', placeholder: '—' },
              ].map(({ label, placeholder }) => (
                <div key={label} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">{label}</div>
                  <div className="text-lg font-bold text-gray-300">{placeholder}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate(ROUTES.QUARTERS_REQUESTS)}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-md"
            >
              <ArrowLeft size={15} /> Return to Quarter Requests
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
