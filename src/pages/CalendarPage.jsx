import React, { useState, useEffect } from 'react';
import { getScheduledPosts, updatePost } from '../lib/api.jsx';
import CalendarView from '../components/calendar/CalendarView.jsx';
import PostEditorModal from '../components/PostEditorModal.jsx';
import { List, Calendar, Filter } from 'lucide-react';
import { getStatusColorClasses, statusOptions } from '../lib/calendarUtils.js';
import { useAuth } from '../context/AuthContext.jsx';

const ListView = ({ posts, onPostClick }) => {
  return (
    <div className="neo-card">
      <div className="space-y-4">
        {posts.length > 0 ? posts
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
          .map(post => (
            <div key={post.id} className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0">
              <div>
                <p className="font-bold text-neo-foreground">{post.title}</p>
                <p className="text-sm text-gray-600">Pillar: {post.pillar} | Scheduled: {new Date(post.scheduledAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`neo-pill ${getStatusColorClasses(post.status)}`}>
                  {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                </span>
                <button
                  className="text-sm bg-gray-100 text-charcoal-black py-1 px-3 rounded-neo border-2 border-neo-border font-bold hover:bg-gray-200"
                  onClick={() => onPostClick(post)}
                >
                  View/Edit
                </button>
              </div>
            </div>
          )) : (
            <p className="text-center py-12 text-gray-600 font-medium">No posts found for this filter.</p>
          )}
      </div>
    </div>
  );
};

export default function CalendarPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('calendar');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getScheduledPosts();
        setPosts(data);
      } catch (error) {
        console.error("Failed to load posts for calendar:", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchPosts();
  }, [user?.id]);

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsEditorModalOpen(true);
  };

  const handlePostUpdate = async (updatedPost) => {
    try {
      await updatePost(updatedPost);
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === updatedPost.id ? updatedPost : post
        )
      );
      setIsEditorModalOpen(false);
      setSelectedPost(null);
    } catch (error) {
      console.error("Failed to update post:", error);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (statusFilter === 'all') return true;
    return post.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="p-6 neo-grid-bg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-neo-foreground mb-6">Calendar</h1>
          <div className="neo-card flex items-center justify-center p-12">
            <p>Loading calendar data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 neo-grid-bg">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-neo-foreground mb-6">Content Calendar</h1>
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`neo-button secondary ${viewMode === 'calendar' ? '!bg-purple-electric !text-white' : ''}`}
            >
              <Calendar size={16} className="mr-2" /> Calendar View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`neo-button secondary ${viewMode === 'list' ? '!bg-purple-electric !text-white' : ''}`}
            >
              <List size={16} className="mr-2" /> List View
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="neo-input py-1 px-2 text-sm min-w-0"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {viewMode === 'calendar' ? (
          <CalendarView posts={filteredPosts} onPostClick={handlePostClick} />
        ) : (
          <ListView posts={filteredPosts} onPostClick={handlePostClick} />
        )}

        <PostEditorModal
          isOpen={isEditorModalOpen}
          onClose={() => {
            setIsEditorModalOpen(false);
            setSelectedPost(null);
          }}
          post={selectedPost}
          onSave={handlePostUpdate}
        />
      </div>
    </div>
  );
}