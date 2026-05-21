import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function matchPhoneFull(p1: string, p2: string): boolean {
  if (!p1 || !p2) return false;
  const digits1 = p1.replace(/\D/g, '');
  const digits2 = p2.replace(/\D/g, '');
  if (!digits1 || !digits2) return false;
  if (digits1.length < 10 || digits2.length < 10) {
    return digits1 === digits2;
  }
  return digits1.slice(-10) === digits2.slice(-10);
}

export function matchNameFull(n1: string, n2: string): boolean {
  if (!n1 || !n2) return false;
  const clean1 = n1.trim().toLowerCase();
  const clean2 = n2.trim().toLowerCase();
  if (!clean1 || !clean2) return false;
  return clean1 === clean2;
}

export function matchCustomer(cust: { name: string; phone?: string }, sale: { customerName?: string; customerPhone?: string }): boolean {
  const sName = sale.customerName || '';
  const sPhone = sale.customerPhone || '';
  const cName = cust.name || '';
  const cPhone = cust.phone || '';
  
  if (sPhone && cPhone && matchPhoneFull(sPhone, cPhone)) {
    return true;
  }
  if (sName && cName && matchNameFull(sName, cName)) {
    return true;
  }
  return false;
}

export function getTOTPCode(secret: string): string {
  // A simple deterministic rolling code generator
  const epoch = Math.floor(Date.now() / 30000);
  let hash = 0;
  const str = secret + epoch.toString();
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const code = Math.abs(hash) % 1000000;
  return code.toString().padStart(6, '0');
}

