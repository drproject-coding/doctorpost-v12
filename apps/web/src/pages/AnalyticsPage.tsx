import React, { useState, useEffect } from 'react';
import { getAnalytics } from '../lib/api';
import { AnalyticsData } from '../lib/types';

const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
  </div>
);

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const result = await getAnalytics();
      setData(result);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-gray-600 dark:text-gray-300">Loading Analytics...</div>;
  }

  if (!data) {
    return <div className="p-6 text-center text-red-500">Failed to load analytics.</div>;
  }

  const maxImpressions = Math.max(...data.performanceByPillar.map(p => p.impressions), 1);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Performance Analytics</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Impressions" value={data.totalImpressions.toLocaleString()} />
          <StatCard title="Total Reactions" value={data.totalReactions.toLocaleString()} />
          <StatCard title="Total Comments" value={data.totalComments.toLocaleString()} />
          <StatCard title="Avg. CTR" value={`${data.ctr}%`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Top Performers</h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p><strong>Top Pillar:</strong> {data.topPerformingPillar.name} ({data.topPerformingPillar.value.toLocaleString()} impressions)</p>
              <p><strong>Top Hook Pattern:</strong> {data.topPerformingHook.name} ({data.topPerformingHook.value.toLocaleString()} reactions)</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Impressions by Pillar</h2>
            <div className="space-y-4">
              {data.performanceByPillar.map(pillar => (
                <div key={pillar.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-base font-medium text-gray-700 dark:text-gray-300">{pillar.name}</span>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{pillar.impressions.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${(pillar.impressions / maxImpressions) * 100}%` }}></div>
                  </div>
                </div>
              ))}\
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}