"use client";

import { useState, useRef, useMemo } from 'react';
import { useBusiness, useBills } from '@/hooks/useBillData';
import { BillTemplate } from '@/components/BillTemplates';
import { BillItem, Bill } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, Plus, Trash2, Download, Eye, EyeOff, 
  Calendar, User, Package
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function CreateBillPage() {
  const { business, isLoaded: businessLoaded, isSetupComplete } = useBusiness();
  const { addBill, nextBillNumber } = useBills();
  const billRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  const [customerName, setCustomerName] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<BillItem[]>([
    { id: crypto.randomUUID(), name: '', quantity: 1, rate: 0, total: 0 }
  ]);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [billForPdf, setBillForPdf] = useState<Bill | null>(null);

  const updateItem = (id: string, field: keyof BillItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'rate') {
        updated.total = updated.quantity * updated.rate;
      }
      return updated;
    }));
  };

  const addItem = () => {
    setItems(prev => [...prev, { id: crypto.randomUUID(), name: '', quantity: 1, rate: 0, total: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);
  const gstAmount = useMemo(() => gstEnabled ? (subtotal * gstPercentage) / 100 : 0, [gstEnabled, subtotal, gstPercentage]);
  const grandTotal = useMemo(() => subtotal + gstAmount, [subtotal, gstAmount]);

  const previewBill: Bill = useMemo(() => ({
    id: 'preview',
    billNumber: nextBillNumber,
    customerName: customerName || 'Customer Name',
    billDate: billDate,
    items: items.filter(i => i.name.trim() !== ''),
    subtotal,
    gstEnabled,
    gstPercentage,
    gstAmount,
    grandTotal,
    templateId: 'classic',
    createdAt: new Date().toISOString(),
  }), [customerName, billDate, items, subtotal, gstEnabled, gstPercentage, gstAmount, grandTotal, nextBillNumber]);

  const handleSave = async (format: 'pdf' | 'jpeg') => {
    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    if (items.filter(i => i.name.trim()).length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setIsSaving(true);
    try {
      const newBill = addBill({
        customerName,
        billDate,
        items: items.filter(i => i.name.trim()),
        subtotal,
        gstEnabled,
        gstPercentage,
        gstAmount,
        grandTotal,
        templateId: 'classic',
      });

      setBillForPdf(newBill);
      
      await new Promise(resolve => setTimeout(resolve, 500));

      if (format === 'pdf') {
        if (pdfRef.current) {
          setBillForPdf(newBill);
          
          await new Promise(resolve => setTimeout(resolve, 500));

          const canvas = await html2canvas(pdfRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
          });
          
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          // If content is taller than A4, we can either scale it down or use a custom page size
          // For "one page layout only", custom page size is better to avoid tiny text
          if (pdfHeight > pdf.internal.pageSize.getHeight()) {
            const customPdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
            customPdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            customPdf.save(`Invoice-${newBill.billNumber}.pdf`);
          } else {
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Invoice-${newBill.billNumber}.pdf`);
          }
        }
      } else {
        // JPEG format
        if (pdfRef.current) {
          const canvas = await html2canvas(pdfRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
          });
          const link = document.createElement('a');
          link.download = `Invoice-${newBill.billNumber}.jpg`;
          link.href = canvas.toDataURL('image/jpeg', 0.9);
          link.click();
        }
      }

      toast.success(`Bill saved and downloaded as ${format.toUpperCase()}!`);
      
      setCustomerName('');
      setItems([{ id: crypto.randomUUID(), name: '', quantity: 1, rate: 0, total: 0 }]);
      setGstEnabled(false);
      setBillDate(new Date().toISOString().split('T')[0]);
      setBillForPdf(null);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save bill');
    } finally {
      setIsSaving(false);
      setBillForPdf(null);
    }
  };

  if (!businessLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSetupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Setup Required</h2>
          <p className="text-slate-500 mb-6">Please configure your business details before creating bills.</p>
          <Link href="/settings">
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
              Go to Settings
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-amber-100">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Create New Bill</h1>
              <p className="text-slate-500 text-sm">Invoice #{nextBillNumber}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="hidden lg:flex"
          >
            {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" />
                Customer Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Customer Name *</label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Bill Date
                  </label>
                  <Input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-500" />
                  Items
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-slate-400 uppercase px-1">
                  <div className="col-span-5">Item Name</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-center">Rate</div>
                  <div className="col-span-2 text-right">Total</div>
                  <div className="col-span-1"></div>
                </div>

                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-xl">
                    <div className="col-span-12 sm:col-span-5">
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        placeholder="Item name"
                        className="h-10 rounded-lg bg-white"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="h-10 rounded-lg bg-white text-center"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="h-10 rounded-lg bg-white text-center"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2 text-right font-semibold text-slate-700">
                      ₹{item.total.toFixed(2)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-800">GST Settings</h3>
                  <p className="text-xs text-slate-500 mt-1">Enable to show GST details on invoice</p>
                </div>
                <Switch checked={gstEnabled} onCheckedChange={setGstEnabled} />
              </div>
              {gstEnabled && (
                <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                  <label className="text-sm text-slate-600">GST Percentage:</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={gstPercentage}
                    onChange={(e) => setGstPercentage(parseFloat(e.target.value) || 0)}
                    className="w-24 h-10 rounded-lg text-center"
                  />
                  <span className="text-slate-500">%</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
              <div className="space-y-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                {gstEnabled && (
                  <div className="flex justify-between text-slate-600">
                    <span>GST ({gstPercentage}%)</span>
                    <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-slate-200">
                  <span className="text-lg font-bold text-slate-800">Grand Total</span>
                  <span className="text-xl font-bold text-amber-600">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleSave('pdf')}
                disabled={isSaving}
                className="flex-1 h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 text-lg"
              >
                {isSaving ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Save PDF
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleSave('jpeg')}
                disabled={isSaving}
                variant="outline"
                className="flex-1 h-14 border-amber-200 text-amber-600 hover:bg-amber-50 font-semibold rounded-xl text-lg"
              >
                {isSaving ? (
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Save JPEG
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className={`${showPreview ? 'block' : 'hidden'} lg:block`}>
            <div className="sticky top-6">
              <h3 className="font-semibold text-slate-800 mb-4">Live Preview</h3>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
                <div ref={billRef} className="overflow-auto max-h-[calc(100vh-200px)]" style={{ width: '100%' }}>
                  <div style={{ transform: 'scale(0.7)', transformOrigin: 'top left', width: '142.857%' }}>
                    <BillTemplate
                      business={business}
                      bill={previewBill}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {billForPdf && (
        <div className="fixed left-[-9999px] top-0">
          <div ref={pdfRef} style={{ width: '794px' }}>
            <BillTemplate
              business={business}
              bill={billForPdf}
            />
          </div>
        </div>
      )}
    </div>
  );
}
