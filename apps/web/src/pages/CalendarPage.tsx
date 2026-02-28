import React, { useState, useEffect } from 'react';
import { getScheduledPosts } from '../lib/api';
import { ScheduledPost } from '../lib/types';
import CalendarView from '../components/calendar/CalendarView';
import { List, Calendar } from 'lucide-react';

const ListView = ({ posts }: { posts: ScheduledPost[] }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
      <div className="space-y-4">
        {posts.length > 0 ? posts
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
          .map(post => (
          <div key={post.id} className="flex items-center justify-between p-4 border-b dark:border-gray-700 last:border-b-0">
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-100">{post.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(post.scheduledAt).toLocaleString()} - Pillar: {post.pillar}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(post.status)}`}>
                {post.status}
              </span>
              <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View</button>
            </div>
          </div>
        )) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No posts scheduled.</p>
        )}
      </div>
    </div>
  );
};

export default function CalendarPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    const fetchPosts = async () => {
      const data = await getScheduledPosts();
      setPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-gray-600 dark:text-gray-300">Loading Calendar...</div>;
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Content Calendar</h1>
            <div className="flex items-center space-x-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
                <button 
                    onClick={() => setView('calendar')}
                    className={`flex items-center px-3 py-1 rounded-md text-sm font-medium ${view === 'calendar' ? 'bg-white dark:bg-gray-900 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                >
                    <Calendar className="w-4 h-4 mr-2" />
                    Calendar
                </button>
                <button 
                    onClick={() => setView('list')}
                    className={`flex items-center px-3 py-1 rounded-md text-sm font-medium ${view === 'list' ? 'bg-white dark:bg-gray-900 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                >
                    <List className="w-4 h-4 mr-2" />
                    List
                </button>
            </div>
        </div>
        
        {view === 'calendar' ? <CalendarView posts={posts} /> : <ListView posts={posts} />}
      </div>
    </div>
  );
}