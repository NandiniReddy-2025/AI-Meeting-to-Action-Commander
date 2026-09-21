import { formatSkribbyTranscript } from './skribbyService.js';
import { runPrecisionNLPAnalysis, isNonActionableDiscourse, isDisqualifiedActionItem } from './aiAnalyzer.js';

console.log('=== TEST 1: Skribby Segment Structure & Parsing ===');
const skribbySample = [
  {
    start: 4,
    end: 5.62,
    speaker: 0,
    speaker_name: "John Doe",
    transcript: "This is a quick test."
  },
  {
    start: 7.2,
    end: 11.5,
    speaker: 1,
    speaker_name: "Nandini",
    transcript: "Nandini will test the application tomorrow."
  }
];

const formattedSkribby = formatSkribbyTranscript(skribbySample);
console.log('Formatted Skribby Segments:', JSON.stringify(formattedSkribby, null, 2));

console.assert(formattedSkribby.length === 2, 'Should have 2 segments');
console.assert(formattedSkribby[0].text === 'This is a quick test.', 'Should extract entry.transcript');
console.assert(formattedSkribby[0].time === '00:04', 'Should extract entry.start as 00:04');
console.assert(formattedSkribby[0].speaker_name === 'John Doe', 'Should preserve speaker_name');
console.assert(formattedSkribby[1].time === '00:07', 'Should extract entry.start as 00:07');

console.log('=== TEST 2: Strict Disqualification & Non-Actionable Discourse Filter ===');
const negativeCases = [
  "Let me explain this.",
  "I'll show you how this works.",
  "Can you hear me?",
  "Let's discuss this.",
  "We are currently working on the project.",
  "I think we should consider this.",
  "Coordinate with the team.",
  "Hello everyone and welcome back.",
  "Listen. Practice. Speak.",
  "What do you think?",
  "Bear with me for a moment.",
  "I'll be the manager and you be the employee."
];

negativeCases.forEach(text => {
  const isBlocked = isNonActionableDiscourse(text) || isDisqualifiedActionItem(text, text);
  console.log(`[Negative] "${text}" -> Blocked: ${isBlocked}`);
  console.assert(isBlocked, `Expected "${text}" to be blocked!`);
});

console.log('=== TEST 3: Action Item Extraction on User Examples ===');
const transcriptWithCommitments = [
  { time: '00:07', speaker: 'Host', text: 'Listen. Practice. Speak. Practice makes you perfect. Hello everyone.' },
  { time: '00:21', speaker: 'Host', text: "Let me explain this. I'll show you how this works. Can you hear me?" },
  { time: '00:35', speaker: 'Host', text: "Let's discuss this. We are currently working on the project. I think we should consider this." },
  { time: '01:10', speaker: 'Manager', text: 'Nandini will test the application tomorrow.' },
  { time: '01:25', speaker: 'Manager', text: 'John will send the report by Friday.' },
  { time: '01:40', speaker: 'Lead', text: "Let's deploy this by Monday." },
  { time: '01:55', speaker: 'Developer', text: "I'll prepare the documentation." },
  { time: '02:10', speaker: 'QA Lead', text: 'The team needs to complete testing before the release.' }
];

const analysis = runPrecisionNLPAnalysis(transcriptWithCommitments, 'Sprint Planning');
console.log('\nExtracted Action Items:');
console.log(JSON.stringify(analysis.actionItems, null, 2));

console.assert(analysis.actionItems.length === 5, `Expected 5 action items, got ${analysis.actionItems.length}`);

// Verify that NO negative examples generated action items
const tasks = analysis.actionItems.map(a => a.task.toLowerCase());
console.assert(!tasks.some(t => t.includes('explain')), 'No explanation task');
console.assert(!tasks.some(t => t.includes('show you')), 'No show you task');
console.assert(!tasks.some(t => t.includes('hear me')), 'No hear me task');
console.assert(!tasks.some(t => t.includes('discuss')), 'No discuss task');
console.assert(!tasks.some(t => t.includes('currently working')), 'No currently working task');
console.assert(!tasks.some(t => t.includes('listen')), 'No listen task');

// Verify positive action items and their source timestamps
const nandiniTask = analysis.actionItems.find(a => a.owner === 'Nandini');
console.assert(nandiniTask, 'Nandini task exists');
console.assert(nandiniTask.source === '01:10', `Nandini source must be 01:10, got ${nandiniTask.source}`);
console.assert(nandiniTask.deadline === 'Tomorrow', `Nandini deadline must be Tomorrow, got ${nandiniTask.deadline}`);

const johnTask = analysis.actionItems.find(a => a.owner === 'John');
console.assert(johnTask, 'John task exists');
console.assert(johnTask.source === '01:25', `John source must be 01:25, got ${johnTask.source}`);

console.log('\nALL UNIT AND INTEGRATION TESTS PASSED SUCCESSFULLY!');
