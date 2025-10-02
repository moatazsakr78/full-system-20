'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../app/lib/supabase/client';

export interface CustomSection {
  id: string;
  name: string;
  description?: string;
  section_key: string;
  is_active: boolean;
  display_order: number;
  products: any[];
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface CustomSectionProduct {
  id: string;
  name: string;
  main_image_url?: string;
  price: number;
  description?: string;
  finalPrice?: number;
  discount_percentage?: number;
}

export function useCustomSections() {
  const [sections, setSections] = useState<CustomSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all custom sections
  const fetchSections = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('custom_sections')
        .select('*')
        .order('display_order', { ascending: true });

      if (fetchError) {
        console.error('Error fetching custom sections:', fetchError);
        setError(fetchError.message);
        return;
      }

      // Parse products from JSON for each section
      const parsedSections = data?.map(section => ({
        ...section,
        products: Array.isArray(section.products) ? section.products : []
      })) || [];

      setSections(parsedSections);
    } catch (err) {
      console.error('Error in fetchSections:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch active custom sections only
  const fetchActiveSections = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('custom_sections')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) {
        console.error('Error fetching active custom sections:', fetchError);
        setError(fetchError.message);
        return;
      }

      // Parse products from JSON for each section
      const parsedSections = data?.map(section => ({
        ...section,
        products: Array.isArray(section.products) ? section.products : []
      })) || [];

      setSections(parsedSections);
    } catch (err) {
      console.error('Error in fetchActiveSections:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch sections with full product details
  const fetchSectionsWithProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('custom_sections')
        .select('*')
        .order('display_order', { ascending: true });

      if (fetchError) {
        console.error('Error fetching custom sections:', fetchError);
        setError(fetchError.message);
        return [];
      }

      // Fetch full product details for each section
      const sectionsWithProducts = await Promise.all(
        (data || []).map(async (section) => {
          const productIds = Array.isArray(section.products) ? section.products : [];

          if (productIds.length === 0) {
            return { ...section, productDetails: [] };
          }

          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name, description, main_image_url, sub_image_url, price, discount_percentage, discount_amount, is_hidden, rating, rating_count')
            .in('id', productIds)
            .eq('is_hidden', false);

          if (productsError) {
            console.error('Error fetching section products:', productsError);
            return { ...section, productDetails: [] };
          }

          // Calculate final prices for products with discounts
          const productsWithPrices = (products || []).map(product => {
            const hasDiscount = product.discount_percentage && product.discount_percentage > 0;
            const finalPrice = hasDiscount
              ? Number(product.price) * (1 - Number(product.discount_percentage) / 100)
              : Number(product.price);

            return {
              ...product,
              finalPrice,
              hasDiscount
            };
          });

          return { ...section, productDetails: productsWithPrices };
        })
      );

      setSections(sectionsWithProducts);
      return sectionsWithProducts;
    } catch (err) {
      console.error('Error in fetchSectionsWithProducts:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new custom section
  const createSection = useCallback(async (sectionData: Partial<CustomSection>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error: createError } = await supabase
        .from('custom_sections')
        .insert({
          name: sectionData.name,
          description: sectionData.description || '',
          section_key: sectionData.section_key || `section-${Date.now()}`,
          is_active: sectionData.is_active !== undefined ? sectionData.is_active : true,
          display_order: sectionData.display_order || 0,
          products: sectionData.products || [],
          created_by: user?.id || null
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating custom section:', createError);
        throw createError;
      }

      // Refresh sections
      await fetchSections();
      return data;
    } catch (err) {
      console.error('Error in createSection:', err);
      throw err;
    }
  }, [fetchSections]);

  // Update an existing custom section
  const updateSection = useCallback(async (sectionId: string, updates: Partial<CustomSection>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('custom_sections')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sectionId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating custom section:', updateError);
        throw updateError;
      }

      // Refresh sections
      await fetchSections();
      return data;
    } catch (err) {
      console.error('Error in updateSection:', err);
      throw err;
    }
  }, [fetchSections]);

  // Delete a custom section
  const deleteSection = useCallback(async (sectionId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('custom_sections')
        .delete()
        .eq('id', sectionId);

      if (deleteError) {
        console.error('Error deleting custom section:', deleteError);
        throw deleteError;
      }

      // Refresh sections
      await fetchSections();
    } catch (err) {
      console.error('Error in deleteSection:', err);
      throw err;
    }
  }, [fetchSections]);

  // Add products to a section
  const addProductsToSection = useCallback(async (sectionId: string, productIds: string[]) => {
    try {
      // Get current section
      const { data: section, error: fetchError } = await supabase
        .from('custom_sections')
        .select('products')
        .eq('id', sectionId)
        .single();

      if (fetchError) throw fetchError;

      const currentProducts = Array.isArray(section.products) ? section.products : [];
      const updatedProducts = [...new Set([...currentProducts, ...productIds])]; // Remove duplicates

      const { error: updateError } = await supabase
        .from('custom_sections')
        .update({
          products: updatedProducts,
          updated_at: new Date().toISOString()
        })
        .eq('id', sectionId);

      if (updateError) throw updateError;

      // Refresh sections
      await fetchSections();
    } catch (err) {
      console.error('Error in addProductsToSection:', err);
      throw err;
    }
  }, [fetchSections]);

  // Remove products from a section
  const removeProductsFromSection = useCallback(async (sectionId: string, productIds: string[]) => {
    try {
      // Get current section
      const { data: section, error: fetchError } = await supabase
        .from('custom_sections')
        .select('products')
        .eq('id', sectionId)
        .single();

      if (fetchError) throw fetchError;

      const currentProducts = Array.isArray(section.products) ? section.products : [];
      const updatedProducts = currentProducts.filter((id: string) => !productIds.includes(id));

      const { error: updateError } = await supabase
        .from('custom_sections')
        .update({
          products: updatedProducts,
          updated_at: new Date().toISOString()
        })
        .eq('id', sectionId);

      if (updateError) throw updateError;

      // Refresh sections
      await fetchSections();
    } catch (err) {
      console.error('Error in removeProductsFromSection:', err);
      throw err;
    }
  }, [fetchSections]);

  // Reorder sections
  const reorderSections = useCallback(async (reorderedSections: CustomSection[]) => {
    try {
      const updates = reorderedSections.map((section, index) => ({
        id: section.id,
        display_order: index
      }));

      const { error: updateError } = await supabase
        .rpc('update_custom_sections_order', { sections_data: updates });

      if (updateError) {
        // Fallback to individual updates if RPC doesn't exist
        await Promise.all(
          updates.map(update =>
            supabase
              .from('custom_sections')
              .update({ display_order: update.display_order, updated_at: new Date().toISOString() })
              .eq('id', update.id)
          )
        );
      }

      // Refresh sections
      await fetchSections();
    } catch (err) {
      console.error('Error in reorderSections:', err);
      throw err;
    }
  }, [fetchSections]);

  // Initial fetch
  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  return {
    sections,
    isLoading,
    error,
    fetchSections,
    fetchActiveSections,
    fetchSectionsWithProducts,
    createSection,
    updateSection,
    deleteSection,
    addProductsToSection,
    removeProductsFromSection,
    reorderSections
  };
}
