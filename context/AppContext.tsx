import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Client, Part, ServiceOrder, User, OrderStatus } from '../types';
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
      const { data: aputureData, error: aputureError } = await supabase
        .from('parts')
        .select('*')
        .order('name');

      const { data: asteraData, error: asteraError } = await supabase
        .from('astera_parts')
        .select('*')
        .order('name');

      const { data: creamSourceData, error: creamSourceError } = await supabase
        .from('cream_source_parts')
        .select('*')
        .order('name');

      if (aputureError) console.error('Error fetching parts:', aputureError);
      if (asteraError) console.error('Error fetching astera parts:', asteraError);
      if (creamSourceError) console.error('Error fetching cream source parts:', creamSourceError);

      let allParts: Part[] = [];

      if (aputureData) {
        const mappedAputure: Part[] = aputureData.map(p => ({
          id: p.id,
          name: p.name,
          code: p.code,
          category: p.category || 'Geral',
          quantity: p.quantity,
          minStock: p.min_stock || 0,
          price: p.price,
          location: p.location || '',
          imageUrl: p.image_url || 'https://picsum.photos/200',
          manufacturer: 'Aputure'
        }));
        allParts = [...allParts, ...mappedAputure];
      }

      if (asteraData) {
        const mappedAstera: Part[] = asteraData.map(p => ({
          id: p.id,
          name: p.name,
          code: p.code,
          category: p.category || 'Astera',
          quantity: p.quantity,
          minStock: p.min_stock || 0,
          price: p.price,
          location: p.location || '',
          imageUrl: p.image_url || 'https://picsum.photos/200',
          manufacturer: 'Astera'
        }));
        allParts = [...allParts, ...mappedAstera];
      }

      if (creamSourceData) {
        const mappedCreamSource: Part[] = creamSourceData.map(p => ({
          id: p.id,
          name: p.name,
          code: p.code,
          category: p.category || 'Cream Source',
          quantity: p.quantity,
          minStock: p.min_stock || 0,
          price: p.price,
          location: p.location || '',
          imageUrl: p.image_url || 'https://picsum.photos/200',
          manufacturer: 'Cream Source' // Type assertion to satisfy the new union type if needed, but updated interface should handle it
        }));
        allParts = [...allParts, ...mappedCreamSource];
      }

      setParts(allParts.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Unexpected error fetching parts:', err);
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
      image_url: part.imageUrl
    });

    if (error) {
      console.error('Error adding part:', error);
      // Revert (not implemented for simplicity in this step)
    } else {
      await fetchParts(); // Refresh to get the real ID
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
      image_url: updatedPart.imageUrl
    }).eq('id', updatedPart.id);

    if (error) {
      console.error('Error updating part:', error);
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
          photos: order.photos
        });

      if (orderError) {
        console.error('Error adding order:', orderError);
        alert('Erro ao salvar ordem de serviço: ' + orderError.message);
        return;
      }

      // Insert order items if any
      if (order.items && order.items.length > 0) {
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
          photos: updatedOrder.photos
        })
        .eq('id', updatedOrder.id);

      if (orderError) {
        console.error('Error updating order:', orderError);
        alert('Erro ao atualizar ordem de serviço: ' + orderError.message);
        return;
      }

      // Delete existing items and re-insert
      await supabase
        .from('service_order_items')
        .delete()
        .eq('service_order_id', updatedOrder.id);

      if (updatedOrder.items && updatedOrder.items.length > 0) {
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
        }
      }

      // Refresh orders list
      await fetchOrders();
    } catch (err) {
      console.error('Unexpected error updating order:', err);
      alert('Erro inesperado ao atualizar ordem de serviço');
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