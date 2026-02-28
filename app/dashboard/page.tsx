import React from 'react';
import Image from 'next/image';
import { CalendarDays, Users, BarChart2, TrendingUp, Clock } from 'lucide-react';

const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
  <div className="neo-card flex items-start justify-between">
    <div>
      <p className="text-sm font-bold text-neo-foreground/60 uppercase tracking-wider">{title}</p>
      <p className="mt-1 text-2xl font-bold text-neo-foreground">{value}</p>
    </div>
    <div className="p-2 bg-neo-background rounded-neo-border-radius border-neo-border-width border-neo-border">
      {icon}
    </div>
  </div>
);

export default function DashboardPage() {
  const recentPosts = [
    { id: '1', title: '5 Ways to Accelerate Digital Transformation', date: '2 days ago', impressions: 1243 },
    { id: '2', title: 'Why Cloud-First Strategies Fail', date: '5 days ago', impressions: 2541 },
    { id: '3', title: 'Building a Scalable Cloud Architecture', date: '1 week ago', impressions: 1822 },
  ];

  const upcomingPosts = [
    { id: '1', title: 'The Hidden Costs of Legacy Systems', date: 'Tomorrow, 10:00 AM' },
    { id: '2', title: 'How We Reduced Infrastructure Costs by 35%', date: 'Sep 20, 9:15 AM' },
  ];

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-neo-foreground">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Posts"
            value="42"
            icon={<CalendarDays className="w-5 h-5 text-neo-foreground/70" />}
          />
          <StatCard
            title="Audience Growth"
            value="+24%"
            icon={<Users className="w-5 h-5 text-neo-foreground/70" />}
          />
          <StatCard
            title="Avg. Engagement"
            value="3.8%"
            icon={<BarChart2 className="w-5 h-5 text-neo-foreground/70" />}
          />
          <StatCard
            title="Trending Topic"
            value="Cloud"
            icon={<TrendingUp className="w-5 h-5 text-neo-foreground/70" />}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="neo-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-neo-foreground">Recent Performance</h2>
              <a href="/analytics" className="text-sm font-bold text-neo-accent hover:underline">View All</a>
            </div>
            <div className="space-y-4">
              {recentPosts.map(post => (
                <div key={post.id} className="flex items-center justify-between border-b border-neo-border pb-4 last:border-b-0 last:pb-0">
                  <div className="flex-1">
                    <p className="font-semibold text-neo-foreground">{post.title}</p>
                    <p className="text-sm text-neo-foreground/60">{post.date}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-neo-foreground">{post.impressions.toLocaleString()}</span>
                    <span className="text-xs text-neo-foreground/60">views</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="neo-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-neo-foreground">Upcoming Posts</h2>
              <a href="/calendar" className="text-sm font-bold text-neo-accent hover:underline">Calendar</a>
            </div>
            <div className="space-y-4">
              {upcomingPosts.map(post => (
                <div key={post.id} className="flex items-start space-x-3 border-b border-neo-border pb-4 last:border-b-0 last:pb-0">
                  <div className="pt-1">
                    <Clock className="w-4 h-4 text-neo-foreground/60" />
                  </div>
                  <div>
                    <p className="font-semibold text-neo-foreground">{post.title}</p>
                    <p className="text-sm text-neo-foreground/60">{post.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-neo-border">
              <a 
                href="/create" 
                className="block w-full py-2 text-center text-neo-accent font-bold hover:bg-neo-background rounded-neo-border-radius"
              >
                Create New Post
              </a>
            </div>
          </div>
        </div>
        
        <div className="neo-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-neo-foreground">Content Strategy</h2>
            <button className="text-sm font-bold text-neo-accent hover:underline">Edit</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-neo-background p-4 rounded-neo-border-radius border-neo-border-width border-neo-border">
              <h3 className="font-bold text-neo-foreground mb-2">Digital Strategy</h3>
              <div className="space-y-1 text-sm text-neo-foreground/80">
                <p>• Digital Transformation</p>
                <p>• Innovation Roadmaps</p>
                <p>• Technology Trends</p>
              </div>
            </div>
            
            <div className="bg-neo-background p-4 rounded-neo-border-radius border-neo-border-width border-neo-border">
              <h3 className="font-bold text-neo-foreground mb-2">Cloud Solutions</h3>
              <div className="space-y-1 text-sm text-neo-foreground/80">
                <p>• Migration Strategies</p>
                <p>• Cost Optimization</p>
                <p>• Hybrid Models</p>
              </div>
            </div>
            
            <div className="bg-neo-background p-4 rounded-neo-border-radius border-neo-border-width border-neo-border">
              <h3 className="font-bold text-neo-foreground mb-2">IT Strategy</h3>
              <div className="space-y-1 text-sm text-neo-foreground/80">
                <p>• Legacy Modernization</p>
                <p>• Tech Stack Selection</p>
                <p>• IT Governance</p>
              </div>
            </div>
            
            <div className="bg-neo-background p-4 rounded-neo-border-radius border-neo-border-width border-neo-border">
              <h3 className="font-bold text-neo-foreground mb-2">Case Studies</h3>
              <div className="space-y-1 text-sm text-neo-foreground/80">
                <p>• Success Stories</p>
                <p>• Implementation Examples</p>
                <p>• Results & Metrics</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}