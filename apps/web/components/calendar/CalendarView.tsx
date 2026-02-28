"use client";

import React, { useState, useMemo } from 'react';
import { ScheduledPost } from '../../lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  posts: ScheduledPost[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled': return 'bg-orange-500'; // Planned
    case 'published': return 'bg-green-500';
    case 'draft': return 'bg-yellow-500';
    default: return 'bg-gray-400';
  }
};

export default function CalendarView({ posts }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const postsByDate = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();
    posts.forEach(post => {
      const postDate = new Date(post.scheduledAt).toDateString();
      if (!map.has(postDate)) {
        map.set(postDate, []);
      }
      map.get(postDate)?.push(post);
    });
    return map;
  }, [posts]);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDayOfWeek = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => null);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = new Date();

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <ChevronRight size={24} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-sm text-gray-600 dark:text-gray-300">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {paddingDays.map((_, index) => (
          <div key={`pad-${index}`} className="border rounded-md dark:border-gray-700 h-28"></div>
        ))}
        {days.map(day => {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const postsForDay = postsByDate.get(date.toDateString()) || [];
          const isToday = date.toDateString() === today.toDateString();

          return (
            <div key={day} className={`border rounded-md dark:border-gray-700 h-28 p-2 flex flex-col ${isToday ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}>
              <span className={`font-medium ${isToday ? 'text-indigo-600 dark:text-indigo-300' : ''}`}>{day}</span>
              <div className="flex-grow mt-1 space-y-1 overflow-y-auto">
                {postsForDay.map(post => (
                  <div key={post.id} className="flex items-center space-x-2 text-xs">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(post.status)}`}></span>
                    <span className="truncate">{post.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}