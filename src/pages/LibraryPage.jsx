import React, { useState, useEffect } from 'react';
import { getScheduledPosts } from '../lib/api.jsx'; // Updated import
import { FileText, Save, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LibraryPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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
        console.error("Failed to load posts for library:", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchPosts();
  }, [user?.id]);

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    if (filter === 'generated') return post.status === 'scheduled' || post.status === 'published';
    if (filter === 'saved') return post.status === 'draft';
    if (filter === 'drafts') return post.status === 'draft';
    return true;
  });

  if (loading) {
    return (
      <div className="p-6 neo-grid-bg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-neo-foreground mb-6">Content Library</h1>
          <div className="neo-card flex items-center justify-center p-12">
            <p>Loading content library...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 neo-grid-bg">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-neo-foreground mb-6">Content Library</h1>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            onClick={() => setFilter('all')} 
            className={`py-2 px-4 text-sm font-bold border-neo border-neo-border rounded-neo ${filter === 'all' ? 'bg-purple-electric text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
          >
            All Posts
          </button>
          <button 
            onClick={() => setFilter('generated')} 
            className={`py-2 px-4 text-sm font-bold border-neo border-neo-border rounded-neo ${filter === 'generated' ? 'bg-purple-electric text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
          >
            <FileText size={16} className="inline-block mr-2" /> My Generated Posts
          </button>
          <button 
            onClick={() => setFilter('saved')} 
            className={`py-2 px-4 text-sm font-bold border-neo border-neo-border rounded-neo ${filter === 'saved' ? 'bg-purple-electric text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
          >
            <Save size={16} className="inline-block mr-2" /> Saved Posts
          </button>
          <button 
            onClick={() => setFilter('drafts')} 
            className={`py-2 px-4 text-sm font-bold border-neo border-neo-border rounded-neo ${filter === 'drafts' ? 'bg-purple-electric text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
          >
            <Edit size={16} className="inline-block mr-2" /> Drafts
          </button>
        </div>

        <div className="neo-card">
          {filteredPosts.length === 0 ? (
            <p className="text-center py-12 text-gray-600 font-medium">No posts found for this filter.</p>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map(post => (
                <div key={post.id} className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0">
                  <div>
                    <p className="font-bold text-neo-foreground">{post.title}</p>
                    <p className="text-sm text-gray-600">Pillar: {post.pillar} | Scheduled: {new Date(post.scheduledAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`neo-pill ${post.status}`}>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>
                    <button className="text-sm bg-gray-100 text-charcoal-black py-1 px-3 rounded-neo border-2 border-neo-border font-bold hover:bg-gray-200">View/Edit</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}