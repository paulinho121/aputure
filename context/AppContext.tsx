import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Client, Part, ServiceOrder, User, OrderStatus, ServiceOrderItem } from '../types';
import { supabase } from '../lib/supabase';

interface AppContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;

  parts: Part[];
  addPart: (part: Part) => Promise<void>;
  updatePart: (part: Part) => Promise<void>;
  refreshParts: () => Promise<void>;

  clients: Client[];
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;

  orders: ServiceOrder[];
  addOrder: (order: ServiceOrder) => void;
  updateOrder: (order: ServiceOrder) => void;
  deleteOrder: (orderId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.name || 'Usuário',
          email: session.user.email || '',
          role: 'admin'
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.name || 'Usuário',
          email: session.user.email || '',
          role: 'admin'
        });
      } else {
        setUser(null);
      }
    });

    fetchParts();
    fetchClients();
    fetchOrders();

    return () => subscription.unsubscribe();
  }, []);

  const fetchParts = async () => {
    try {
      console.log('[DEBUG] Starting fetchParts...');
      let allParts: any[] = [];
      const seenIds = new Set<string>();
      const seenKeys = new Set<string>();
      let stats = { parts: 0, astera: 0, cream: 0 };

      // 1. Fetch from 'parts' (Unified / Aputure)
      try {
        const { data, error } = await supabase.from('parts').select('*');
        if (error) {
          console.error('[DEBUG] Error fetching parts table:', error);
        } else if (data) {
          stats.parts = data.length;
          data.forEach(p => {
            const manuf = p.manufacturer || 'Aputure';
            allParts.push({ ...p, manufacturer: manuf });
            seenIds.add(p.id);
            seenKeys.add(`${p.code}-${manuf}`);
          });
        }
      } catch (err) {
        console.error('[DEBUG] Catch in parts fetch:', err);
      }

      // 2. Fetch from 'astera_parts'
      try {
        const { data, error } = await supabase.from('astera_parts').select('*');
        if (error) {
          console.warn('[DEBUG] Error fetching astera_parts:', error);
        } else if (data) {
          stats.astera = data.length;
          data.forEach(p => {
            const key = `${p.code}-Astera`;
            if (!seenIds.has(p.id) && !seenKeys.has(key)) {
              allParts.push({ ...p, manufacturer: 'Astera' });
              seenIds.add(p.id);
              seenKeys.add(key);
            }
          });
        }
      } catch (err) {
        console.warn('[DEBUG] Catch in astera_parts fetch:', err);
      }

      // 3. Fetch from 'cream_source_parts'
      try {
        const { data, error } = await supabase.from('cream_source_parts').select('*');
        if (error) {
          console.warn('[DEBUG] Error fetching cream_source_parts:', error);
        } else if (data) {
          stats.cream = data.length;
          data.forEach(p => {
            const key = `${p.code}-Cream Source`;
            if (!seenIds.has(p.id) && !seenKeys.has(key)) {
              allParts.push({ ...p, manufacturer: 'Cream Source' });
              seenIds.add(p.id);
              seenKeys.add(key);
            }
          });
        }
      } catch (err) {
        console.warn('[DEBUG] Catch in cream_source_parts fetch:', err);
      }

      const mappedParts: Part[] = allParts.map(p => {
        try {
          return {
            id: p.id || Math.random().toString(),
            name: String(p.name || 'Sem nome'),
            code: String(p.code || 'S/C'),
            category: String(p.category || 'Geral'),
            quantity: Number(p.quantity || 0),
            minStock: Number(p.min_stock || 0),
            price: typeof p.price === 'number' ? p.price : (parseFloat(String(p.price || 0).replace(',', '.')) || 0),
            location: String(p.location || ''),
            imageUrl: String(p.image_url || 'https://picsum.photos/200'),
            manufacturer: (p.manufacturer || 'Aputure') as any,
            unitsPerPackage: Number(p.units_per_package || 1)
          };
        } catch (mErr) {
          console.error('[DEBUG] Mapping error for part:', p, mErr);
          return null;
        }
      }).filter(p => p !== null) as Part[];

      mappedParts.sort((a, b) => a.name.localeCompare(b.name));

      console.log(`[DEBUG] Final total parts mapped: ${mappedParts.length}`, stats);

      // If we found zero parts but no errors, it's very strange, so we log it
      if (mappedParts.length === 0 && (stats.parts > 0 || stats.astera > 0 || stats.cream > 0)) {
        console.error('[DEBUG] ERROR: Data was found in tables but mapping resulted in 0 items.');
      }

      setParts(mappedParts);
    } catch (err) {
      console.error('[DEBUG] Fatal error in fetchParts:', err);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching clients:', error);
        return;
      }

      if (data) {
        const mappedClients: Client[] = data.map(c => ({
          id: c.id,
          name: c.name,
          document: c.document,
          email: c.email || '',
          phone: c.phone || '',
          address: c.address || '',
          zipCode: c.zip_code,
          street: c.street,
          number: c.number,
          complement: c.complement,
          neighborhood: c.neighborhood,
          city: c.city,
          state: c.state,
          notes: c.notes
        }));
        setClients(mappedClients);
      }
    } catch (err) {
      console.error('Unexpected error fetching clients:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('service_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return;
      }

      if (ordersData) {
        // Fetch items for all orders
        const { data: itemsData, error: itemsError } = await supabase
          .from('service_order_items')
          .select('*');

        if (itemsError) {
          console.error('Error fetching order items:', itemsError);
        }

        const mappedOrders: ServiceOrder[] = ordersData.map(o => {
          const orderItems = itemsData?.filter(item => item.service_order_id === o.id) || [];

          return {
            id: o.id,
            clientId: o.client_id,
            model: o.model,
            serialNumber: o.serial_number || '',
            condition: o.condition || '',
            faultDescription: o.fault_description || '',
            accessories: o.accessories || [],
            entryDate: o.entry_date,
            status: o.status as OrderStatus,
            serviceType: o.service_type as 'Paid' | 'Warranty',
            items: orderItems.map(item => ({
              partId: item.part_id,
              quantity: item.quantity,
              unitPrice: parseFloat(item.unit_price)
            })),
            laborCost: parseFloat(o.labor_cost) || 0,
            laborDescription: o.labor_description || '',
            shippingMethod: o.shipping_method,
            shippingCost: parseFloat(o.shipping_cost) || 0,
            discount: parseFloat(o.discount) || 0,
            paymentMethod: o.payment_method,
            paymentProofUrl: o.payment_proof_url,
            invoiceNumber: o.invoice_number,
            technicalReport: o.technical_report || '',
            photos: o.photos || []
          };
        });

        setOrders(mappedOrders);
      }
    } catch (err) {
      console.error('Unexpected error fetching orders:', err);
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    if (data.user) {
      setUser({
        id: data.user.id,
        name: data.user.user_metadata.name || 'Usuário',
        email: data.user.email || '',
        role: 'admin'
      });
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const addPart = async (part: Part) => {
    // Optimistic update
    setParts([...parts, part]);

    // Save to DB
    const { error } = await supabase.from('parts').insert({
      name: part.name,
      code: part.code,
      category: part.category,
      quantity: part.quantity,
      min_stock: part.minStock,
      price: part.price,
      location: part.location,
      image_url: part.imageUrl,
      manufacturer: part.manufacturer || 'Aputure',
      units_per_package: part.unitsPerPackage || 1
    });

    if (error) {
      console.error('Error adding part:', error);
      alert('Erro ao salvar peça no banco de dados: ' + error.message);
      // Revert optimistic update
      setParts(parts.filter(p => p.id !== part.id));
    } else {
      await fetchParts(); // Refresh to get the real ID from DB
    }
  };

  const updatePart = async (updatedPart: Part) => {
    // Optimistic update
    setParts(parts.map(p => p.id === updatedPart.id ? updatedPart : p));

    const { error } = await supabase.from('parts').update({
      name: updatedPart.name,
      code: updatedPart.code,
      category: updatedPart.category,
      quantity: updatedPart.quantity,
      min_stock: updatedPart.minStock,
      price: updatedPart.price,
      location: updatedPart.location,
      image_url: updatedPart.imageUrl,
      manufacturer: updatedPart.manufacturer,
      units_per_package: updatedPart.unitsPerPackage
    }).eq('id', updatedPart.id);

    if (error) {
      console.error('Error updating part:', error);
      alert('Erro ao atualizar peça: ' + error.message);
      // Refresh to ensure local state matches DB
      await fetchParts();
    }
  };

  const addClient = async (client: Client) => {
    try {
      // Insert into database
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: client.name,
          document: client.document,
          email: client.email,
          phone: client.phone,
          address: client.address,
          zip_code: client.zipCode,
          street: client.street,
          number: client.number,
          complement: client.complement,
          neighborhood: client.neighborhood,
          city: client.city,
          state: client.state,
          notes: client.notes
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding client:', error);
        alert('Erro ao salvar cliente: ' + error.message);
        return;
      }

      // Refresh clients list
      await fetchClients();
    } catch (err) {
      console.error('Unexpected error adding client:', err);
      alert('Erro inesperado ao salvar cliente');
    }
  };

  const updateClient = async (updatedClient: Client) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: updatedClient.name,
          document: updatedClient.document,
          email: updatedClient.email,
          phone: updatedClient.phone,
          address: updatedClient.address,
          zip_code: updatedClient.zipCode,
          street: updatedClient.street,
          number: updatedClient.number,
          complement: updatedClient.complement,
          neighborhood: updatedClient.neighborhood,
          city: updatedClient.city,
          state: updatedClient.state,
          notes: updatedClient.notes
        })
        .eq('id', updatedClient.id);

      if (error) {
        console.error('Error updating client:', error);
        alert('Erro ao atualizar cliente: ' + error.message);
        return;
      }

      await fetchClients();
    } catch (err) {
      console.error('Unexpected error updating client:', err);
      alert('Erro inesperado ao atualizar cliente');
    }
  };

  const ensurePartsExist = async (items: ServiceOrderItem[]) => {
    for (const item of items) {
      try {
        const { data: exists } = await supabase.from('parts').select('id').eq('id', item.partId).maybeSingle();

        if (!exists) {
          console.log(`[DEBUG] Part ${item.partId} not found in 'parts' table. Attempting auto-migration...`);
          const partToMigrate = parts.find(p => p.id === item.partId);

          if (partToMigrate) {
            // Try inserting with all columns (new schema)
            let { error: migError } = await supabase.from('parts').insert({
              id: partToMigrate.id,
              name: partToMigrate.name,
              code: partToMigrate.code,
              category: partToMigrate.category,
              quantity: partToMigrate.quantity,
              min_stock: partToMigrate.minStock,
              price: partToMigrate.price,
              location: partToMigrate.location,
              image_url: partToMigrate.imageUrl,
              manufacturer: partToMigrate.manufacturer || 'Aputure',
              units_per_package: partToMigrate.unitsPerPackage || 1
            });

            // FALLBACK: If columns don't exist, try plain insert (old schema)
            if (migError && (migError.message.includes('column "manufacturer" does not exist') || migError.message.includes('column "units_per_package" does not exist'))) {
              console.log(`[DEBUG] New columns missing in 'parts', retrying simple migration for ${partToMigrate.name}`);
              const { error: fallbackError } = await supabase.from('parts').insert({
                id: partToMigrate.id,
                name: partToMigrate.name,
                code: partToMigrate.code,
                category: partToMigrate.category,
                quantity: partToMigrate.quantity,
                min_stock: partToMigrate.minStock,
                price: partToMigrate.price,
                location: partToMigrate.location,
                image_url: partToMigrate.imageUrl
              });
              migError = fallbackError;
            }

            if (migError) {
              console.error(`[DEBUG] Auto-migration failed for ${partToMigrate.name}:`, migError);
            } else {
              console.log(`[DEBUG] Auto-migration successful for ${partToMigrate.name}`);
            }
          }
        }
      } catch (err) {
        console.error('[DEBUG] Error checking/migrating part:', err);
      }
    }
  };

  const addOrder = async (order: ServiceOrder) => {
    try {
      // Insert order into database
      const { error: orderError } = await supabase
        .from('service_orders')
        .insert({
          id: order.id,
          client_id: order.clientId,
          model: order.model,
          serial_number: order.serialNumber,
          condition: order.condition,
          fault_description: order.faultDescription,
          accessories: order.accessories,
          entry_date: order.entryDate,
          status: order.status,
          labor_cost: order.laborCost,
          labor_description: order.laborDescription,
          service_type: order.serviceType,
          shipping_method: order.shippingMethod,
          shipping_cost: order.shippingCost,
          discount: order.discount,
          payment_method: order.paymentMethod,
          payment_proof_url: order.paymentProofUrl,
          invoice_number: order.invoiceNumber,
          technical_report: order.technicalReport,
          photos: order.photos
        });

      if (orderError) {
        console.error('Error adding order:', orderError);
        alert('Erro ao salvar ordem de serviço: ' + orderError.message);
        return;
      }

      // Insert order items if any
      if (order.items && order.items.length > 0) {
        // Ensure parts exist in main table first
        await ensurePartsExist(order.items);

        const itemsToInsert = order.items.map(item => ({
          service_order_id: order.id,
          part_id: item.partId,
          quantity: item.quantity,
          unit_price: item.unitPrice
        }));

        const { error: itemsError } = await supabase
          .from('service_order_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Error adding order items:', itemsError);
          alert('Erro ao inserir itens no orçamento: ' + itemsError.message);
        }
      }

      // Refresh orders list
      await fetchOrders();
    } catch (err) {
      console.error('Unexpected error adding order:', err);
      alert('Erro inesperado ao salvar ordem de serviço');
    }
  };

  const updateOrder = async (updatedOrder: ServiceOrder) => {
    try {
      // Update order in database
      const { error: orderError } = await supabase
        .from('service_orders')
        .update({
          client_id: updatedOrder.clientId,
          model: updatedOrder.model,
          serial_number: updatedOrder.serialNumber,
          condition: updatedOrder.condition,
          fault_description: updatedOrder.faultDescription,
          accessories: updatedOrder.accessories,
          status: updatedOrder.status,
          labor_cost: updatedOrder.laborCost,
          labor_description: updatedOrder.laborDescription,
          service_type: updatedOrder.serviceType,
          shipping_method: updatedOrder.shippingMethod,
          shipping_cost: updatedOrder.shippingCost,
          discount: updatedOrder.discount,
          payment_method: updatedOrder.paymentMethod,
          payment_proof_url: updatedOrder.paymentProofUrl,
          invoice_number: updatedOrder.invoiceNumber,
          technical_report: updatedOrder.technicalReport,
          photos: updatedOrder.photos
        })
        .eq('id', updatedOrder.id);

      if (orderError) {
        console.error('Error updating order:', orderError);
        alert('Erro ao atualizar ordem de serviço: ' + orderError.message);
        return;
      }

      // Delete existing items and re-insert
      const { error: deleteError } = await supabase
        .from('service_order_items')
        .delete()
        .eq('service_order_id', updatedOrder.id);

      if (deleteError) {
        console.error('Error deleting old items:', deleteError);
        alert('Erro ao limpar itens antigos: ' + deleteError.message);
        return;
      }

      if (updatedOrder.items && updatedOrder.items.length > 0) {
        // AUTO-MIGRATION SAFETY NET:
        // Ensure all part IDs exist in the main 'parts' table before linking them
        await ensurePartsExist(updatedOrder.items);

        const itemsToInsert = updatedOrder.items.map(item => ({
          service_order_id: updatedOrder.id,
          part_id: item.partId,
          quantity: item.quantity,
          unit_price: item.unitPrice
        }));

        const { error: itemsError } = await supabase
          .from('service_order_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Error updating order items:', itemsError);
          alert('Erro ao inserir novos itens no orçamento. Por favor, certifique-se de que a unificação das tabelas de estoque foi realizada na aba Manutenção. Erro: ' + itemsError.message);
        }
      }

      // Refresh orders list
      await fetchOrders();
    } catch (err: any) {
      console.error('Unexpected error updating order:', err);
      alert('Erro inesperado ao atualizar ordem de serviço: ' + (err.message || String(err)));
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      // Delete order items first (though cascade might handle it)
      const { error: itemsError } = await supabase
        .from('service_order_items')
        .delete()
        .eq('service_order_id', orderId);

      if (itemsError) {
        console.error('Error deleting order items:', itemsError);
        alert('Erro ao excluir itens da ordem: ' + itemsError.message);
        return;
      }

      // Delete the order
      const { error: orderError } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', orderId);

      if (orderError) {
        console.error('Error deleting order:', orderError);
        alert('Erro ao excluir ordem de serviço: ' + orderError.message);
        return;
      }

      // Update local state
      setOrders(orders.filter(o => o.id !== orderId));
    } catch (err) {
      console.error('Unexpected error deleting order:', err);
      alert('Erro inesperado ao excluir ordem de serviço');
    }
  };

  return (
    <AppContext.Provider value={{
      user, login, signup, logout,
      parts, addPart, updatePart, refreshParts: fetchParts,
      clients, addClient, updateClient,
      orders, addOrder, updateOrder, deleteOrder
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};