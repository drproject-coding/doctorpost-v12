"use client";

import React, { useState, useEffect } from 'react';
import { getBrandProfile, updateBrandProfile } from '../../lib/api';
import { BrandProfile } from '../../lib/types';

export default function SettingsPage() {
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getBrandProfile();
      setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    await updateBrandProfile(profile);
    setSaving(false);
    alert('Profile saved successfully! (Mocked)');
  };

  if (loading) {
    return <div className="p-6 text-center">Loading Brand Profile...</div>;
  }

  if (!profile) {
    return <div className="p-6 text-center text-red-500">Failed to load profile.</div>;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => prev ? { ...prev, [name]: value } : null);
  };
  
  const handleArrayChange = (field: keyof BrandProfile, value: string) => {
    setProfile(prev => {
        if (!prev) return null;
        const currentValues = prev[field];
        if (Array.isArray(currentValues)) {
            return { ...prev, [field]: value.split(',').map(item => item.trim()) };
        }
        return prev;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Brand Interview & Voice Profile</h1>
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 space-y-6">
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Brand/Creator Name</label>
            <input type="text" name="name" id="name" value={profile.name} onChange={handleInputChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Industry</label>
            <input type="text" name="industry" id="industry" value={profile.industry} onChange={handleInputChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
          </div>

          <div>
            <label htmlFor="audience" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Audience (comma-separated)</label>
            <input type="text" name="audience" id="audience" value={profile.audience.join(', ')} onChange={(e) => handleArrayChange('audience', e.target.value)} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
          </div>

          <div>
            <label htmlFor="tones" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tones (comma-separated)</label>
            <input type="text" name="tones" id="tones" value={profile.tones.join(', ')} onChange={(e) => handleArrayChange('tones', e.target.value)} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
          </div>

          <div>
            <label htmlFor="offers" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Offers (comma-separated)</label>
            <input type="text" name="offers" id="offers" value={profile.offers.join(', ')} onChange={(e) => handleArrayChange('offers', e.target.value)} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
          </div>

          <div>
            <label htmlFor="taboos" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Taboo Topics (comma-separated)</label>
            <input type="text" name="taboos" id="taboos" value={profile.taboos.join(', ')} onChange={(e) => handleArrayChange('taboos', e.target.value)} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}