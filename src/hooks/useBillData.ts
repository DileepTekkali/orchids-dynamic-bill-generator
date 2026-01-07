"use client";

import { useLocalStorage } from './useLocalStorage';
import { BusinessDetails, Bill } from '@/lib/types';

const DEFAULT_BUSINESS: BusinessDetails = {
  shopName: '',
  shopAddress: '',
  holderName: '',
  mobile: '',
};

export function useBusiness() {
  const { value: business, setValue: setBusiness, isLoaded } = useLocalStorage<BusinessDetails>(
    'billmaker-business',
    DEFAULT_BUSINESS
  );

  const updateBusiness = (updates: Partial<BusinessDetails>) => {
    setBusiness({ ...business, ...updates });
  };

  const isSetupComplete = 
    business.shopName.trim() !== '' && 
    business.shopAddress.trim() !== '' &&
    (business.holderName || '').trim() !== '' &&
    (business.mobile || '').trim() !== '';

  return { business, updateBusiness, isLoaded, isSetupComplete };
}

export function useBills() {
  const { value: bills, setValue: setBills, isLoaded } = useLocalStorage<Bill[]>(
    'billmaker-bills',
    []
  );

  const { value: billCounter, setValue: setBillCounter } = useLocalStorage<number>(
    'billmaker-counter',
    1
  );

  const nextBillNumber = `INV-${String(billCounter).padStart(4, '0')}`;

  const addBill = (bill: Omit<Bill, 'id' | 'billNumber' | 'createdAt'>) => {
    const newBill: Bill = {
      ...bill,
      id: crypto.randomUUID(),
      billNumber: nextBillNumber,
      createdAt: new Date().toISOString(),
    };
    setBills(prev => [newBill, ...prev]);
    setBillCounter(billCounter + 1);
    return newBill;
  };

  const deleteBill = (id: string) => {
    setBills(prev => prev.filter(bill => bill.id !== id));
  };

  const getBill = (id: string) => bills.find(bill => bill.id === id);

  return { bills, addBill, deleteBill, getBill, isLoaded, nextBillNumber };
}
