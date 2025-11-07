"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { isAdmin } from "@/lib/auth"
import type { Product, Category } from "@/types/database"

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showProductForm, setShowProductForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    image_url: '',
    category_id: '',
  })
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon_svg: '',
  })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    const admin = await isAdmin()
    if (!admin) {
      router.push('/admin/login')
      return
    }
    await Promise.all([fetchProducts(), fetchCategories()])
  }

  const fetchProducts = async () => {
    if (!supabase) return
    const { data } = await supabase.from('products').select('*').order('name')
    setProducts((data || []) as Product[])
    setLoading(false)
  }

  const fetchCategories = async () => {
    if (!supabase) return
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories((data || []) as Category[])
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return

    const productData = {
      name: productForm.name,
      description: productForm.description || null,
      image_url: productForm.image_url || null,
      category_id: productForm.category_id ? parseInt(productForm.category_id) : null,
    }

    if (editingProduct) {
      await supabase.from('products').update(productData).eq('id', editingProduct.id)
    } else {
      await supabase.from('products').insert(productData)
    }

    setProductForm({ name: '', description: '', image_url: '', category_id: '' })
    setShowProductForm(false)
    setEditingProduct(null)
    await fetchProducts()
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return

    const categoryData = {
      name: categoryForm.name,
      icon_svg: categoryForm.icon_svg || null,
    }

    if (editingCategory) {
      await supabase.from('categories').update(categoryData).eq('id', editingCategory.id)
    } else {
      await supabase.from('categories').insert(categoryData)
    }

    setCategoryForm({ name: '', icon_svg: '' })
    setShowCategoryForm(false)
    setEditingCategory(null)
    await fetchCategories()
  }

  const handleDeleteProduct = async (id: number) => {
    if (!supabase || !confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    await fetchProducts()
  }

  const handleDeleteCategory = async (id: number) => {
    if (!supabase || !confirm('Delete this category?')) return
    await supabase.from('categories').delete().eq('id', id)
    await fetchCategories()
  }

  if (loading) return <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">Loading...</div>

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 md:mb-8 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">Manage Products & Categories</h1>
        <Link href="/admin/dashboard" className="px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base min-h-[44px] flex items-center justify-center sm:justify-start">Back</Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        {/* Categories Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 gap-2">
            <h2 className="text-xl sm:text-2xl font-semibold">Categories</h2>
            <button onClick={() => setShowCategoryForm(true)} className="px-3 sm:px-4 py-2 bg-yellow-400 rounded-lg text-sm sm:text-base min-h-[44px]">Add Category</button>
          </div>
          {showCategoryForm && (
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
              <form onSubmit={handleCategorySubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Category Name"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm sm:text-base min-h-[44px]"
                />
                <input
                  type="text"
                  placeholder="Icon SVG (optional)"
                  value={categoryForm.icon_svg}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon_svg: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm sm:text-base min-h-[44px]"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button type="submit" className="px-3 sm:px-4 py-2 bg-black text-white rounded-lg text-sm sm:text-base min-h-[44px]">Save</button>
                  <button type="button" onClick={() => { setShowCategoryForm(false); setEditingCategory(null) }} className="px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base min-h-[44px]">Cancel</button>
                </div>
              </form>
            </div>
          )}
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white border rounded-lg gap-2">
                <span className="text-sm sm:text-base">{cat.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, icon_svg: cat.icon_svg || '' }); setShowCategoryForm(true) }} className="px-3 py-1 bg-yellow-400 rounded text-xs sm:text-sm min-h-[44px]">Edit</button>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="px-3 py-1 bg-red-600 text-white rounded text-xs sm:text-sm min-h-[44px]">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Products Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 gap-2">
            <h2 className="text-xl sm:text-2xl font-semibold">Products</h2>
            <button onClick={() => setShowProductForm(true)} className="px-3 sm:px-4 py-2 bg-yellow-400 rounded-lg text-sm sm:text-base min-h-[44px]">Add Product</button>
          </div>
          {showProductForm && (
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
              <form onSubmit={handleProductSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Product Name"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm sm:text-base min-h-[44px]"
                />
                <textarea
                  placeholder="Description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm sm:text-base resize-none"
                  rows={3}
                />
                <input
                  type="url"
                  placeholder="Image URL"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm sm:text-base min-h-[44px]"
                />
                <select
                  value={productForm.category_id}
                  onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm sm:text-base min-h-[44px]"
                >
                  <option value="">No Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button type="submit" className="px-3 sm:px-4 py-2 bg-black text-white rounded-lg text-sm sm:text-base min-h-[44px]">Save</button>
                  <button type="button" onClick={() => { setShowProductForm(false); setEditingProduct(null); setProductForm({ name: '', description: '', image_url: '', category_id: '' }) }} className="px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base min-h-[44px]">Cancel</button>
                </div>
              </form>
            </div>
          )}
          <div className="space-y-2">
            {products.map((product) => (
              <div key={product.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white border rounded-lg gap-2">
                <span className="text-sm sm:text-base">{product.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingProduct(product); setProductForm({ name: product.name, description: product.description || '', image_url: product.image_url || '', category_id: product.category_id?.toString() || '' }); setShowProductForm(true) }} className="px-3 py-1 bg-yellow-400 rounded text-xs sm:text-sm min-h-[44px]">Edit</button>
                  <button onClick={() => handleDeleteProduct(product.id)} className="px-3 py-1 bg-red-600 text-white rounded text-xs sm:text-sm min-h-[44px]">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

