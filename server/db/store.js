import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

// Initial seed data
const initialData = {
  users: [
    {
      id: 'usr_snehitha',
      email: 'snehitha@commander.ai',
      password: 'password123',
      name: 'Snehitha Reddy',
      role: 'Head of Product & Delivery',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      settings: {
        theme: 'light',
        emailNotifications: true,
        slackWebhook: '',
        dailyDigest: true,
        aiModel: 'gemini-2.5-flash',
        temperature: 0.2,
        geminiApiKey: '',
        integrations: {
          googleMeet: { connected: true, botName: 'ActionCommander AI' },
          microsoftTeams: { connected: true, botName: 'ActionCommander Bot' },
          zoom: { connected: true, botName: 'ActionCommander Assistant' },
          youtube: { connected: true, status: 'Active' },
        }
      }
    }
  ],
  meetings: [
    {
      id: 'meet_01',
      userId: 'usr_snehitha',
      title: 'Website Project Launch & Engineering Sync',
      sourceType: 'Google Meet',
      sourceUrl: 'https://meet.google.com/abc-defg-hij',
      date: 'Sep 3, 2026',
      duration: '45 min',
      participants: ['Snehitha Reddy (Host)', 'Rahul Mehta', 'Sneha', 'Anjali Sharma'],
      status: 'Completed',
      transcript: [
        { time: '10:00 AM', speaker: 'Snehitha Reddy', text: 'Good morning team! Let\'s align on our final milestones for the website project and make sure all blockers are resolved.' },
        { time: '10:02 AM', speaker: 'Rahul Mehta', text: 'Good morning everyone. Let\'s start the meeting with the frontend deliverable updates.' },
        { time: '10:04 AM', speaker: 'Sneha', text: 'I\'ll work on the dashboard design and finalize the typography and color tokens by September 18.' },
        { time: '10:05 AM', speaker: 'Rahul Mehta', text: 'I\'ll complete the login page and authentication security flow by September 15.' },
        { time: '10:07 AM', speaker: 'Anjali Sharma', text: 'The API is not ready yet, which may delay development and integration testing if not resolved promptly.' },
        { time: '10:09 AM', speaker: 'Rahul Mehta', text: 'That\'s a critical dependency. Let\'s make sure we review the API integration with the backend squad by September 17.' },
        { time: '10:12 AM', speaker: 'Snehitha Reddy', text: 'Agreed. We officially decide to launch the website on September 20, 2026. Rahul will lead frontend development and Sneha will handle dashboard UI.' },
        { time: '10:14 AM', speaker: 'Sneha', text: 'Understood. I will also create the responsive mobile variants before our review.' },
        { time: '10:15 AM', speaker: 'Anjali Sharma', text: 'I will escalate the API endpoints to the platform lead today so we can unblock Rahul before Friday.' }
      ],
      analysis: {
        decisions: [
          { id: 'dec_1', text: 'Launch the website on September 20, 2026.', category: 'Milestone', rationale: 'Final release schedule agreed by all stakeholders.' },
          { id: 'dec_2', text: 'Rahul will lead development of the login page.', category: 'Ownership', rationale: 'Assigned to ensure secure authentication flows.' },
          { id: 'dec_3', text: 'Sneha will handle dashboard design and mobile variants.', category: 'Design', rationale: 'Approved to complete design tokens and UI mockups.' }
        ],
        actionItems: [
          { id: 'act_1', task: 'Complete login page and auth flow', owner: 'Rahul Mehta', deadline: 'Sep 15, 2026', status: 'Completed', priority: 'High' },
          { id: 'act_2', task: 'Design dashboard & color tokens', owner: 'Sneha', deadline: 'Sep 18, 2026', status: 'In Progress', priority: 'Medium' },
          { id: 'act_3', task: 'Review API integration with backend team', owner: 'Anjali Sharma', deadline: 'Sep 17, 2026', status: 'Pending', priority: 'High' },
          { id: 'act_4', task: 'Escalate API endpoints to platform lead', owner: 'Anjali Sharma', deadline: 'Sep 10, 2026', status: 'Completed', priority: 'High' },
          { id: 'act_5', task: 'Prepare mobile responsive design variants', owner: 'Sneha', deadline: 'Sep 19, 2026', status: 'Pending', priority: 'Low' }
        ],
        owners: [
          {
            name: 'Rahul Mehta',
            role: 'Lead Frontend Engineer',
            tasks: [
              { id: 'act_1', task: 'Complete login page and auth flow', deadline: 'Sep 15, 2026', status: 'Completed' },
              { id: 'act_3_sub', task: 'Assist on API integration review', deadline: 'Sep 17, 2026', status: 'Pending' }
            ]
          },
          {
            name: 'Sneha',
            role: 'Senior UI/UX Designer',
            tasks: [
              { id: 'act_2', task: 'Design dashboard & color tokens', deadline: 'Sep 18, 2026', status: 'In Progress' },
              { id: 'act_5', task: 'Prepare mobile responsive design variants', deadline: 'Sep 19, 2026', status: 'Pending' }
            ]
          },
          {
            name: 'Anjali Sharma',
            role: 'QA & Technical PM',
            tasks: [
              { id: 'act_3', task: 'Review API integration with backend team', deadline: 'Sep 17, 2026', status: 'Pending' },
              { id: 'act_4', task: 'Escalate API endpoints to platform lead', deadline: 'Sep 10, 2026', status: 'Completed' }
            ]
          }
        ],
        deadlines: [
          { date: 'Sep 10, 2026', title: 'Escalate API endpoints', owner: 'Anjali Sharma', daysRemaining: 1, status: 'Completed' },
          { date: 'Sep 15, 2026', title: 'Complete login page', owner: 'Rahul Mehta', daysRemaining: 6, status: 'Upcoming' },
          { date: 'Sep 17, 2026', title: 'Review API integration', owner: 'Anjali Sharma', daysRemaining: 8, status: 'Upcoming' },
          { date: 'Sep 18, 2026', title: 'Complete dashboard design', owner: 'Sneha', daysRemaining: 9, status: 'Upcoming' },
          { date: 'Sep 20, 2026', title: 'Website Official Launch', owner: 'Core Team', daysRemaining: 11, status: 'Upcoming' }
        ],
        risks: [
          {
            id: 'risk_1',
            risk: 'The API is not ready.',
            impact: 'May delay frontend development, integration testing, and quality assurance.',
            severity: 'High',
            action: 'Follow up with the API team before September 15 and unblock authentication contracts.'
          },
          {
            id: 'risk_2',
            risk: 'Dashboard design approval timeline is tight.',
            impact: 'Might compress the review cycle before the September 20 launch.',
            severity: 'Medium',
            action: 'Conduct mid-sprint async Figma review on September 14.'
          }
        ],
        followUpMessage: {
          subject: 'Meeting Follow-up – Website Project Launch & Engineering Sync',
          body: `Hi Team,

Here is the executive summary and action plan from today's meeting:

Key Decisions:
• We have officially decided to launch the website on September 20, 2026.
• Rahul will lead the complete development of the login page and auth flow.
• Sneha will handle the dashboard UI/UX design and token systems.

Action Items & Deadlines:
• Complete login page — Rahul (Sept 15)
• Review API integration — Anjali (Sept 17)
• Complete dashboard design — Sneha (Sept 18)
• Website Launch — Team (Sept 20)

Risks & Dependencies:
• The API is not ready yet, which may delay development and testing. Anjali is following up with the platform squad immediately.

Let's stay aligned and keep each other updated in the channel.

Thanks,
Snehitha Reddy
Head of Product & Delivery`
        }
      }
    },
    {
      id: 'meet_02',
      userId: 'usr_snehitha',
      title: 'Product Roadmap Q4 & AI Feature Prioritization',
      sourceType: 'Microsoft Teams',
      sourceUrl: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_roadmap_2026',
      date: 'Aug 29, 2026',
      duration: '1 hr',
      participants: ['Snehitha Reddy', 'David Chen', 'Priya Nair', 'Marcus Brody'],
      status: 'Completed',
      transcript: [
        { time: '02:00 PM', speaker: 'Snehitha Reddy', text: 'Welcome team. We need to prioritize our Q4 AI autonomous workflow capabilities and establish ownership.' },
        { time: '02:10 PM', speaker: 'David Chen', text: 'We should deploy the multi-agent orchestration engine by October 12.' },
        { time: '02:25 PM', speaker: 'Priya Nair', text: 'I will prepare the enterprise security compliance dossier before October 5.' },
        { time: '02:40 PM', speaker: 'Marcus Brody', text: 'Cloud compute costs might exceed Q4 budget if LLM caching is not implemented.' },
        { time: '02:50 PM', speaker: 'Snehitha Reddy', text: 'Decision: Marcus will implement semantic prompt caching by September 30 to keep costs in check.' }
      ],
      analysis: {
        decisions: [
          { id: 'dec_201', text: 'Prioritize multi-agent orchestration for Q4 flagship release.', category: 'Roadmap', rationale: 'Drives highest enterprise market demand.' },
          { id: 'dec_202', text: 'Implement semantic prompt caching prior to full rollout.', category: 'Cost Optimization', rationale: 'Mitigates projected 35% compute overrun.' }
        ],
        actionItems: [
          { id: 'act_201', task: 'Implement semantic prompt caching', owner: 'Marcus Brody', deadline: 'Sep 30, 2026', status: 'Completed', priority: 'High' },
          { id: 'act_202', task: 'Prepare enterprise security compliance dossier', owner: 'Priya Nair', deadline: 'Oct 05, 2026', status: 'In Progress', priority: 'High' },
          { id: 'act_203', task: 'Deploy multi-agent orchestration engine', owner: 'David Chen', deadline: 'Oct 12, 2026', status: 'Pending', priority: 'Medium' }
        ],
        owners: [
          { name: 'Marcus Brody', role: 'Staff Infrastructure Architect', tasks: [{ id: 'act_201', task: 'Implement semantic prompt caching', deadline: 'Sep 30, 2026', status: 'Completed' }] },
          { name: 'Priya Nair', role: 'Security & Compliance Lead', tasks: [{ id: 'act_202', task: 'Prepare enterprise security compliance dossier', deadline: 'Oct 05, 2026', status: 'In Progress' }] },
          { name: 'David Chen', role: 'AI Engineering Lead', tasks: [{ id: 'act_203', task: 'Deploy multi-agent orchestration engine', deadline: 'Oct 12, 2026', status: 'Pending' }] }
        ],
        deadlines: [
          { date: 'Sep 30, 2026', title: 'Implement semantic caching', owner: 'Marcus Brody', daysRemaining: 21, status: 'Completed' },
          { date: 'Oct 05, 2026', title: 'Security dossier completion', owner: 'Priya Nair', daysRemaining: 26, status: 'Upcoming' },
          { date: 'Oct 12, 2026', title: 'Deploy orchestration engine', owner: 'David Chen', daysRemaining: 33, status: 'Upcoming' }
        ],
        risks: [
          { id: 'r_201', risk: 'Cloud compute cost escalation from unoptimized LLM queries.', impact: 'May exceed quarterly cloud budget by 30-40%.', severity: 'High', action: 'Enforce Redis semantic response caching before production load testing.' }
        ],
        followUpMessage: {
          subject: 'Action Plan: Q4 Product Roadmap & Feature Prioritization',
          body: `Hi Team,\n\nThanks for a productive Q4 roadmap sync. Here are our key commitments:\n\n• Multi-agent orchestration is prioritized for Q4 release.\n• Marcus will implement prompt caching by Sept 30.\n• Priya will finalize the security compliance dossier by Oct 5.\n• David will lead orchestration engine deployment by Oct 12.\n\nBest,\nSnehitha Reddy`
        }
      }
    },
    {
      id: 'meet_03',
      userId: 'usr_snehitha',
      title: 'YouTube – Next Gen AI Autonomous Agents 2026',
      sourceType: 'YouTube',
      sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      date: 'Aug 20, 2026',
      duration: '50 min',
      participants: ['Dr. Andrew Miller (Keynote)', 'Tech Summit Panel'],
      status: 'Completed',
      transcript: [
        { time: '00:00', speaker: 'Dr. Andrew Miller', text: 'Welcome to the 2026 AI Summit. Today we are discussing meeting intelligence and agentic workflows.' },
        { time: '12:30', speaker: 'Dr. Andrew Miller', text: 'The biggest breakthrough is moving from passive note-taking to autonomous action execution.' },
        { time: '28:15', speaker: 'Panelist', text: 'Teams waste 4.2 hours per week formatting notes and chasing action items.' },
        { time: '41:00', speaker: 'Dr. Andrew Miller', text: 'The recommendation for 2026 enterprise teams is adopting zero-upload link-based transcription and automatic task extraction.' }
      ],
      analysis: {
        decisions: [
          { id: 'dec_301', text: 'Adopt automated link-only meeting processing standard across teams.', category: 'Strategy', rationale: 'Eliminates 4.2 hours of weekly overhead per employee.' }
        ],
        actionItems: [
          { id: 'act_301', task: 'Audit current meeting tooling against autonomous agents', owner: 'Snehitha Reddy', deadline: 'Sep 25, 2026', status: 'In Progress', priority: 'Medium' },
          { id: 'act_302', task: 'Share keynote recording with engineering leaders', owner: 'Marcus Brody', deadline: 'Sep 12, 2026', status: 'Completed', priority: 'Low' }
        ],
        owners: [
          { name: 'Snehitha Reddy', role: 'Head of Product', tasks: [{ id: 'act_301', task: 'Audit current meeting tooling against autonomous agents', deadline: 'Sep 25, 2026', status: 'In Progress' }] },
          { name: 'Marcus Brody', role: 'Staff Architect', tasks: [{ id: 'act_302', task: 'Share keynote recording with engineering leaders', deadline: 'Sep 12, 2026', status: 'Completed' }] }
        ],
        deadlines: [
          { date: 'Sep 12, 2026', title: 'Share keynote summary', owner: 'Marcus Brody', daysRemaining: 3, status: 'Completed' },
          { date: 'Sep 25, 2026', title: 'Complete tooling audit', owner: 'Snehitha Reddy', daysRemaining: 16, status: 'Upcoming' }
        ],
        risks: [
          { id: 'r_301', risk: 'Resistance to automated note-taking tools without team training.', impact: 'Low adoption rates if workflows are not seamless.', severity: 'Low', action: 'Provide a 10-minute demo session for team leads.' }
        ],
        followUpMessage: {
          subject: 'Key Takeaways & Actions from Next Gen AI Keynote',
          body: `Hi Leadership Team,\n\nAttached are key takeaways from the 2026 AI Autonomous Agents keynote:\n• Zero-upload link automation is becoming the industry standard.\n• Snehitha will lead our internal audit by Sept 25.\n\nBest,\nSnehitha`
        }
      }
    }
  ]
};

// Ensure database file exists
export function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

export function getDB() {
  initDB();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB, re-initializing:', err);
    initDB();
    return initialData;
  }
}

export function saveDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}
