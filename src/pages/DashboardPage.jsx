import React, { useState, useEffect } from 'react';
import { getScheduledPosts, getAnalytics } from '../lib/api.jsx'; // Updated import
import { BarChart2, ArrowUpRight, Calendar, Clock, PlusSquare, TrendingUp, Book, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx'; // Import useAuth

export default function DashboardPage() {
  const { user } = useAuth(); // Get user from AuthContext
  const [posts, setPosts] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const fetchedPosts = await getScheduledPosts();
        const fetchedAnalytics = await getAnalytics(user.id); // Use user.id
        setPosts(fetchedPosts);
        setAnalyticsData(fetchedAnalytics);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    void fetchData(); // Explicitly ignore the promise
  }, [user?.id]); // Depend on user.id

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6 neo-grid-bg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-neo-foreground mb-6">Dashboard</h1>
          <div className="neo-card flex items-center justify-center p-12">
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter posts for upcoming and recent
  const now = new Date();
  const upcomingPosts = posts
    .filter(post => new Date(post.scheduledAt) > now && post.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3); // Show top 3 upcoming

  const recentPosts = posts
    .filter(post => new Date(post.scheduledAt) <= now && (post.status === 'published' || post.status === 'scheduled'))
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 3); // Show top 3 recent

  return (
    <div className="p-6 neo-grid-bg">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-neo-foreground mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
          {/* Performance Summary Card */}
          <div className="neo-card">
            <div className="flex items-center mb-4">
              <div className="bg-purple-electric p-2 rounded-neo border-neo border-neo-border mr-3">
                <BarChart2 className="text-white" size={24} />
              </div>
              <h2 className="text-lg font-bold">Performance Overview</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-bold">Impressions</span>
                  <span className="text-sm font-bold flex items-center text-green-600">
                    {analyticsData?.totalImpressions.toLocaleString() ?? 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-neo border border-neo-border h-3 mt-1">
                  <div className="bg-purple-electric h-3 rounded-neo" style={{ width: `${((analyticsData?.totalImpressions ?? 0) / 100000) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-bold">Engagement</span>
                  <span className="text-sm font-bold flex items-center text-green-600">
                    {analyticsData?.ctr ? `${analyticsData.ctr}%` : 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-neo border border-neo-border h-3 mt-1">
                  <div className="bg-purple-electric h-3 rounded-neo" style={{ width: `${((analyticsData?.ctr ?? 0) * 10)}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-bold">Top Pillar</span>
                  <span className="text-sm font-bold flex items-center text-green-600">
                    {analyticsData?.topPerformingPillar.name ?? 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-neo border border-neo-border h-3 mt-1">
                  <div className="bg-purple-electric h-3 rounded-neo" style={{ width: `${((analyticsData?.topPerformingPillar.value ?? 0) / 50000) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions Card */}
          <div className="neo-card">
            <div className="flex items-center mb-4">
              <div className="bg-blazing-orange p-2 rounded-neo border-neo border-neo-border mr-3">
                <PlusSquare className="text-white" size={24} />
              </div>
              <h2 className="text-lg font-bold">Quick Actions</h2>
            </div>
            <div className="space-y-3">
              <Link to="/create" className="flex items-center text-purple-electric font-bold hover:underline">
                <ArrowUpRight size={16} className="mr-2" /> Generate New Post
              </Link>
              <Link to="/calendar" className="flex items-center text-purple-electric font-bold hover:underline">
                <Calendar size={16} className="mr-2" /> View Calendar
              </Link>
              <Link to="/settings" className="flex items-center text-purple-electric font-bold hover:underline">
                <Settings size={16} className="mr-2" /> Update Brand Profile
              </Link>
            </div>
          </div>

          {/* Upcoming Posts Card */}
          <div className="neo-card md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-neo-foreground">Upcoming Posts</h2>
              <Link to="/calendar" className="text-sm font-bold text-purple-electric hover:underline">View All</Link>
            </div>
            <div className="space-y-4">
              {upcomingPosts.length > 0 ? (
                upcomingPosts.map(post => (
                  <div key={post.id} className="flex items-start space-x-3 border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <div className="pt-1">
                      <Clock className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-neo-foreground">{post.title}</p>
                      <p className="text-sm text-gray-600">{formatDate(post.scheduledAt)} at {formatTime(post.scheduledAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 font-medium py-4">No upcoming scheduled posts.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Posts Card */}
          <div className="neo-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-neo-foreground">Recent Posts</h2>
              <Link to="/library" className="text-sm font-bold text-purple-electric hover:underline">View Library</Link>
            </div>
            <div className="space-y-4">
              {recentPosts.length > 0 ? (
                recentPosts.map(post => (
                  <div key={post.id} className="flex items-start space-x-3 border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <div className="pt-1">
                      <Book className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-neo-foreground">{post.title}</p>
                      <p className="text-sm text-gray-600">Published: {formatDate(post.scheduledAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 font-medium py-4">No recent posts found.</p>
              )}
            </div>
          </div>

          {/* Trending Topics Card */}
          <div className="neo-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-neo-foreground">Trending Topics</h2>
              <span className="text-sm font-bold text-gray-600">Last 7 Days</span>
            </div>
            <div className="space-y-3">
              {analyticsData?.trendingTopics.length > 0 ? (
                analyticsData.trendingTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-neo border border-gray-200">
                    <span className="font-medium text-neo-foreground">{topic}</span>
                    <TrendingUp size={16} className="text-green-500" />
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 font-medium py-4">No trending topics available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}