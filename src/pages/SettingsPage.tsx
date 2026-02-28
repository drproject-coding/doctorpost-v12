import React, { useState, useEffect } from 'react';
import { getBrandProfile, updateBrandProfile, validateOpenAIKey } from '../lib/api';
import { BrandProfile } from '../lib/types';
import { Loader, CheckCircle, XCircle } from 'lucide-react'; // Import icons for validation status
import { useAuth } from '../context/AuthContext'; // Import useAuth

export default function SettingsPage() {
  const { user } = useAuth(); // Get user from AuthContext
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openAIKey, setOpenAIKey] = useState('');
  const [keyValidation, setKeyValidation] = useState<{ success: boolean; message: string; timestamp?: string } | null>(null);
  const [keyValidating, setKeyValidating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getBrandProfile(user.id); // Use user.id
        setProfile(data);
        setOpenAIKey(data.openAIKey ?? ''); // Set the key from fetched profile, use nullish coalescing
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };
    
    void fetchProfile(); // Explicitly ignore the promise
  }, [user?.id]); // Depend on user.id

  const handleOpenAIKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOpenAIKey(e.target.value);
    setKeyValidation(null); // Clear validation status on key change
  };

  const handleValidateKey = async () => {
    if (!openAIKey) {
      setKeyValidation({
        success: false,
        message: 'API key cannot be empty.',
      });
      return;
    }

    setKeyValidating(true);
    try {
      const result = await validateOpenAIKey(openAIKey);
      setKeyValidation(result);

      if (result.success) {
        // Automatically save the key if validation is successful
        await handleSaveProfile(true); // Pass true to indicate it's an auto-save after validation
        setKeyValidation(prev => prev ? { ...prev, message: 'API key validated and saved successfully!' } : null);
      }
    } catch (error) {
      console.error("Error validating OpenAI key:", error);
      setKeyValidation({
        success: false,
        message: 'An error occurred during validation. Please try again.',
      });
    } finally {
      setKeyValidating(false);
    }
  };

  const handleSaveProfile = async (isAutoSave = false) => {
    if (!profile) return;
    
    setSaving(true);
    try {
      // Ensure the latest openAIKey from state is used for saving
      const updatedProfile = { ...profile, openAIKey: openAIKey };
      await updateBrandProfile(updatedProfile); // Use updatedProfile
      setProfile(updatedProfile); // Update local profile state with the new key
      if (!isAutoSave) { // Only show alert if it's a manual save
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      if (!isAutoSave) {
        alert('Failed to save settings. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 neo-grid-bg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-neo-foreground mb-6">Settings</h1>
          <div className="neo-card flex items-center justify-center p-12">
            <p>Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 neo-grid-bg">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-neo-foreground mb-6">Settings</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className="neo-card lg:col-span-2">
            <h2 className="text-xl font-bold text-neo-foreground mb-6">Brand Profile</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="firstName" className="neo-label">First Name</label>
                <input 
                  type="text" 
                  id="firstName" 
                  className="neo-input" 
                  value={profile?.firstName ?? ''} // Use nullish coalescing
                  onChange={(e) => setProfile(prev => prev ? {...prev, firstName: e.target.value} : prev)}
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="neo-label">Last Name</label>
                <input 
                  type="text" 
                  id="lastName" 
                  className="neo-input" 
                  value={profile?.lastName ?? ''} // Use nullish coalescing
                  onChange={(e) => setProfile(prev => prev ? {...prev, lastName: e.target.value} : prev)}
                />
              </div>
              
              <div>
                <label htmlFor="companyName" className="neo-label">Company Name</label>
                <input 
                  type="text" 
                  id="companyName" 
                  className="neo-input" 
                  value={profile?.companyName ?? ''} // Use nullish coalescing
                  onChange={(e) => setProfile(prev => prev ? {...prev, companyName: e.target.value} : prev)}
                />
              </div>
              
              <div>
                <label htmlFor="role" className="neo-label">Role</label>
                <input 
                  type="text" 
                  id="role" 
                  className="neo-input" 
                  value={profile?.role ?? ''} // Use nullish coalescing
                  onChange={(e) => setProfile(prev => prev ? {...prev, role: e.target.value} : prev)}
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="industry" className="neo-label">Industry</label>
              <input 
                type="text" 
                id="industry" 
                className="neo-input" 
                value={profile?.industry ?? ''} // Use nullish coalescing
                onChange={(e) => setProfile(prev => prev ? {...prev, industry: e.target.value} : prev)}
              />
            </div>
            
            <div className="mb-6">
              <label className="neo-label">Audience</label>
              <div className="neo-card p-3 bg-gray-50">
                {profile?.audience.map((audience, index) => (
                  <div key={index} className="flex items-center justify-between mb-2 last:mb-0">
                    <span className="text-sm font-medium">{audience}</span>
                    <button className="text-xs bg-gray-200 p-1 px-2 rounded-neo border-2 border-neo-border font-bold">Edit</button>
                  </div>
                ))}
                <button className="text-sm text-purple-electric font-bold mt-2">+ Add Audience</button>
              </div>
            </div>
            
            <div className="mt-6">
              <button 
                className="neo-button px-6 py-2"
                onClick={() => void handleSaveProfile()} // Manual save
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
          
          {/* API Keys & Integration */}
          <div className="neo-card">
            <h2 className="text-xl font-bold text-neo-foreground mb-6">API Keys & Integration</h2>
            
            <div className="mb-6">
              <label htmlFor="openAIKey" className="neo-label">OpenAI API Key</label>
              <input 
                type="password" 
                id="openAIKey" 
                className="neo-input mb-2" 
                value={openAIKey} 
                onChange={handleOpenAIKeyChange}
                placeholder="sk-..."
              />
              
              <div className="flex space-x-2 items-center">
                <button 
                  className="neo-button px-4 py-2 text-sm"
                  onClick={void handleValidateKey}
                  disabled={keyValidating}
                >
                  {keyValidating ? <><Loader size={16} className="animate-spin mr-2" /> Validating...</> : 'Validate Key'}
                </button>
                
                {keyValidation && (
                  <div className={`text-sm flex items-center font-bold mt-1 ${keyValidation.success ? 'text-green-600' : 'text-red-600'}`}>
                    {keyValidation.success ? <CheckCircle size={16} className="mr-1" /> : <XCircle size={16} className="mr-1" />}
                    {keyValidation.message}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="neo-label">LinkedIn Integration</label>
              <div className="neo-card p-3 bg-gray-50">
                <p className="text-sm font-medium mb-2">Status: Not Connected</p>
                <button className="neo-button px-4 py-2 text-sm w-full">Connect LinkedIn</button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-neo-foreground mt-8 mb-4">Notifications</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="emailNotif" 
                  className="rounded-neo border-neo border-neo-border h-5 w-5 mr-2"
                />
                <label htmlFor="emailNotif" className="text-sm font-medium">Email Notifications</label>
              </div>
              
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="slackNotif" 
                  className="rounded-neo border-neo border-neo-border h-5 w-5 mr-2"
                />
                <label htmlFor="slackNotif" className="text-sm font-medium">Slack Notifications</label>
              </div>
            </div>
          </div>
          
          {/* Brand Guidelines */}
          <div className="neo-card lg:col-span-3">
            <h2 className="text-xl font-bold text-neo-foreground mb-6">Brand Guidelines</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label htmlFor="copyGuideline" className="neo-label">Copy Guideline</label>
                <textarea 
                  id="copyGuideline" 
                  className="neo-input h-32" 
                  value={profile?.copyGuideline ?? ''} // Use nullish coalescing
                  onChange={(e) => setProfile(prev => prev ? {...prev, copyGuideline: e.target.value} : prev)}
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="contentStrategy" className="neo-label">Content Strategy</label>
                <textarea 
                  id="contentStrategy" 
                  className="neo-input h-32" 
                  value={profile?.contentStrategy ?? ''} // Use nullish coalescing
                  onChange={(e) => setProfile(prev => prev ? {...prev, contentStrategy: e.target.value} : prev)}
                ></textarea>
              </div>
            </div>
            
            <div className="mt-6">
              <label htmlFor="definition" className="neo-label">Brand Definition</label>
              <textarea 
                id="definition" 
                className="neo-input" 
                value={profile?.definition ?? ''} // Use nullish coalescing
                onChange={(e) => setProfile(prev => prev ? {...prev, definition: e.target.value} : prev)}
              ></textarea>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                className="neo-button px-6 py-2"
                onClick={() => void handleSaveProfile()} // Manual save
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Guidelines'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}