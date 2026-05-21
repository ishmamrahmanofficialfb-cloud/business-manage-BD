-- ম্যানেজ বিডি (Manage BD) - সুপাবেজ ডাটাবেজ স্কিমা
-- এই কোডটি আপনার Supabase SQL Editor-এ রান করুন।

-- ১. প্রোডাক্টস টেবিল
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    price DECIMAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    unit TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ২. কাস্টমারস টেবিল
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    total_spent DECIMAL DEFAULT 0,
    last_visit TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ৩. সেলস টেবিল
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    total_price DECIMAL NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ৪. এক্সপেনস টেবিল (খরচ)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    category TEXT,
    date TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ৫. নিরাপত্তা নিশ্চিত করতে RLS (Row Level Security) এনাবল করা
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ৬. পলিসি তৈরি (প্রত্যেক ইউজার শুধু তার নিজের ডাটা দেখতে ও এডিট করতে পারবে)
CREATE POLICY "Users can manage their own products" ON public.products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own customers" ON public.customers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sales" ON public.sales FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id);
