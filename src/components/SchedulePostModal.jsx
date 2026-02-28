import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const statusOptions = [
  { id: 'draft', value: 'draft', label: 'Draft', category: 'Status', description: 'Post is a work in progress.', exampleSnippet: '', useCases: [] },
  { id: 'to-review', value: 'to-review', label: 'To Review', category: 'Status', description: 'Post is ready for review.', exampleSnippet: '', useCases: [] },
  { id: 'to-plan', value: 'to-plan', label: 'To Plan', category: 'Status', description: 'Post is ready for planning.', exampleSnippet: '', useCases: [] },
  { id: 'to-publish', value: 'to-publish', label: 'To Publish', category: 'Status', description: 'Post is ready to be published.', exampleSnippet: '', useCases: [] },
  { id: 'scheduled', value: 'scheduled', label: 'Scheduled', category: 'Status', description: 'Post is scheduled for a future date.', exampleSnippet: '', useCases: [] },
  { id: 'published', value: 'published', label: 'Published', category: 'Status', description: 'Post has been published.', exampleSnippet: '', useCases: [] },
];

const SchedulePostModal = ({
  isOpen,
  onClose,
  onSchedule,
  initialDate,
  initialStatus = 'scheduled',
}) => {
  const [selectedDate, setSelectedDate] = useState(initialDate ?? new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(initialDate ?? new Date().toISOString().split('T')[0]);
      setSelectedStatus(initialStatus);
    }
  }, [isOpen, initialDate, initialStatus]);

  if (!isOpen) return null;

  const handleSchedule = () => {
    onSchedule(selectedDate, selectedStatus);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="neo-card p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-neo-foreground">Schedule Post</h2>
          <button onClick={onClose} className="p-1 rounded-neo hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <label htmlFor="schedule-date" className="neo-label">
            Date
          </label>
          <input
            type="date"
            id="schedule-date"
            className="neo-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="schedule-status" className="neo-label">
            Status
          </label>
          <select
            id="schedule-status"
            className="neo-input"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="neo-button secondary">
            Cancel
          </button>
          <button onClick={void handleSchedule} className="neo-button">
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchedulePostModal;