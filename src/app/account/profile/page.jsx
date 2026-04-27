"use client";

import { useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import { User as UserIcon, Mail, LogOut, Loader2, Key, Calendar, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export default function ProfilePage() {
  const { user, profile, isLoading: authLoading, signOut } = useApp();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/account/signin");
    }
  }, [user, authLoading, router]);

  if (authLoading || (user && !profile)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      
      const data = await res.json();
      const newPhotoURL = data.url;

      // Update Firestore
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { photoURL: newPhotoURL });

      // Update Firebase Auth Profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: newPhotoURL });
      }

      // Reload window to reflect changes globally
      window.location.reload();
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <header className="mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2 block">
            Your Account
          </span>
          <h1 className="text-4xl font-black tracking-tighter uppercase">
            Profile Details
          </h1>
        </header>

        <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          {/* Header Section */}
          <div className="p-8 md:p-12 border-b border-gray-50 flex flex-col md:flex-row items-center gap-8 relative">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100 flex-shrink-0 flex items-center justify-center">
                {user.photoURL || profile?.photoURL ? (
                  <img src={user.photoURL || profile.photoURL} alt="Profile" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                ) : (
                  <UserIcon className="h-12 w-12 text-gray-300 group-hover:opacity-50 transition-opacity" />
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                {isUploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-black tracking-tight mb-2">
                {profile?.name || user?.name || "Anonymous User"}
              </h2>
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 text-sm font-bold text-gray-500 uppercase tracking-widest">
                <span className="flex items-center justify-center md:justify-start gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </span>
                <span className="flex items-center justify-center md:justify-start gap-2">
                  <Key className="h-4 w-4" />
                  Role: {profile?.role || "Customer"}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="absolute top-8 right-8 p-3 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          {/* Details Section */}
          <div className="p-8 md:p-12 bg-gray-50/30">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">
              Account Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Full Name
                  </span>
                </div>
                <p className="font-bold text-lg">{profile?.name || user?.name || "Not provided"}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Email Address
                  </span>
                </div>
                <p className="font-bold text-lg">{user.email}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Member Since
                  </span>
                </div>
                <p className="font-bold text-lg">
                  {profile?.createdAt 
                    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }) 
                    : "Recently joined"}
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Account Status
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${profile?.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className="font-bold text-lg">{profile?.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex gap-4">
              <button onClick={() => router.push('/account/orders')} className="flex-1 bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors">
                View My Orders
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
