import { useState } from 'react';
import { supabase } from '../lib/supabase';
import useUserStore from '../store/userStore';

export const useDeliveries = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useUserStore();

  const createDelivery = async (deliveryData) => {
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error('User not initialized');

      const { data, error } = await supabase
        .from('deliveries')
        .insert([{
          ...deliveryData,
          user_id: user.id,
          status: 'pending',
          payment_method: 'cod'
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('Error creating delivery:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getUserDeliveries = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error('User not initialized');

      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          product:products(name, image_url, price),
          store:stores(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getStoreDeliveries = async (storeId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          product:products(name, image_url, price),
          user:users(full_name, phone, username)
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('Error fetching store deliveries:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (deliveryId, status) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .update({ status, updated_at: new Date() })
        .eq('id', deliveryId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('Error updating delivery status:', err);
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { createDelivery, getUserDeliveries, getStoreDeliveries, updateDeliveryStatus, loading, error };
};
