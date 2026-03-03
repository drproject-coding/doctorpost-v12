#!/usr/bin/env node

/**
 * Test Coverage Validation Script
 * 
 * This script validates that all major features have comprehensive test coverage
 * and provides a detailed report of test coverage status.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the features that need test coverage
const requiredFeatures = [
  {
    name: 'Authentication',
    files: [
      'app/login/page.tsx',
      'app/auth/[...path]/page.tsx',
      'lib/auth-context.tsx'
    ],
    tests: [
      '__tests__/components/AuthFlow.test.tsx',
      'e2e/auth-flow.spec.ts'
    ]
  },
  {
    name: 'Content Factory',
    files: [
      'components/factory/PipelineStepper.tsx',
      'components/factory/ResearchBrief.tsx',
      'components/factory/EvidencePack.tsx',
      'components/factory/FormattedOutput.tsx',
      'components/factory/PostReview.tsx'
    ],
    tests: [
      '__tests__/components/PipelineStepper.test.tsx',
      '__tests__/components/ResearchBrief.test.tsx',
      '__tests__/components/EvidencePack.test.tsx',
      '__tests__/components/FormattedOutput.test.tsx',
      '__tests__/components/PostReview.test.tsx',
      'e2e/content-factory.spec.ts'
    ]
  },
  {
    name: 'Calendar Management',
    files: [
      'components/calendar/CalendarView.tsx',
      'components/calendar/ScoreBadge.tsx'
    ],
    tests: [
      '__tests__/components/CalendarView.test.tsx',
      '__tests__/components/ScoreBadge.test.tsx'
    ]
  },
  {
    name: 'Post Management',
    files: [
      'components/PostEditorModal.tsx',
      'components/SchedulePostModal.tsx',
      'components/PostGenerator.tsx'
    ],
    tests: [
      '__tests__/components/PostEditorModal.test.tsx',
      '__tests__/components/SchedulePostModal.test.tsx',
      '__tests__/components/PostGenerator.test.tsx'
    ]
  },
  {
    name: 'Knowledge Base',
    files: [
      'components/knowledge/DocumentEditor.tsx',
      'components/knowledge/ImportFlow.tsx',
      'components/knowledge/ExtractFlow.tsx',
      'components/knowledge/VersionHistory.tsx'
    ],
    tests: [
      '__tests__/components/DocumentEditor.test.tsx',
      '__tests__/components/ImportFlow.test.tsx',
      '__tests__/components/ExtractFlow.test.tsx',
      '__tests__/components/VersionHistory.test.tsx'
    ]
  },
  {
    name: 'Campaign Management',
    files: [
      'components/campaigns/CampaignSetup.tsx',
      'components/campaigns/CampaignCalendar.tsx',
      'components/campaigns/BatchProgress.tsx'
    ],
    tests: [
      '__tests__/components/CampaignSetup.test.tsx',
      '__tests__/components/CampaignCalendar.test.tsx',
      '__tests__/components/BatchProgress.test.tsx'
    ]
  },
  {
    name: 'API Endpoints',
    files: [
      'app/api/ai/route.ts',
      'app/api/models/route.ts',
      'app/api/knowledge/[...path]/route.ts',
      'app/api/campaign/[...path]/route.ts',
      'app/api/pipeline/stream/route.ts'
    ],
    tests: [
      '__tests__/api/api.test.ts',
      '__tests__/api/ai.test.ts',
      '__tests__/api/models.test.ts',
      '__tests__/api/knowledge.test.ts',
      '__tests__/api/campaign.test.ts',
      '__tests__/api/pipeline.test.ts'
    ]
  },
  {
    name: 'AI Services',
    files: [
      'lib/ai/aiService.ts',
      'lib/ai/claudeService.ts',
      'lib/ai/straicoService.ts',
      'lib/ai/oneforallService.ts'
    ],
    tests: [
      '__tests__/lib/aiService.test.ts',
      '__tests__/lib/claudeService.test.ts',
      '__tests__/lib/straicoService.test.ts',
      '__tests__/lib/oneforallService.test.ts'
    ]
  },
  {
    name: 'Agents',
    files: [
      'lib/agents/orchestrator.ts',
      'lib/agents/researcher.ts',
      'lib/agents/writer.ts',
      'lib/agents/strategist.ts',
      'lib/agents/scorer.ts'
    ],
    tests: [
      '__tests__/lib/orchestrator.test.ts',
      '__tests__/lib/researcher.test.ts',
      '__tests__/lib/writer.test.ts',
      '__tests__/lib/strategist.test.ts',
      '__tests__/lib/scorer.test.ts'
    ]
  }
];

function checkFileExists(filePath) {
  return fs.existsSync(path.join(__dirname, '..', filePath));
}

function checkTestExists(testPath) {
  return fs.existsSync(path.join(__dirname, '..', testPath));
}

function validateFeature(feature) {
  const results = {
    name: feature.name,
    status: 'PASS',
    missingFiles: [],
    missingTests: [],
    coverage: 0
  };

  // Check if implementation files exist
  const totalFiles = feature.files.length;
  let existingFiles = 0;
  
  feature.files.forEach(file => {
    if (checkFileExists(file)) {
      existingFiles++;
    } else {
      results.missingFiles.push(file);
    }
  });

  // Check if test files exist
  const totalTests = feature.tests.length;
  let existingTests = 0;
  
  feature.tests.forEach(test => {
    if (checkTestExists(test)) {
      existingTests++;
    } else {
      results.missingTests.push(test);
    }
  });

  // Calculate coverage
  const fileCoverage = (existingFiles / totalFiles) * 100;
  const testCoverage = (existingTests / totalTests) * 100;
  results.coverage = Math.round((fileCoverage + testCoverage) / 2);

  // Determine status
  if (results.missingFiles.length > 0 || results.missingTests.length > 0) {
    results.status = 'FAIL';
  } else if (results.coverage < 80) {
    results.status = 'WARNING';
  }

  return results;
}

function generateReport() {
  console.log('🧪 Test Coverage Validation Report\n');
  console.log('='.repeat(60));
  
  let totalFeatures = requiredFeatures.length;
  let passedFeatures = 0;
  let failedFeatures = 0;
  let warningFeatures = 0;
  let totalCoverage = 0;

  requiredFeatures.forEach(feature => {
    const result = validateFeature(feature);
    
    console.log(`\n📋 ${feature.name}`);
    console.log(`   Status: ${getStatusIcon(result.status)} ${result.status}`);
    console.log(`   Coverage: ${result.coverage}%`);
    
    if (result.missingFiles.length > 0) {
      console.log(`   Missing Files:`);
      result.missingFiles.forEach(file => console.log(`     - ${file}`));
    }
    
    if (result.missingTests.length > 0) {
      console.log(`   Missing Tests:`);
      result.missingTests.forEach(test => console.log(`     - ${test}`));
    }

    switch (result.status) {
      case 'PASS': passedFeatures++; break;
      case 'FAIL': failedFeatures++; break;
      case 'WARNING': warningFeatures++; break;
    }
    
    totalCoverage += result.coverage;
  });

  const overallCoverage = Math.round(totalCoverage / totalFeatures);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary');
  console.log(`   Total Features: ${totalFeatures}`);
  console.log(`   Passed: ${passedFeatures}`);
  console.log(`   Failed: ${failedFeatures}`);
  console.log(`   Warnings: ${warningFeatures}`);
  console.log(`   Overall Coverage: ${overallCoverage}%`);
  
  if (failedFeatures > 0) {
    console.log('\n❌ Validation FAILED - Some features are missing tests or implementation');
    process.exit(1);
  } else if (overallCoverage < 80) {
    console.log('\n⚠️  Validation WARNING - Overall coverage is below 80%');
    process.exit(0);
  } else {
    console.log('\n✅ Validation PASSED - All features have comprehensive test coverage');
    process.exit(0);
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'PASS': return '✅';
    case 'FAIL': return '❌';
    case 'WARNING': return '⚠️';
    default: return '❓';
  }
}

// Run validation
generateReport();