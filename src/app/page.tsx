"use client";

import { useBusiness, useBills } from '@/hooks/useBillData';
import { Button } from '@/components/ui/button';
import { 
  Plus, Settings, History, Receipt, TrendingUp, 
  FileText, ArrowRight, Building2
} from 'lucide-react';
import Link from 'next/link';
import { Toaster } from 'sonner';

export default function Home() {
  const { business, isLoaded: businessLoaded, isSetupComplete } = useBusiness();
  const { bills, isLoaded: billsLoaded } = useBills();

  if (!businessLoaded || !billsLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalRevenue = bills.reduce((sum, bill) => sum + bill.grandTotal, 0);
  const thisMonthBills = bills.filter(bill => {
    const billDate = new Date(bill.billDate);
    const now = new Date();
    return billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear();
  });
  const thisMonthRevenue = thisMonthBills.reduce((sum, bill) => sum + bill.grandTotal, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20">
      <Toaster position="top-center" richColors />
      
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">
              BillMaker
            </h1>
            <p className="text-slate-500 mt-1">Create professional invoices in seconds</p>
          </div>
          <Link href="/settings">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full hover:bg-amber-100 hover:border-amber-200"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        {!isSetupComplete && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 mb-8 text-white shadow-lg shadow-amber-500/25">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">Complete Your Setup</h2>
                <p className="text-amber-100 text-sm mb-4">
                  Add your business details to start creating professional invoices
                </p>
                <Link href="/settings">
                  <Button 
                    className="bg-white text-amber-600 hover:bg-amber-50 font-semibold"
                  >
                    Setup Business
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {isSetupComplete && (
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 mb-8">
            <div className="flex items-center gap-4">
              {business.logo ? (
                <img src={business.logo} alt="Logo" className="w-16 h-16 object-contain rounded-xl" />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">{business.shopName.charAt(0)}</span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-slate-800">{business.shopName}</h2>
                <p className="text-slate-500 text-sm">{business.shopAddress}</p>
              </div>
            </div>
          </div>
        )}

        {isSetupComplete && bills.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <Link href="/history" className="block hover:scale-[1.02] transition-transform">
              <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-5 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">{bills.length}</p>
                <p className="text-sm text-slate-500">Total Invoices</p>
              </div>
            </Link>
            <Link href="/history" className="block hover:scale-[1.02] transition-transform">
              <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-5 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">₹{totalRevenue.toLocaleString('en-IN')}</p>
                <p className="text-sm text-slate-500">Total Revenue</p>
              </div>
            </Link>
            <Link href="/history" className="col-span-2 sm:col-span-1 block hover:scale-[1.02] transition-transform">
              <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-5 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-violet-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">₹{thisMonthRevenue.toLocaleString('en-IN')}</p>
                <p className="text-sm text-slate-500">This Month</p>
              </div>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/create" className="block">
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all hover:-translate-y-1 cursor-pointer h-full">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <Plus className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-2">Create New Bill</h3>
              <p className="text-amber-100 text-sm">
                Generate professional invoices with your business branding
              </p>
            </div>
          </Link>

          <Link href="/history" className="block">
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:border-amber-200 transition-all hover:-translate-y-1 cursor-pointer h-full">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <History className="w-7 h-7 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Bill History</h3>
              <p className="text-slate-500 text-sm">
                View, download, and manage all your past invoices
              </p>
            </div>
          </Link>
        </div>

        {bills.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Recent Bills</h3>
              <Link href="/history" className="text-amber-600 text-sm font-medium hover:text-amber-700">
                View All
              </Link>
            </div>
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
              {bills.slice(0, 3).map((bill, idx) => (
                <div 
                  key={bill.id}
                  className={`flex items-center justify-between p-4 ${idx !== Math.min(bills.length - 1, 2) ? 'border-b border-slate-100' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{bill.billNumber}</p>
                      <p className="text-sm text-slate-500">{bill.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-600">₹{bill.grandTotal.toFixed(2)}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(bill.billDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-slate-400 text-sm">
            Your data is stored locally on this device
          </p>
        </div>
      </div>
    </div>
  );
}
