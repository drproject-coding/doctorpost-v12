import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostEditorModal from '@/components/PostEditorModal';
import { createMockScheduledPost } from '../utils/testUtils';

describe('PostEditorModal', () => {
  const mockPost = createMockScheduledPost({
    id: 'test-post-id',
    title: 'Original Title',
    content: 'Original content',
    status: 'draft',
  });

  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Edit Post: Original Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Original Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Original content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <PostEditorModal
        isOpen={false}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />
    );

    expect(screen.queryByText('Edit Post: Original Title')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('updates title when input changes', () => {
    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />
    );

    const titleInput = screen.getByDisplayValue('Original Title');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    expect(titleInput).toHaveValue('Updated Title');
  });

  it('updates content when textarea changes', () => {
    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />
    );

    const contentTextarea = screen.getByDisplayValue('Original content');
    fireEvent.change(contentTextarea, { target: { value: 'Updated content' } });

    expect(contentTextarea).toHaveValue('Updated content');
  });

  it('updates status when select changes', () => {
    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />
    );

    const statusSelect = screen.getByDisplayValue('Draft');
    fireEvent.change(statusSelect, { target: { value: 'scheduled' } });

    expect(statusSelect).toHaveValue('scheduled');
  });

  it('calls onSave when save button is clicked', async () => {
    mockOnSave.mockResolvedValue(undefined);

    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByText(/save changes/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        ...mockPost,
        title: 'Original Title',
        content: 'Original content',
        status: 'draft',
      });
    });
  });

  it('shows loading state when saving', async () => {
    let resolveSave: () => void;
    const savePromise = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });
    mockOnSave.mockReturnValue(savePromise);

    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByText(/save changes/i);
    fireEvent.click(saveButton);

    expect(saveButton).toBeDisabled();
    expect(screen.getByText(/saving/i)).toBeInTheDocument();

    resolveSave!();
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });

  it('shows success message after successful save', async () => {
    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByText(/save changes/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/post saved successfully/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('shows error message when save fails', async () => {
    mockOnSave.mockRejectedValue(new Error('Save failed'));

    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByText(/save changes/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to save post/i)).toBeInTheDocument();
    });
  });

  it('disables save button when required fields are empty', () => {
    render(
      <PostEditorModal
        isOpen={true}
        onClose={mockOnClose}
        post={mockPost}
        onSave={mockOnSave}
      />
    );

    const titleInput = screen.getByDisplayValue('Original Title');
    fireEvent.change(titleInput, { target: { value: '' } });

    const saveButton = screen.getByText(/save changes/i);
    expect(saveButton).toBeDisabled();
  });
});