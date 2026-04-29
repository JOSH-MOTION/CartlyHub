"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import useUpload from "@/utils/useUpload";
import { toast } from "sonner";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/utils/firebaseData";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [upload] = useUpload();
  const [isUploading, setIsUploading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    parentId: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    image: "",
    parentId: "",
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
      setForm({ name: "", description: "", image: "", parentId: "" });
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
      setEditForm({ name: "", description: "", image: "", parentId: "" });
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

  const [newSubCategoryName, setNewSubCategoryName] = useState("");

  const handleAddSubcategoryQuick = (e, parentId) => {
    e.preventDefault();
    if (!newSubCategoryName.trim()) return;
    createCategoryMutation.mutate({
      name: newSubCategoryName,
      description: "",
      image: "",
      parentId: parentId
    });
    setNewSubCategoryName("");
  };

  const [expandedParents, setExpandedParents] = useState(new Set());
  
  const toggleExpand = (parentId) => {
    const newSet = new Set(expandedParents);
    if (newSet.has(parentId)) newSet.delete(parentId);
    else newSet.add(parentId);
    setExpandedParents(newSet);
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      description: category.description,
      image: category.image || "",
      parentId: category.parentId || "",
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

  const mainCategories = categories?.filter(c => !c.parentId) || [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
            Inventory
          </span>
          <h2 className="text-4xl font-black tracking-tighter uppercase">Categories Management</h2>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start space-x-3">
          <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
            <X className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-amber-900 mb-1">Notice: Hardcoded Categories</p>
            <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed">
              The application is currently using built-in categories defined in the codebase. 
              Changes made here will not be reflected until they are updated in the source code.
            </p>
          </div>
        </div>
        <button
          disabled
          className="flex items-center space-x-2 bg-gray-100 text-gray-400 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs cursor-not-allowed"
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
                setForm({ name: "", description: "", image: "", parentId: "" });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Category Name
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
                  setForm({ name: "", description: "", image: "", parentId: "" });
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
              {(() => {
                const renderEditForm = (categoryToEdit) => (
                    <td colSpan={4} className="p-8 bg-gray-50 border-x-4 border-black">
                      <div className="flex flex-col space-y-6">
                        <div className="flex justify-between items-center mb-2">
                           <h4 className="font-bold">Edit Category Settings</h4>
                           <button onClick={() => setEditingId(null)}><X className="w-5 h-5"/></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Main Category Name</label>
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none font-medium"
                                placeholder="Main Category Name"
                              />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Description</label>
                              <textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none font-medium h-32 resize-none"
                              />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Image</label>
                              <div className="flex items-center space-x-4">
                                {editForm.image && (
                                  <img src={editForm.image} alt="Category" className="h-16 w-16 object-cover rounded-xl shadow-sm" />
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
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black text-xs font-bold rounded-lg cursor-pointer inline-block transition-colors"
                                  >
                                    {isUploading ? 'Uploading...' : 'Change Image'}
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div className="pt-4">
                              <button onClick={handleUpdate} disabled={updateCategoryMutation.isLoading} className="w-full bg-black hover:bg-gray-800 transition-colors text-white font-bold py-3 rounded-xl uppercase tracking-widest text-xs flex justify-center">
                                {updateCategoryMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Subcategories Management */}
                        {!categoryToEdit.parentId && (
                          <div className="mt-8 pt-6 border-t border-gray-200">
                             <h4 className="font-bold mb-4 uppercase tracking-widest text-sm">Manage Subcategories</h4>
                             <div className="flex flex-wrap gap-2 mb-6">
                               {categories.filter(c => c.parentId === categoryToEdit.id).map(sub => (
                                 <div key={sub.id} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium flex items-center shadow-sm">
                                   <span>{sub.name}</span>
                                   <button onClick={(e) => {
                                      e.preventDefault();
                                      if(confirm('Delete subcategory?')) {
                                          handleDelete(sub.id);
                                      }
                                   }} className="ml-3 text-red-500 hover:bg-red-50 rounded-full p-1 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                 </div>
                               ))}
                               {categories.filter(c => c.parentId === categoryToEdit.id).length === 0 && (
                                 <p className="text-sm text-gray-400 font-bold italic">No subcategories yet.</p>
                               )}
                             </div>
                             <div className="flex items-center space-x-3 max-w-sm">
                               <input 
                                  type="text" 
                                  placeholder="New Subcategory name..." 
                                  value={newSubCategoryName} 
                                  onChange={e => setNewSubCategoryName(e.target.value)}
                                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black"
                                  onKeyDown={(e) => {
                                    if(e.key === 'Enter') handleAddSubcategoryQuick(e, categoryToEdit.id);
                                  }}
                               />
                               <button 
                                 onClick={(e) => handleAddSubcategoryQuick(e, categoryToEdit.id)} 
                                 className="bg-gray-100 hover:bg-gray-200 text-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest font-black transition-colors"
                                 disabled={createCategoryMutation.isLoading}
                               >
                                 Add
                               </button>
                             </div>
                          </div>
                        )}
                      </div>
                    </td>
                );

                return mainCategories?.map((category) => {
                  const subCats = categories.filter(c => c.parentId === category.id);
                  const isExpanded = expandedParents.has(category.id);
                  
                  return (
                    <React.Fragment key={category.id}>
                      {/* MAIN CATEGORY ROW */}
                      <tr className="hover:bg-gray-50 transition-colors">
                        {editingId === category.id ? renderEditForm(category) : (
                          <>
                            <td className="px-8 py-4">
                              <div className="flex items-center space-x-3">
                                {subCats.length > 0 ? (
                                  <button onClick={() => toggleExpand(category.id)} className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-black hover:text-white rounded-lg transition-all shadow-sm">
                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-inherit"/> : <ChevronRight className="w-4 h-4 text-inherit"/>}
                                  </button>
                                ) : (
                                  <div className="w-6 h-6" />
                                )}
                                <div>
                                  <div className="font-bold text-black">{category.name}</div>
                                  <div className="text-[10px] font-black tracking-widest text-gray-400 uppercase mt-1">
                                    {subCats.length > 0 ? `${subCats.length} Subcategories` : "No Subcategories"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-4 text-gray-500 font-medium">
                              {category.description || "-"}
                            </td>
                            <td className="px-8 py-4">
                              {category.image ? (
                                <img src={category.image} alt={category.name} className="h-12 w-12 object-cover rounded-xl shadow-sm border border-gray-100" />
                              ) : (
                                <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                                  <ImageIcon className="h-5 w-5 text-gray-300" />
                                </div>
                              )}
                            </td>
                            <td className="px-8 py-4 text-right">
                              <div className="flex justify-end space-x-2">
                                <button disabled className="p-3 text-gray-400 bg-gray-50 rounded-xl cursor-not-allowed"><Edit className="h-4 w-4" /></button>
                                <button disabled className="p-3 text-gray-300 bg-gray-50 rounded-xl cursor-not-allowed"><Trash2 className="h-4 w-4" /></button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>

                      {/* SUBCATEGORY ROWS */}
                      {isExpanded && subCats.map(sub => (
                        <tr key={sub.id} className="bg-gray-50/80 border-b border-gray-200/50 hover:bg-gray-100 transition-colors">
                          {editingId === sub.id ? renderEditForm(sub) : (
                            <>
                              <td className="px-8 py-4 pl-[4.5rem]">
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-2 rounded-full border-2 border-gray-300" />
                                  <div>
                                    <div className="font-semibold text-gray-700">{sub.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-4 text-gray-500 font-medium">{sub.description || "-"}</td>
                              <td className="px-8 py-4">
                                {sub.image ? (
                                  <img src={sub.image} alt={sub.name} className="h-10 w-10 object-cover rounded-xl shadow-sm border border-gray-100" />
                                ) : (
                                  <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-100">
                                    <ImageIcon className="h-4 w-4 text-gray-300" />
                                  </div>
                                )}
                              </td>
                              <td className="px-8 py-4 text-right">
                                <div className="flex justify-end space-x-2">
                                  <button disabled className="p-2 text-gray-300 cursor-not-allowed"><Edit className="h-4 w-4" /></button>
                                  <button disabled className="p-2 text-gray-300 cursor-not-allowed"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
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
