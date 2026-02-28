import React from 'react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-3xl">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Welcome to DoctorPost!</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Your AI-powered LinkedIn content assistant.
        </p>
        <p className="mt-2 text-md text-gray-500 dark:text-gray-400">
          This is your dashboard. More features coming soon!
        </p>
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md text-left">
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">Next Steps:</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Implement Brand Interview System (FR1)</li>
            <li>Develop Content Pillar Manager (FR2)</li>
            <li>Integrate AI Post Generator (FR4)</li>
            <li>Connect to Backend API (FastAPI)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}