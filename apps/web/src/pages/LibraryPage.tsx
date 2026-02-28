import React, { useState, useEffect } from 'react';
import { getPillars } from '../lib/api';
import { Pillar } from '../lib/types';

export default function LibraryPage() {
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPillars = async () => {
      const data = await getPillars();
      setPillars(data);
      setLoading(false);
    };
    fetchPillars();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-gray-600 dark:text-gray-300">Loading Content Pillars...</div>;
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Content Pillar Library</h1>
          <button className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            Add New Pillar
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map(pillar => (
            <div key={pillar.id} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{pillar.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pillar.goal}</p>
              <div className="mt-4">
                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300">Topics:</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pillar.topics.map(topic => (
                    <span key={topic} className="text-sm text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Edit</button>
                <button className="text-sm text-red-600 dark:text-red-400 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}