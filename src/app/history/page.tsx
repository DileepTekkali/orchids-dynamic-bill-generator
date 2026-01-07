"use client";

import { useState, useRef } from 'react';
import { useBusiness, useBills } from '@/hooks/useBillData';
import { BillTemplate } from '@/components/BillTemplates';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Download, Trash2, Eye, Calendar, 
  User, Receipt, Search, X
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Bill } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';

export default function HistoryPage() {
  const { business, isLoaded: businessLoaded } = useBusiness();
  const { bills, deleteBill, isLoaded: billsLoaded } = useBills();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewBill, setPreviewBill] = useState<Bill | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const billRef = useRef<HTMLDivElement>(null);

  const filteredBills = bills.filter(bill => 
    bill.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = () => {
    if (deleteId) {
      deleteBill(deleteId);
      toast.success('Bill deleted successfully');
      setDeleteId(null);
    }
  };

  const handleDownload = async (bill: Bill) => {
    setIsDownloading(bill.id);
    setPreviewBill(bill);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      if (billRef.current) {
        const canvas = await html2canvas(billRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${bill.billNumber}.pdf`);
        toast.success('Invoice downloaded!');
      }
    } catch (error) {
      toast.error('Failed to download PDF');
    } finally {
      setIsDownloading(null);
      setPreviewBill(null);
    }
  };

  if (!businessLoaded || !billsLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-amber-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Bill History</h1>
            <p className="text-slate-500 text-sm mt-1">{bills.length} invoice{bills.length !== 1 ? 's' : ''} created</p>
          </div>
        </div>

        {bills.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name or invoice number..."
              className="pl-12 h-12 rounded-xl bg-white border-slate-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {filteredBills.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-12 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {searchQuery ? 'No bills found' : 'No bills yet'}
            </h2>
            <p className="text-slate-500 mb-6">
              {searchQuery ? 'Try a different search term' : 'Create your first invoice to get started'}
            </p>
            {!searchQuery && (
              <Link href="/create">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                  Create New Bill
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBills.map((bill) => (
              <div
                key={bill.id}
                className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-5 hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-slate-800">{bill.billNumber}</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        {bill.templateId}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {bill.customerName}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(bill.billDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-2">
                      <p className="text-xs text-slate-400">Total</p>
                      <p className="text-lg font-bold text-amber-600">₹{bill.grandTotal.toFixed(2)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPreviewBill(bill)}
                      className="rounded-xl hover:bg-amber-50 hover:border-amber-200"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDownload(bill)}
                      disabled={isDownloading === bill.id}
                      className="rounded-xl hover:bg-amber-50 hover:border-amber-200"
                    >
                      {isDownloading === bill.id ? (
                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDeleteId(bill.id)}
                      className="rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-2">Items ({bill.items.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {bill.items.slice(0, 3).map((item) => (
                      <span key={item.id} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">
                        {item.name} × {item.quantity}
                      </span>
                    ))}
                    {bill.items.length > 3 && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-lg">
                        +{bill.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The invoice will be permanently removed from your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!previewBill && !isDownloading} onOpenChange={() => setPreviewBill(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview - {previewBill?.billNumber}</DialogTitle>
          </DialogHeader>
          {previewBill && (
            <div className="mt-4">
              <BillTemplate
                templateId={previewBill.templateId}
                business={business}
                bill={previewBill}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isDownloading && previewBill && (
        <div className="fixed left-[-9999px]">
          <div ref={billRef}>
            <BillTemplate
              templateId={previewBill.templateId}
              business={business}
              bill={previewBill}
            />
          </div>
        </div>
      )}
    </div>
  );
}
