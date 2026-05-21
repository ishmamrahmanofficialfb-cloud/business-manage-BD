import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Sale, Customer, Expense } from '@/src/types/index';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/hooks/useAuth';
import { matchCustomer } from '@/src/lib/utils';

interface DataContextType {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  expenses: Expense[];
  isLoading: boolean;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addSale: (sale: Sale) => Promise<void>;
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Utility to check if ID is of UUID format
  const isUuid = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // 1. Product mapping
  const mapProductFromDb = (db: any): Product => ({
    id: db.id,
    name: db.name,
    sku: db.sku || `SKU-${db.id.slice(0, 4).toUpperCase()}`,
    category: db.category || 'মুদি',
    price: Number(db.price),
    stock: Number(db.stock),
    minStock: db.min_stock || 5,
    createdAt: db.created_at || new Date().toISOString(),
  });

  const mapProductToDb = (product: Product, userId: string) => ({
    ...(isUuid(product.id) ? { id: product.id } : {}),
    user_id: userId,
    name: product.name,
    category: product.category,
    price: product.price,
    stock: product.stock,
    unit: (product as any).unit || null
  });

  // 2. Customer mapping
  const mapCustomerFromDb = (db: any): Customer => ({
    id: db.id,
    name: db.name,
    phone: db.phone || '',
    email: db.email || '',
    address: db.address || '',
    totalSpent: Number(db.total_spent || 0),
    lastVisit: db.last_visit || 'এইমাত্র যোগ দিয়েছেন'
  });

  const mapCustomerToDb = (customer: Customer, userId: string) => ({
    ...(isUuid(customer.id) ? { id: customer.id } : {}),
    user_id: userId,
    name: customer.name,
    phone: customer.phone,
    email: customer.email || '',
    address: customer.address || '',
    total_spent: customer.totalSpent,
    last_visit: customer.lastVisit
  });

  // 3. Sale mapping
  const mapSaleFromDb = (db: any): Sale => ({
    id: db.id,
    productId: db.product_id || '',
    quantity: Number(db.quantity),
    totalPrice: Number(db.total_price),
    customerName: db.customer_name || '',
    customerPhone: db.customer_phone || '',
    createdAt: db.created_at || new Date().toISOString()
  });

  const mapSaleToDb = (sale: Sale, userId: string, productName: string) => ({
    ...(isUuid(sale.id) ? { id: sale.id } : {}),
    user_id: userId,
    product_id: isUuid(sale.productId) ? sale.productId : null,
    product_name: productName,
    quantity: sale.quantity,
    total_price: sale.totalPrice,
    customer_name: sale.customerName || null,
    customer_phone: sale.customerPhone || null
  });

  // 4. Expense mapping
  const mapExpenseFromDb = (db: any): Expense => ({
    id: db.id,
    category: db.category || 'অন্যান্য',
    amount: Number(db.amount),
    description: db.title || db.description || '',
    date: db.date
  });

  const mapExpenseToDb = (expense: Expense, userId: string) => ({
    ...(isUuid(expense.id) ? { id: expense.id } : {}),
    user_id: userId,
    title: expense.description,
    amount: expense.amount,
    category: expense.category,
    date: expense.date
  });

  // Fetch all data when user logs in
  useEffect(() => {
    if (!user) {
      setProducts([]);
      setSales([]);
      setCustomers([]);
      setExpenses([]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      if (user?.id === 'guest') {
        // Load initial mock data for guest
        setProducts([
          { id: '1', name: 'চাল (৫ কেজি)', category: 'মুদি', price: 450, stock: 50, unit: 'ব্যাগ' },
          { id: '2', name: 'ডাল (১ কেজি)', category: 'মুদি', price: 130, stock: 100, unit: 'কেজি' },
          { id: '3', name: 'সয়াবিন তেল (৫লি)', category: 'তেল', price: 850, stock: 20, unit: 'বোতল' },
        ]);
        setSales([]);
        setCustomers([]);
        setExpenses([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // We fetch them one by one to see which one fails if any
        const results = await Promise.allSettled([
          supabase.from('products').select('*').order('name'),
          supabase.from('sales').select('*').order('created_at', { ascending: false }),
          supabase.from('customers').select('*').order('name'),
          supabase.from('expenses').select('*').order('date', { ascending: false }),
        ]);

        results.forEach((result, index) => {
          const tables = ['products', 'sales', 'customers', 'expenses'];
          if (result.status === 'fulfilled') {
            const { data, error } = result.value;
            if (error) {
              console.error(`Error fetching ${tables[index]}:`, error);
              // If it's a 404/PGRST116, it might mean table doesn't exist
            } else if (data) {
              if (index === 0) setProducts(data.map(mapProductFromDb));
              if (index === 1) setSales(data.map(mapSaleFromDb));
              if (index === 2) setCustomers(data.map(mapCustomerFromDb));
              if (index === 3) setExpenses(data.map(mapExpenseFromDb));
            }
          } else {
            console.error(`Fetch failed for ${tables[index]}:`, result.reason);
          }
        });
      } catch (error) {
        console.error('Unexpected error in fetchData:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const addProduct = async (product: Product) => {
    if (user?.id === 'guest') {
      const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) };
      setProducts([...products, newProduct]);
      return;
    }
    const dbPayload = mapProductToDb(product, user?.id || '');
    const { data, error } = await supabase.from('products').insert([dbPayload]).select();
    if (error) {
      console.error('Error inserting product to database:', error);
      throw new Error(`পণ্য যোগ করতে সমস্যা হয়েছে: ${error.message}`);
    }
    if (data && data[0]) {
      const savedProduct = mapProductFromDb(data[0]);
      setProducts([...products, savedProduct]);
    } else {
      setProducts([...products, product]);
    }
  };
  
  const updateProduct = async (updatedProduct: Product) => {
    if (user?.id === 'guest') {
      setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      return;
    }
    const dbPayload = mapProductToDb(updatedProduct, user?.id || '');
    const { error } = await supabase.from('products').update(dbPayload).eq('id', updatedProduct.id);
    if (error) {
      console.error('Error updating product in database:', error);
      throw new Error(`পণ্য আপডেট করতে সমস্যা হয়েছে: ${error.message}`);
    }
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = async (productId: string) => {
    if (user?.id === 'guest') {
      setProducts(products.filter(p => p.id !== productId));
      setSales(sales.filter(s => s.productId !== productId));
      return;
    }
    // Delete sales associated with the product from database to clear its records fully
    const { error: salesError } = await supabase.from('sales').delete().eq('product_id', productId);
    if (salesError) {
      console.error('Error deleting associated sales from database:', salesError);
      throw new Error(`পণ্যের বিক্রয় তথ্য মুছতে সমস্যা হয়েছে: ${salesError.message}`);
    }
    // Delete the product itself from database
    const { error: productError } = await supabase.from('products').delete().eq('id', productId);
    if (productError) {
      console.error('Error deleting product from database:', productError);
      throw new Error(`পণ্য মুছতে সমস্যা হয়েছে: ${productError.message}`);
    }
    setProducts(products.filter(p => p.id !== productId));
    setSales(sales.filter(s => s.productId !== productId));
  };

  const addSale = async (sale: Sale) => {
    const product = products.find(p => p.id === sale.productId);
    const productName = product ? product.name : 'অজানা পণ্য';

    if (user?.id === 'guest') {
      const newSale = { ...sale, id: Math.random().toString(36).substr(2, 9) };
      setSales([newSale, ...sales]);
      
      if (product) {
        await updateProduct({ ...product, stock: product.stock - sale.quantity });
      }

      const customer = customers.find(c => matchCustomer(c, sale));
      if (customer) {
        await updateCustomer({ ...customer, totalSpent: customer.totalSpent + sale.totalPrice, lastVisit: 'আজ' });
      } else if (sale.customerName) {
        await addCustomer({
          id: Math.random().toString(36).substr(2, 9),
          name: sale.customerName.trim(),
          phone: (sale.customerPhone || 'অজানা').trim(),
          totalSpent: sale.totalPrice,
          lastVisit: 'আজ'
        });
      }
      return;
    }

    // 1. Save the sale
    const dbPayload = mapSaleToDb(sale, user?.id || '', productName);
    const { data: saleData, error: saleError } = await supabase.from('sales').insert([dbPayload]).select();
    if (saleError) {
      console.error('Error inserting sale to database:', saleError);
      throw new Error(`বিক্রয় রেকর্ড করতে সমস্যা হয়েছে: ${saleError.message}`);
    }
    
    let savedSale: Sale | null = null;
    if (saleData && saleData[0]) {
      savedSale = mapSaleFromDb(saleData[0]);
      setSales([savedSale, ...sales]);
    } else {
      savedSale = sale;
      setSales([savedSale, ...sales]);
    }
    
    // 2. Decrease inventory
    if (product) {
      await updateProduct({
        ...product,
        stock: product.stock - sale.quantity
      });
    }

    // 3. Update or create customer
    const customer = customers.find(c => matchCustomer(c, sale));
    if (customer) {
      await updateCustomer({
        ...customer,
        totalSpent: customer.totalSpent + sale.totalPrice,
        lastVisit: 'আজ'
      });
    } else if (sale.customerName) {
      const newCustomer: Customer = {
        id: Math.random().toString(36).substr(2, 9),
        name: sale.customerName.trim(),
        phone: (sale.customerPhone || 'অজানা').trim(),
        totalSpent: sale.totalPrice,
        lastVisit: 'আজ'
      };
      await addCustomer(newCustomer);
    }
  };

  const addCustomer = async (customer: Customer) => {
    if (user?.id === 'guest') {
      const newCustomer = { ...customer, id: customer.id || Math.random().toString(36).substr(2, 9) };
      setCustomers([...customers, newCustomer]);
      return;
    }
    const dbPayload = mapCustomerToDb(customer, user?.id || '');
    let result = await supabase.from('customers').insert([dbPayload]).select();
    
    // Highly resilient fallback: if full insertion fails, progressively try safer schema variants
    if (result.error) {
      console.warn('First customer insert attempt failed, trying safe fallback:', result.error.message);
      const safePayload = {
        name: customer.name,
        phone: customer.phone,
        user_id: user?.id || '',
        email: customer.email || '',
        address: customer.address || ''
      };
      
      result = await supabase.from('customers').insert([safePayload]).select();
      
      if (result.error) {
        console.warn('Secondary customer insert attempt (with email/address but without total_spent/last_visit) failed, trying minimalist fallback:', result.error.message);
        const minimalistPayload = {
          name: customer.name,
          phone: customer.phone,
          user_id: user?.id || ''
        };
        result = await supabase.from('customers').insert([minimalistPayload]).select();
      }
    }
    
    if (result.error) {
      console.error('Error inserting customer to database:', result.error);
      throw new Error(`কাস্টমার যোগ করতে সমস্যা হয়েছে: ${result.error.message}`);
    }
    
    if (result.data && result.data[0]) {
      const savedCustomer = mapCustomerFromDb(result.data[0]);
      setCustomers([...customers, { ...savedCustomer, email: customer.email, address: customer.address }]);
    } else {
      setCustomers([...customers, customer]);
    }
  };
  
  const updateCustomer = async (updatedCustomer: Customer) => {
    if (user?.id === 'guest') {
      setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
      return;
    }
    const dbPayload = mapCustomerToDb(updatedCustomer, user?.id || '');
    let { error } = await supabase.from('customers').update(dbPayload).eq('id', updatedCustomer.id);
    
    // Highly resilient update fallback
    if (error) {
      console.warn('First customer update attempt failed, trying safe fallback:', error.message);
      const safePayload = {
        name: updatedCustomer.name,
        phone: updatedCustomer.phone,
        email: updatedCustomer.email || '',
        address: updatedCustomer.address || ''
      };
      
      const retryResult = await supabase.from('customers').update(safePayload).eq('id', updatedCustomer.id);
      error = retryResult.error;
      
      if (error) {
        console.warn('Secondary customer update attempt failed, trying minimalist fallback:', error.message);
        const minimalistPayload = {
          name: updatedCustomer.name,
          phone: updatedCustomer.phone
        };
        const secondRetry = await supabase.from('customers').update(minimalistPayload).eq('id', updatedCustomer.id);
        error = secondRetry.error;
      }
    }
    
    if (error) {
      console.error('Error updating customer in database:', error);
      throw new Error(`কাস্টমার আপডেট করতে সমস্যা হয়েছে: ${error.message}`);
    }
    setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  };

  const deleteCustomer = async (customerId: string) => {
    if (user?.id === 'guest') {
      setCustomers(customers.filter(c => c.id !== customerId));
      return;
    }
    const { error } = await supabase.from('customers').delete().eq('id', customerId);
    if (error) {
      console.error('Error deleting customer from database:', error);
      throw new Error(`কাস্টমার মুছতে সমস্যা হয়েছে: ${error.message}`);
    }
    setCustomers(customers.filter(c => c.id !== customerId));
  };

  const addExpense = async (expense: Expense) => {
    if (user?.id === 'guest') {
      const newExpense = { ...expense, id: Math.random().toString(36).substr(2, 9) };
      setExpenses([newExpense, ...expenses]);
      return;
    }
    const dbPayload = mapExpenseToDb(expense, user?.id || '');
    let result = await supabase.from('expenses').insert([dbPayload]).select();
    
    // Check if inserting with 'title' failed because it was missing in the schema
    if (result.error && (result.error.message.toLowerCase().includes('title') || result.error.message.toLowerCase().includes('column'))) {
      console.warn('Handling missing title column in expenses db error, retrying with description instead:', result.error);
      const altPayload = { ...dbPayload };
      delete (altPayload as any).title;
      (altPayload as any).description = expense.description;
      
      result = await supabase.from('expenses').insert([altPayload]).select();
      
      if (result.error) {
        console.warn('Handling missing description column in expenses, retrying with both title & description removed:', result.error);
        const safePayload = { ...dbPayload };
        delete (safePayload as any).title;
        delete (safePayload as any).description;
        result = await supabase.from('expenses').insert([safePayload]).select();
      }
    }
    
    if (result.error) {
      console.error('Error inserting expense to database:', result.error);
      throw new Error(`খরচ যোগ করতে সমস্যা হয়েছে: ${result.error.message}`);
    }
    if (result.data && result.data[0]) {
      const savedExpense = mapExpenseFromDb(result.data[0]);
      if (!savedExpense.description && expense.description) {
        savedExpense.description = expense.description;
      }
      setExpenses([savedExpense, ...expenses]);
    } else {
      setExpenses([expense, ...expenses]);
    }
  };

  const updateExpense = async (updatedExpense: Expense) => {
    if (user?.id === 'guest') {
      setExpenses(expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e));
      return;
    }
    const dbPayload = mapExpenseToDb(updatedExpense, user?.id || '');
    let result = await supabase.from('expenses').update(dbPayload).eq('id', updatedExpense.id).select();
    
    // Check if updating with 'title' failed because it was missing in the schema
    if (result.error && (result.error.message.toLowerCase().includes('title') || result.error.message.toLowerCase().includes('column'))) {
      console.warn('Handling missing title column in expenses db update error, retrying with description instead:', result.error);
      const altPayload = { ...dbPayload };
      delete (altPayload as any).title;
      (altPayload as any).description = updatedExpense.description;
      
      result = await supabase.from('expenses').update(altPayload).eq('id', updatedExpense.id).select();
      
      if (result.error) {
        console.warn('Handling missing description column in expenses update, retrying with both title & description removed:', result.error);
        const safePayload = { ...dbPayload };
        delete (safePayload as any).title;
        delete (safePayload as any).description;
        result = await supabase.from('expenses').update(safePayload).eq('id', updatedExpense.id).select();
      }
    }
    
    if (result.error) {
      console.error('Error updating expense in database:', result.error);
      throw new Error(`খরচ আপডেট করতে সমস্যা হয়েছে: ${result.error.message}`);
    }
    
    setExpenses(expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  };

  const deleteExpense = async (expenseId: string) => {
    if (user?.id === 'guest') {
      setExpenses(expenses.filter(e => e.id !== expenseId));
      return;
    }
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
    if (error) {
      console.error('Error deleting expense from database:', error);
      throw new Error(`খরচ মুছতে সমস্যা হয়েছে: ${error.message}`);
    }
    setExpenses(expenses.filter(e => e.id !== expenseId));
  };

  return (
    <DataContext.Provider value={{ 
      products, 
      sales, 
      customers, 
      expenses,
      isLoading,
      addProduct, 
      updateProduct, 
      deleteProduct,
      addSale, 
      addCustomer, 
      updateCustomer,
      deleteCustomer,
      addExpense,
      updateExpense,
      deleteExpense
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
