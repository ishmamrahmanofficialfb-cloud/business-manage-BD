import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

const getSupabase = (): SupabaseClient => {
  if (_supabase) return _supabase;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined') {
    throw new Error('Supabase configuration missing');
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
};

// Using a Proxy to lazily initialize Supabase only when it's accessed.
const handler: ProxyHandler<any> = {
  get: (_target, prop) => {
    try {
      const client = getSupabase();
      const value = (client as any)[prop];
      
      // Bind methods to the client to preserve 'this' context
      if (typeof value === 'function') {
        return value.bind(client);
      }
      return value;
    } catch (e) {
      // If someone tries to use supabase before config is set, we return a helpful dummy
      if (prop === 'from') {
        return () => {
          console.error('Supabase keys not found in environment variables.');
          const chainable = {
            select: () => chainable,
            insert: () => chainable,
            update: () => chainable,
            delete: () => chainable,
            order: () => Promise.resolve({ data: null, error: new Error('Config missing') }),
            eq: () => Promise.resolve({ data: null, error: new Error('Config missing') }),
            selectAndResolve: () => Promise.resolve({ data: null, error: new Error('Config missing') })
          };
          // Allow select() to be chained and resolved
          (chainable as any).then = (onfulfilled: any) => onfulfilled({ data: null, error: new Error('Config missing') });
          return chainable;
        };
      }
      if (prop === 'auth') {
        console.error('Supabase keys not found in environment variables. Providing fallback mock auth.');
        return {
          signInWithPassword: () => Promise.resolve({ error: new Error('Config missing') }),
          signUp: () => Promise.resolve({ error: new Error('Config missing') }),
          signOut: () => Promise.resolve({ error: null }),
          getSession: () => Promise.resolve({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          updateUser: () => Promise.resolve({ error: new Error('Config missing') }),
        };
      }
      return undefined;
    }
  }
};

export const supabase = new Proxy({}, handler) as SupabaseClient;
