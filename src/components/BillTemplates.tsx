"use client";

import { BusinessDetails, Bill } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TemplateProps {
  business: BusinessDetails;
  bill: Bill;
}

function AuthorizedSignature({ business }: { business: BusinessDetails }) {
  const stampSrc = business.useAutoStamp 
    ? business.generatedStampImage 
    : business.stampImage;
    
  const hasStamp = !!stampSrc;
  const hasSignature = !!business.signatureImage;
  
  if (!hasStamp && !hasSignature) {
    return (
      <div className="text-center">
        <div className="w-48 border-b border-slate-400 mb-2 mx-auto mt-20"></div>
        <p className="text-sm font-semibold text-slate-600 uppercase">Authorized Signature</p>
      </div>
    );
  }

  return (
    <div className="flex justify-end pr-4">
      <div className="relative inline-block text-center min-w-[200px]">
        {/* Signature and Stamp Layered */}
        <div className="relative h-28 mb-1 flex items-end justify-center">
          {hasSignature && (
            <img 
              src={business.signatureImage} 
              alt="Signature" 
              className={cn(
                "h-24 object-contain z-10",
                hasStamp ? "mb-2" : ""
              )}
            />
          )}
          
            {hasStamp && (
              <img 
                src={stampSrc} 
                alt="Stamp" 
                className={cn(
                  "h-32 object-contain pointer-events-none opacity-90",
                  hasSignature 
                    ? "absolute -bottom-4 left-1/2 -translate-x-1/4 z-20 mix-blend-multiply rotate-[12deg]" 
                    : "z-10"
                )}
                style={{ mixBlendMode: 'multiply' }}
              />
            )}
        </div>
        
        <div className="relative">
          <div className="w-48 border-b border-slate-400 mb-2 mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600 uppercase relative z-0">Authorized Signature</p>
          
          {/* If only stamp exists, it should still overlap the text slightly if positioned right */}
          {hasStamp && !hasSignature && (
             <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 pointer-events-none">
                {/* Stamp already rendered above, but if we want it to cover the text below we need to adjust z-index and positioning */}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function UnifiedTemplate({ business, bill }: TemplateProps) {
  return (
    <div className="w-full bg-white p-10 font-sans text-slate-900 flex flex-col" style={{ minHeight: '1123px', width: '794px' }}>
      <div className="flex justify-between items-start border-b border-slate-300 pb-6 mb-8">
        <div className="flex items-start gap-6">
          {business.logo && (
            <img src={business.logo} alt="Logo" className="w-24 h-24 object-contain bg-transparent" />
          )}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">{business.shopName}</h1>
              <div className="space-y-1 mb-2">
                {business.holderName && (
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    {business.holderName}
                  </p>
                )}
                {business.mobile && (
                  <p className="text-sm font-semibold text-slate-600">
                    Contact: {business.mobile}
                  </p>
                )}
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-wrap max-w-sm leading-relaxed">{business.shopAddress}</p>
              {bill.gstEnabled && business.gstNumber && (
              <div className="mt-2 text-sm font-semibold text-slate-700">
                GSTIN: {business.gstNumber}
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-black text-slate-100 mb-2 italic uppercase tracking-tighter">Invoice</h2>
          <div className="space-y-1 text-sm">
            <p className="font-bold text-slate-900">Invoice No: <span className="font-mono">{bill.billNumber}</span></p>
            <p className="text-slate-500 font-medium">Date: {bill.billDate}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 border-l-4 border-slate-900 pl-4 py-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Bill To:</h3>
        <p className="text-xl font-bold text-slate-900">{bill.customerName}</p>
      </div>

      <div className="flex-grow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y border-slate-300">
              <th className="text-left py-3 px-2 text-xs font-bold uppercase tracking-wider text-slate-500">S.No</th>
              <th className="text-left py-3 px-2 text-xs font-bold uppercase tracking-wider text-slate-500">Description</th>
              <th className="text-center py-3 px-2 text-xs font-bold uppercase tracking-wider text-slate-500 w-20">Qty</th>
              <th className="text-right py-3 px-2 text-xs font-bold uppercase tracking-wider text-slate-500 w-28">Rate</th>
              <th className="text-right py-3 px-2 text-xs font-bold uppercase tracking-wider text-slate-500 w-28">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bill.items.map((item, index) => (
              <tr key={item.id}>
                <td className="py-4 px-2 text-sm text-slate-600 w-12">{index + 1}</td>
                <td className="py-4 px-2 text-sm font-semibold text-slate-800">{item.name}</td>
                <td className="py-4 px-2 text-center text-sm font-bold text-slate-600">{item.quantity}</td>
                <td className="py-4 px-2 text-right text-sm font-medium text-slate-600">₹{item.rate.toFixed(2)}</td>
                <td className="py-4 px-2 text-right text-sm font-bold text-slate-900">₹{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-auto pt-8 border-t border-slate-200">
        <div className="flex justify-between items-end">
          <div className="max-w-md pb-4">
            <p className="text-sm text-slate-400 italic font-medium mb-2">
              Thank you for your business!
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-6">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-slate-500">Subtotal</span>
                <span className="font-bold text-slate-700">₹{bill.subtotal.toFixed(2)}</span>
              </div>
              {bill.gstEnabled && (
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-500">GST ({bill.gstPercentage}%)</span>
                  <span className="font-bold text-slate-700">₹{bill.gstAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-900">
                <span className="text-base font-black text-slate-900 uppercase">Grand Total</span>
                <span className="text-xl font-black text-slate-900">₹{bill.grandTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <AuthorizedSignature business={business} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BillTemplate({ business, bill }: TemplateProps) {
  return <UnifiedTemplate business={business} bill={bill} />;
}
