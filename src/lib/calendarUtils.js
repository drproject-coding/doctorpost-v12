// Define status options for consistent color mapping and legend
export const statusOptions = [
  { id: 'draft', value: 'draft', label: 'Draft', category: 'Status', description: 'Post is a work in progress.', exampleSnippet: '', useCases: [] },
  { id: 'to-review', value: 'to-review', label: 'To Review', category: 'Status', description: 'Post is ready for review.', exampleSnippet: '', useCases: [] },
  { id: 'to-plan', value: 'to-plan', label: 'To Plan', category: 'Status', description: 'Post is ready for planning.', exampleSnippet: '', useCases: [] },
  { id: 'to-publish', value: 'to-publish', label: 'To Publish', category: 'Status', description: 'Post is ready to be published.', exampleSnippet: '', useCases: [] },
  { id: 'scheduled', value: 'scheduled', label: 'Scheduled', category: 'Status', description: 'Post is scheduled for a future date.', exampleSnippet: '', useCases: [] },
  { id: 'published', value: 'published', label: 'Published', category: 'Status', description: 'Post has been published.', exampleSnippet: '', useCases: [] },
];

export const getStatusColorClasses = (status) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'published': return 'bg-green-100 text-green-800 border-green-300';
    case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'to-review': return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'to-plan': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'to-publish': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};