-- Create Purchase Orders table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id text PRIMARY KEY, 
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  entry_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  status text NOT NULL DEFAULT 'Pendente',
  total_amount decimal(10, 2) DEFAULT 0.00,
  payment_method text,
  payment_proof_url text,
  invoice_number text,
  stock_deducted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Purchase Order Items table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  purchase_order_id text REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  part_id uuid REFERENCES public.parts(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10, 2) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Enable all for authenticated users' AND polrelid = 'public.purchase_orders'::regclass) THEN
        CREATE POLICY "Enable all for authenticated users" ON public.purchase_orders FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Enable all for authenticated users' AND polrelid = 'public.purchase_order_items'::regclass) THEN
        CREATE POLICY "Enable all for authenticated users" ON public.purchase_order_items FOR ALL USING (true);
    END IF;
END $$;

-- Add Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_client_id ON public.purchase_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order_id ON public.purchase_order_items(purchase_order_id);
