import React, { useState, useEffect, useMemo } from 'react';
import { ScheduledPost } from '../../lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getStatusColorClasses } from '../../lib/calendarUtils'; // Import from new utility file

interface CalendarViewProps {
  posts: ScheduledPost[];
  onPostClick: (post: ScheduledPost) => void;
  selectedDateFromPicker?: string | null; // New prop for selected date from picker
}

export default function CalendarView({ posts, onPostClick, selectedDateFromPicker }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Effect to update current month when selectedDateFromPicker changes
  useEffect(() => {
    if (selectedDateFromPicker) {
      const newDate = new Date(selectedDateFromPicker);
      // Only update if the month/year is different to avoid unnecessary re-renders
      if (newDate.getFullYear() !== currentDate.getFullYear() || newDate.getMonth() !== currentDate.getMonth()) {
        setCurrentDate(newDate);
      }
    }
  }, [selectedDateFromPicker, currentDate]); // Depend on selectedDateFromPicker and currentDate

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-neo-border bg-gray-50"></div>);
    }

    // Create calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDateFromPicker && date.toDateString() === new Date(selectedDateFromPicker).toDateString();

      // Filter posts for this day
      const dayPosts = posts.filter(post => {
        const postDate = new Date(post.scheduledAt);
        return postDate.getFullYear() === year &&
               postDate.getMonth() === month &&
               postDate.getDate() === day;
      });

      let cellClasses = 'bg-white';
      if (isToday) {
        cellClasses = 'bg-purple-50'; // Highlight for today
      }
      if (isSelected) {
        cellClasses = 'bg-blazing-orange-100 border-blazing-orange'; // Highlight for selected date
      }
      if (isToday && isSelected) {
        cellClasses = 'bg-blazing-orange-100 border-blazing-orange ring-2 ring-purple-electric'; // Both today and selected
      }

      days.push(
        <div
          key={day}
          className={`h-24 border border-neo-border p-1 overflow-y-auto relative ${cellClasses}`}
        >
          <div className={`font-bold text-sm mb-1 ${isToday ? 'text-purple-electric' : isSelected ? 'text-blazing-orange' : 'text-neo-foreground'}`}>{day}</div>
          {dayPosts.length > 0 ? (
            <div className="space-y-1">
              {dayPosts.map(post => (
                <button
                  key={post.id}
                  className={`block w-full text-left px-2 py-1 text-xs rounded-neo border truncate ${getStatusColorClasses(post.status)} hover:opacity-80 transition-opacity`}
                  title={post.title}
                  onClick={() => onPostClick(post)}
                >
                  {post.title}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      );
    }

    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="neo-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-neo-foreground">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
        <div className="flex space-x-2">
          <button
            onClick={previousMonth}
            className="neo-button p-2 flex items-center justify-center"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={nextMonth}
            className="neo-button p-2 flex items-center justify-center"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-bold text-sm py-2 text-neo-foreground">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {renderCalendar()}
      </div>
    </div>
  );
};