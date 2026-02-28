import React, { useState, useEffect } from 'react';
import { getBrandProfile, updateBrandProfile } from '../lib/api.jsx'; // Updated import
import { Save, User, Target, MessageSquare, Briefcase, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState('brand');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getBrandProfile(user.id);
        setProfile(data);
      } catch (error) {
        console.error("Failed to load brand profile:", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchProfile();
  }, [user?.id]);

  const handleSave = async () => {
    if (!profile || !user?.id) return;

    setSaving(true);
    setSaveFeedback(null);

    try {
      await updateBrandProfile(user.id, profile);
      setSaveFeedback('Profile updated successfully!');
    } catch (error) {
      console.error("Failed to save profile:", error);
      setSaveFeedback('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  const updateProfile = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (field, index, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setProfile(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="p-6 neo-grid-bg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-neo-foreground mb-6">Settings</h1>
          <div className="neo-card flex items-center justify-center p-12">
            <p>Loading brand profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 neo-grid-bg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-neo-foreground mb-6">Settings</h1>
          <div className="neo-card flex items-center justify-center p-12">
            <p className="text-red-500 font-bold">Failed to load brand profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 neo-grid-bg">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-neo-foreground">Brand Profile Settings</h1>
          <button
            onClick={void handleSave}
            className="neo-button"
            disabled={saving}
          >
            {saving ? 'Saving...' : <><Save size={16} className="mr-2" /> Save Changes</>}
          </button>
        </div>

        {saveFeedback && (
          <div className={`mb-6 p-3 rounded-neo text-sm font-medium ${saveFeedback.includes('successfully') ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'} border-2`}>
            {saveFeedback}
          </div>
        )}

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('brand')}
            className={`neo-button secondary ${activeTab === 'brand' ? '!bg-purple-electric !text-white' : ''}`}
          >
            <User size={16} className="mr-2" /> Brand Identity
          </button>
          <button
            onClick={() => setActiveTab('audience')}
            className={`neo-button secondary ${activeTab === 'audience' ? '!bg-purple-electric !text-white' : ''}`}
          >
            <Target size={16} className="mr-2" /> Audience & Voice
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`neo-button secondary ${activeTab === 'content' ? '!bg-purple-electric !text-white' : ''}`}
          >
            <MessageSquare size={16} className="mr-2" /> Content Strategy
          </button>
          <button
            onClick={() => setActiveTab('business')}
            className={`neo-button secondary ${activeTab === 'business' ? '!bg-purple-electric !text-white' : ''}`}
          >
            <Briefcase size={16} className="mr-2" /> Business Info
          </button>
        </div>

        {activeTab === 'brand' && (
          <div className="neo-card">
            <h2 className="text-xl font-bold text-neo-foreground mb-4">Brand Identity</h2>
            <div className="space-y-6">
              <div>
                <label className="neo-label">Brand Name</label>
                <input
                  type="text"
                  className="neo-input"
                  value={profile.brandName || ''}
                  onChange={(e) => updateProfile('brandName', e.target.value)}
                  placeholder="Your brand/company name"
                />
              </div>

              <div>
                <label className="neo-label">Brand Definition</label>
                <textarea
                  className="neo-input h-32 resize-y"
                  value={profile.definition || ''}
                  onChange={(e) => updateProfile('definition', e.target.value)}
                  placeholder="What does your brand stand for? What makes you unique?"
                ></textarea>
              </div>

              <div>
                <label className="neo-label">Mission Statement</label>
                <textarea
                  className="neo-input h-24 resize-y"
                  value={profile.mission || ''}
                  onChange={(e) => updateProfile('mission', e.target.value)}
                  placeholder="Your brand's mission and purpose"
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audience' && (
          <div className="neo-card">
            <h2 className="text-xl font-bold text-neo-foreground mb-4">Audience & Voice</h2>
            <div className="space-y-6">
              <div>
                <label className="neo-label">Target Audience</label>
                {profile.audience?.map((aud, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      className="neo-input flex-1"
                      value={aud}
                      onChange={(e) => updateArrayField('audience', index, e.target.value)}
                      placeholder="e.g., Healthcare professionals, Tech entrepreneurs"
                    />
                    <button
                      onClick={() => removeArrayItem('audience', index)}
                      className="neo-button secondary px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                )) ?? null}
                <button
                  onClick={() => addArrayItem('audience')}
                  className="neo-button secondary mt-2"
                >
                  Add Audience Segment
                </button>
              </div>

              <div>
                <label className="neo-label">Brand Tones</label>
                {profile.tones?.map((tone, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      className="neo-input flex-1"
                      value={tone}
                      onChange={(e) => updateArrayField('tones', index, e.target.value)}
                      placeholder="e.g., Professional, Witty, Authoritative"
                    />
                    <button
                      onClick={() => removeArrayItem('tones', index)}
                      className="neo-button secondary px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                )) ?? null}
                <button
                  onClick={() => addArrayItem('tones')}
                  className="neo-button secondary mt-2"
                >
                  Add Tone
                </button>
              </div>

              <div>
                <label className="neo-label">Copy Guidelines</label>
                <textarea
                  className="neo-input h-32 resize-y"
                  value={profile.copyGuideline || ''}
                  onChange={(e) => updateProfile('copyGuideline', e.target.value)}
                  placeholder="Writing style preferences, word choices, formatting rules..."
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="neo-card">
            <h2 className="text-xl font-bold text-neo-foreground mb-4">Content Strategy</h2>
            <div className="space-y-6">
              <div>
                <label className="neo-label">Content Strategy Overview</label>
                <textarea
                  className="neo-input h-32 resize-y"
                  value={profile.contentStrategy || ''}
                  onChange={(e) => updateProfile('contentStrategy', e.target.value)}
                  placeholder="Your overall content approach, themes, and goals..."
                ></textarea>
              </div>

              <div>
                <label className="neo-label flex items-center">
                  <AlertTriangle size={16} className="mr-2 text-red-500" />
                  Taboo Topics
                </label>
                {profile.taboos?.map((taboo, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      className="neo-input flex-1"
                      value={taboo}
                      onChange={(e) => updateArrayField('taboos', index, e.target.value)}
                      placeholder="Topics or language to avoid"
                    />
                    <button
                      onClick={() => removeArrayItem('taboos', index)}
                      className="neo-button secondary px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                )) ?? null}
                <button
                  onClick={() => addArrayItem('taboos')}
                  className="neo-button secondary mt-2"
                >
                  Add Taboo Topic
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'business' && (
          <div className="neo-card">
            <h2 className="text-xl font-bold text-neo-foreground mb-4">Business Information</h2>
            <div className="space-y-6">
              <div>
                <label className="neo-label">Industry/Niche</label>
                <input
                  type="text"
                  className="neo-input"
                  value={profile.industry || ''}
                  onChange={(e) => updateProfile('industry', e.target.value)}
                  placeholder="e.g., Healthcare Technology, Financial Services"
                />
              </div>

              <div>
                <label className="neo-label">Key Offers/Services</label>
                {profile.offers?.map((offer, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      className="neo-input flex-1"
                      value={offer}
                      onChange={(e) => updateArrayField('offers', index, e.target.value)}
                      placeholder="e.g., AI Consulting, SaaS Platform, Online Course"
                    />
                    <button
                      onClick={() => removeArrayItem('offers', index)}
                      className="neo-button secondary px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                )) ?? null}
                <button
                  onClick={() => addArrayItem('offers')}
                  className="neo-button secondary mt-2"
                >
                  Add Offer/Service
                </button>
              </div>

              <div>
                <label className="neo-label">Company Size</label>
                <select
                  className="neo-input"
                  value={profile.companySize || ''}
                  onChange={(e) => updateProfile('companySize', e.target.value)}
                >
                  <option value="">Select company size</option>
                  <option value="solo">Solo entrepreneur</option>
                  <option value="small">Small team (2-10)</option>
                  <option value="medium">Medium company (11-50)</option>
                  <option value="large">Large company (50+)</option>
                </select>
              </div>

              <div>
                <label className="neo-label">Website URL</label>
                <input
                  type="url"
                  className="neo-input"
                  value={profile.website || ''}
                  onChange={(e) => updateProfile('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}