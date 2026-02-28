import React, { useState, useEffect } from 'react';
import { ScheduledPost, PostStatus, DropdownOption } from '../lib/types';
import { X, Save, Loader } from 'lucide-react';

interface PostEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: ScheduledPost | null;
  onSave: (updatedPost: ScheduledPost) => Promise<void>;
}

const statusOptions: DropdownOption[] = [
  { id: 'draft', value: 'draft', label: 'Draft', category: 'Status', description: 'Post is a work in progress.', exampleSnippet: '', useCases: [] },
  { id: 'to-review', value: 'to-review', label: 'To Review', category: 'Status', description: 'Post is ready for review.', exampleSnippet: '', useCases: [] },
  { id: 'to-plan', value: 'to-plan', label: 'To Plan', category: 'Status', description: 'Post is ready for planning.', exampleSnippet: '', useCases: [] },
  { id: 'to-publish', value: 'to-publish', label: 'To Publish', category: 'Status', description: 'Post is ready to be published.', exampleSnippet: '', useCases: [] },
  { id: 'scheduled', value: 'scheduled', label: 'Scheduled', category: 'Status', description: 'Post is scheduled for a future date.', exampleSnippet: '', useCases: [] },
  { id: 'published', value: 'published', label: 'Published', category: 'Status', description: 'Post has been published.', exampleSnippet: '', useCases: [] },
];

const PostEditorModal: React.FC<PostEditorModalProps> = ({ isOpen, onClose, post, onSave }) => {
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedStatus, setEditedStatus] = useState<PostStatus>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && post) {
      setEditedTitle(post.title);
      setEditedContent(post.content);
      setEditedStatus(post.status);
      setSaveError(null);
      setSaveSuccess(null);
    }
  }, [isOpen, post]);

  if (!isOpen || !post) return null;

  const handleSave = async () => {
    if (!post) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const updatedPost: ScheduledPost = {
      ...post,
      title: editedTitle,
      content: editedContent,
      status: editedStatus,
    };

    try {
      await onSave(updatedPost);
      setSaveSuccess('Post saved successfully!');
      setTimeout(() => {
        setSaveSuccess(null);
        onClose(); // Close modal on successful save
      }, 1500);
    } catch (error) {
      console.error('Failed to save post:', error);
      setSaveError('Failed to save post. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="neo-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-neo-foreground">Edit Post: {post.title}</h2>
          <button onClick={onClose} className="p-1 rounded-neo hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {saveError && (
          <div className="bg-red-100 text-red-800 border-2 border-red-300 rounded-neo p-3 mb-4 text-sm font-medium">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="bg-green-100 text-green-800 border-2 border-green-300 rounded-neo p-3 mb-4 text-sm font-medium">
            {saveSuccess}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="edit-title" className="neo-label">
            Title
          </label>
          <input
            type="text"
            id="edit-title"
            className="neo-input"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="edit-content" className="neo-label">
            Content
          </label>
          <textarea
            id="edit-content"
            className="neo-input h-48 resize-y"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            disabled={isSaving}
          ></textarea>
        </div>

        <div className="mb-6">
          <label htmlFor="edit-status" className="neo-label">
            Status
          </label>
          <select
            id="edit-status"
            className="neo-input"
            value={editedStatus}
            onChange={(e) => setEditedStatus(e.target.value as PostStatus)}
            disabled={isSaving}
          >
            {statusOptions.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="neo-button secondary" disabled={isSaving}>
            Cancel
          </button>
          <button onClick={void handleSave} className="neo-button" disabled={isSaving}>
            {isSaving ? (
              <span className="flex items-center">
                <Loader size={16} className="animate-spin mr-2" /> Saving...
              </span>
            ) : (
              <span className="flex items-center">
                <Save size={16} className="mr-2" /> Save Changes
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostEditorModal;