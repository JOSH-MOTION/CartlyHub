"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import useUpload from "@/utils/useUpload";
import { toast } from "sonner";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/utils/firebaseData";

export default function AdminCategoriesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [upload] = useUpload();
  const [isUploading, setIsUploading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    image: "",
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      return await getCategories();
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data) => {
      return await createCategory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      toast.success("Category created successfully!");
      setForm({ name: "", description: "", image: "" });
      setIsAdding(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create category");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await updateCategory(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      toast.success("Category updated successfully!");
      setEditingId(null);
      setEditForm({ name: "", description: "", image: "" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update category");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => {
      return await deleteCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      toast.success("Category deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete category");
    },
  });

  const handleImageUpload = async (file, isEdit = false) => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target.result;
        const base64Data = result.split(',')[1]; // Remove data URL prefix
        
        if (isEdit) {
          setEditForm({ ...editForm, image: result });
        } else {
          setForm({ ...form, image: result });
        }
        
        toast.success("Image uploaded successfully!");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload image");
      console.error("Image upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createCategoryMutation.mutate(form);
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      description: category.description,
      image: category.image,
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    // Filter out undefined values to prevent Firebase errors, but keep empty strings
    const cleanData = Object.fromEntries(
      Object.entries(editForm).filter(([key, value]) => value !== undefined)
    );
    updateCategoryMutation.mutate({ id: editingId, data: cleanData });
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      deleteCategoryMutation.mutate(id, {
        onError: (error) => {
          console.error('Delete error details:', error);
          if (error.code === 'permission-denied') {
            toast.error("Permission denied. Please update Firebase security rules to allow category deletion.");
          } else if (error.code === 'not-found') {
            toast.error("Category not found or already deleted.");
          } else {
            toast.error(`Failed to delete category: ${error.message}`);
          }
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Back Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Admin Dashboard</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Categories Management</h2>
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </button>
          </div>

      {/* Add Category Form */}
      {isAdding && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Add New Category</h3>
            <button
              onClick={() => {
                setIsAdding(false);
                setForm({ name: "", description: "", image: "" });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Image
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])}
                  className="hidden"
                  id="category-image"
                />
                <label
                  htmlFor="category-image"
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>Choose Image</span>
                </label>
                {form.image && (
                  <img
                    src={form.image}
                    alt="Category preview"
                    className="h-12 w-12 object-cover rounded-lg"
                  />
                )}
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setForm({ name: "", description: "", image: "" });
                }}
                className="px-6 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createCategoryMutation.isLoading}
                className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {createCategoryMutation.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  "Create Category"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-8 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories?.map((category) => (
                <tr key={category.id}>
                  {editingId === category.id ? (
                    <>
                      <td className="px-8 py-4">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </td>
                      <td className="px-8 py-4">
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({ ...editForm, description: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center space-x-2">
                          {editForm.image && (
                            <img
                              src={editForm.image}
                              alt="Category"
                              className="h-12 w-12 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], true)}
                              className="hidden"
                              id={`edit-image-${editingId}`}
                            />
                            <label
                              htmlFor={`edit-image-${editingId}`}
                              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 cursor-pointer"
                            >
                              {isUploading ? 'Uploading...' : 'Change Image'}
                            </label>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={handleUpdate}
                            disabled={updateCategoryMutation.isLoading}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditForm({ name: "", description: "", image: "" });
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-8 py-4 font-medium">{category.name}</td>
                      <td className="px-8 py-4 text-gray-500">
                        {category.description || "-"}
                      </td>
                      <td className="px-8 py-4">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="h-12 w-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (!confirm('Are you sure? This action cannot be undone.')) {
                                return;
                              }
                              handleDelete(category.id);
                            }}
                            disabled={deleteCategoryMutation.isLoading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
        </div>
      </div>
      
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}
