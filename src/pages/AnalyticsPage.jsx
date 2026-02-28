import React, { useState, useEffect } from 'react';
import { getAnalytics } from '../lib/api.jsx'; // Updated import
import { BarChart2, TrendingUp, Eye, MessageCircle, Share2, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getAnalytics(user.id);
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchAnalytics();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="p-6 neo-grid-bg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-neo-foreground mb-6">Analytics</h1>
          <div className="neo-card flex items-center justify-center p-12">
            <p>Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6 neo-grid-bg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-neo-foreground mb-6">Analytics</h1>
          <div className="neo-card flex items-center justify-center p-12">
            <p className="text-gray-600">No analytics data available yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 neo-grid-bg">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-neo-foreground mb-6">Analytics Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="neo-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">Total Impressions</p>
                <p className="text-2xl font-bold text-neo-foreground">{analytics.totalImpressions?.toLocaleString() ?? 'N/A'}</p>
              </div>
              <Eye className="text-purple-electric" size={32} />
            </div>
          </div>

          <div className="neo-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">Engagement Rate</p>
                <p className="text-2xl font-bold text-neo-foreground">{analytics.ctr ? `${analytics.ctr}%` : 'N/A'}</p>
              </div>
              <TrendingUp className="text-blazing-orange" size={32} />
            </div>
          </div>

          <div className="neo-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">Total Likes</p>
                <p className="text-2xl font-bold text-neo-foreground">{analytics.totalLikes?.toLocaleString() ?? 'N/A'}</p>
              </div>
              <Heart className="text-red-500" size={32} />
            </div>
          </div>

          <div className="neo-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">Total Comments</p>
                <p className="text-2xl font-bold text-neo-foreground">{analytics.totalComments?.toLocaleString() ?? 'N/A'}</p>
              </div>
              <MessageCircle className="text-blue-500" size={32} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="neo-card">
            <h2 className="text-xl font-bold text-neo-foreground mb-4">Top Performing Content Pillars</h2>
            <div className="space-y-4">
              {analytics.pillarPerformance?.length > 0 ? analytics.pillarPerformance.map((pillar, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-neo border border-gray-200">
                  <span className="font-bold text-neo-foreground">{pillar.name}</span>
                  <span className="text-sm font-bold text-purple-electric">{pillar.impressions.toLocaleString()} impressions</span>
                </div>
              )) : (
                <p className="text-center text-gray-600 py-4">No pillar performance data available.</p>
              )}
            </div>
          </div>

          <div className="neo-card">
            <h2 className="text-xl font-bold text-neo-foreground mb-4">Recent Trending Topics</h2>
            <div className="space-y-3">
              {analytics.trendingTopics?.length > 0 ? analytics.trendingTopics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-neo border border-gray-200">
                  <span className="font-medium text-neo-foreground">{topic}</span>
                  <TrendingUp size={16} className="text-green-500" />
                </div>
              )) : (
                <p className="text-center text-gray-600 py-4">No trending topics available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="neo-card">
          <h2 className="text-xl font-bold text-neo-foreground mb-4">Performance Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-bold text-gray-700 mb-2">Best Performing Post Type</h3>
              <p className="text-neo-foreground">{analytics.bestPostType ?? 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-700 mb-2">Optimal Posting Time</h3>
              <p className="text-neo-foreground">{analytics.optimalPostingTime ?? 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-700 mb-2">Average Engagement</h3>
              <p className="text-neo-foreground">{analytics.avgEngagement ? `${analytics.avgEngagement}%` : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}