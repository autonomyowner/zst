"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { supabase } from "@/lib/supabase";
import AuthLoadingSpinner from "@/components/AuthLoadingSpinner";
import type { ListingWithProduct, Category } from "@/types/database";

export default function EditOffer() {
  const router = useRouter();
  const params = useParams();
  const { user, profile, loading: authLoading } = useAuth();
  const [offer, setOffer] = useState<ListingWithProduct | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    price: "",
    stock_quantity: "",
    min_order_quantity: "",
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user || profile?.role !== "importer") {
        router.push("/login");
        return;
      }

      if (profile?.is_banned) {
        router.push("/banned");
        return;
      }

      fetchOffer();
      fetchCategories();
    }
  }, [user, profile, authLoading, router, params.id]);

  const fetchOffer = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          product:products(*)
        `)
        .eq("id", params.id)
        .eq("seller_id", user?.id)
        .single();

      if (error) throw error;

      if (!data) {
        alert("Offer not found");
        router.push("/importer/offers");
        return;
      }

      setOffer(data);
      setFormData({
        name: data.product?.name || "",
        description: data.product?.description || "",
        category_id: data.product?.category_id?.toString() || "",
        price: data.price.toString(),
        stock_quantity: data.stock_quantity.toString(),
        min_order_quantity: data.min_order_quantity?.toString() || "1",
      });
      if (data.product?.image_url) {
        setImagePreview(data.product.image_url);
      }
    } catch (error) {
      console.error("Error fetching offer:", error);
      alert("Failed to load offer");
      router.push("/importer/offers");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user || !supabase) return null;

    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product_images")
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("product_images").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      alert("Supabase client not initialized");
      return;
    }
    setSaving(true);

    try {
      // Upload new image if provided
      const imageUrl = imageFile ? await uploadImage() : offer?.product?.image_url;

      // Update product
      const { error: productError } = await supabase
        .from("products")
        .update({
          name: formData.name,
          description: formData.description,
          category_id: parseInt(formData.category_id),
          ...(imageUrl && { image_url: imageUrl }),
        })
        .eq("id", offer?.product_id);

      if (productError) throw productError;

      // Update listing
      const { error: listingError } = await supabase
        .from("listings")
        .update({
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity),
          min_order_quantity: parseInt(formData.min_order_quantity),
        })
        .eq("id", params.id);

      if (listingError) throw listingError;

      alert("Offer updated successfully!");
      router.push("/importer/offers");
    } catch (error) {
      console.error("Error updating offer:", error);
      alert("Failed to update offer. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <AuthLoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Bulk Offer</h1>
          <p className="text-gray-600 mt-2">Update your bulk offer details</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category_id"
              required
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Image Upload */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              Product Image
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Price per Unit (DA) *
            </label>
            <input
              type="number"
              id="price"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Stock Quantity */}
          <div>
            <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity *
            </label>
            <input
              type="number"
              id="stock_quantity"
              required
              min="0"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Minimum Order Quantity */}
          <div>
            <label htmlFor="min_order_quantity" className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Order Quantity *
            </label>
            <input
              type="number"
              id="min_order_quantity"
              required
              min="1"
              value={formData.min_order_quantity}
              onChange={(e) => setFormData({ ...formData, min_order_quantity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
