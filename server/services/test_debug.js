import { runPrecisionNLPAnalysis } from './aiAnalyzer.js';

const sample = [
  {
    time: "10:04 AM",
    speaker: "Sneha",
    text: "I'll work on the dashboard design and finalize the typography and color tokens by September 18."
  },
  {
    time: "10:05 AM",
    speaker: "Rahul Mehta",
    text: "I'll complete the login page and authentication security flow by September 15."
  }
];

const res = runPrecisionNLPAnalysis(sample, 'Website Sync');
console.log('Result:', JSON.stringify(res, null, 2));
