export type User = {
  id: string;
  email: string;
  businessName?: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  createdAt: string;
};

export type Sale = {
  id: string;
  productId: string;
  quantity: number;
  totalPrice: number;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
};

export type Expense = {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalSpent: number;
  lastVisit: string;
};
