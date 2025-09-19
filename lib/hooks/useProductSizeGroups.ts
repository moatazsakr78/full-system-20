'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../app/lib/supabase/client';

export interface ProductSizeGroup {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  items?: ProductSizeGroupItem[];
}

export interface ProductSizeGroupItem {
  id: string;
  size_group_id: string;
  product_id: string;
  size_name: string;
  sort_order: number | null;
  created_at: string | null;
  product?: any; // Product details from join
}

export interface CreateProductSizeGroupData {
  name: string;
  description?: string;
  items: {
    product_id: string;
    size_name: string;
    sort_order: number;
  }[];
}

export function useProductSizeGroups() {
  const [sizeGroups, setSizeGroups] = useState<ProductSizeGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all product size groups
  const fetchSizeGroups = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('product_size_groups')
        .select(`
          *,
          product_size_group_items (
            *,
            products (
              id,
              name,
              main_image_url,
              price
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSizeGroups(data || []);
    } catch (error) {
      console.error('Error fetching product size groups:', error);
      setError(error instanceof Error ? error.message : 'خطأ في تحميل مجموعات الأحجام');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new product size group
  const createSizeGroup = async (groupData: CreateProductSizeGroupData) => {
    try {
      setError(null);

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create the size group
      const { data: sizeGroup, error: groupError } = await supabase
        .from('product_size_groups')
        .insert({
          name: groupData.name,
          description: groupData.description,
          created_by: user?.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Create the size group items
      const items = groupData.items.map(item => ({
        size_group_id: sizeGroup.id,
        product_id: item.product_id,
        size_name: item.size_name,
        sort_order: item.sort_order
      }));

      const { error: itemsError } = await supabase
        .from('product_size_group_items')
        .insert(items);

      if (itemsError) {
        // If items creation fails, delete the created group
        await supabase
          .from('product_size_groups')
          .delete()
          .eq('id', sizeGroup.id);
        throw itemsError;
      }

      // Refresh size groups list
      await fetchSizeGroups();

      return sizeGroup;
    } catch (error) {
      console.error('Error creating product size group:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في إنشاء مجموعة الأحجام';
      setError(errorMessage);
      throw error;
    }
  };

  // Update size group
  const updateSizeGroup = async (groupId: string, updates: Partial<ProductSizeGroup>) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('product_size_groups')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setSizeGroups(prev =>
        prev.map(group => group.id === groupId ? { ...group, ...data } : group)
      );

      return data;
    } catch (error) {
      console.error('Error updating product size group:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في تحديث مجموعة الأحجام';
      setError(errorMessage);
      throw error;
    }
  };

  // Delete size group
  const deleteSizeGroup = async (groupId: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('product_size_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      // Update local state
      setSizeGroups(prev => prev.filter(group => group.id !== groupId));
    } catch (error) {
      console.error('Error deleting product size group:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ في حذف مجموعة الأحجام';
      setError(errorMessage);
      throw error;
    }
  };

  // Get size group by id
  const getSizeGroupById = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_size_groups')
        .select(`
          *,
          product_size_group_items (
            *,
            products (
              id,
              name,
              main_image_url,
              price,
              description
            )
          )
        `)
        .eq('id', groupId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching size group:', error);
      throw error;
    }
  };

  // Get products that are part of size groups
  const getProductsInSizeGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('product_size_group_items')
        .select('product_id')
        .not('size_group_id', 'is', null);

      if (error) throw error;

      return data?.map(item => item.product_id) || [];
    } catch (error) {
      console.error('Error fetching products in size groups:', error);
      throw error;
    }
  };

  // Load size groups on mount
  useEffect(() => {
    fetchSizeGroups();
  }, []);

  return {
    sizeGroups,
    isLoading,
    error,
    fetchSizeGroups,
    createSizeGroup,
    updateSizeGroup,
    deleteSizeGroup,
    getSizeGroupById,
    getProductsInSizeGroups
  };
}