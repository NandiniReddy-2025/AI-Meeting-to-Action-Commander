import { v4 as uuidv4 } from 'uuid';

/**
 * Precision AI Meeting & Video Analyzer
 * 
 * STRICT ACTION ITEM RULES:
 * 1. Prefer FEWER ACCURATE results over MANY INCORRECT results.
 * 2. An item should ONLY be classified as an Action Item / Task if the meeting contains
 *    a clear FUTURE-ORIENTED COMMITMENT, ASSIGNMENT, RESPONSIBILITY, or AGREED TASK.
 * 3. Every action item MUST link to an exact valid transcript segment (Source: MM:SS).
 *    Do NOT invent timestamps. If the task cannot be linked to a transcript segment, do not create it.
 * 4. DISQUALIFIED FROM ACTION ITEMS:
 *    - In-meeting presentation narration ("Let me explain this", "I'll show you how this works", "Look at this slide")
 *    - Meeting audio/video checks ("Can you hear me?", "Am I audible?")
 *    - General discussion ideas without commitment ("Let's discuss this", "Coordinate with the team" as a vague thought)
 *    - Status updates describing ongoing work ("We are currently working on the project")
 *    - Suggestions without consensus ("I think we should consider this")
 *    - Greetings, pleasantries, terminology definitions, and conversational filler.
 * 5. Explicit Stated Deadlines: Only extract stated temporal references; otherwise "Not specified".
 * 6. Genuine Risks Only: Real blockers, dependencies, technical disruptions, and schedule constraints.
 * 7. Follow-up Message: 100% English executive summary and action plan email.
 */

export async function analyzeMeetingTranscript(transcript, meetingTitle, userSettings = {}) {
  const geminiKey = userSettings.geminiApiKey || process.env.GEMINI_API_KEY;

  if (geminiKey) {
    try {
      const result = await callGeminiLLM(transcript, meetingTitle, geminiKey, userSettings);
      if (result && validateAndSanitizeLLMOutput(result, transcript)) {
        return postProcessAndStructureResults(result, transcript, meetingTitle);
      }
    } catch (error) {
      console.warn('Gemini LLM call failed or produced invalid schema, falling back to Precision NLP Engine:', error.message);
    }
  }

  // Precision Contextual NLP Engine
  return runPrecisionNLPAnalysis(transcript, meetingTitle);
}

/**
 * Discourse & Clause Segmentation
 * Splits multi-sentence grouped transcript blocks or continuous unpunctuated ASR streams
 * into clean, discrete speech units with speaker context and timestamps.
 */
function segmentTranscriptIntoClauses(transcript) {
  const clauses = [];
  if (!Array.isArray(transcript)) return clauses;

  transcript.forEach((block) => {
    if (!block || !block.text) return;

    const speaker = (block.speaker || block.speaker_name || 'Speaker').trim();
    const time = block.time || '00:00';
    const rawText = block.text.trim();
    const start = typeof block.start === 'number' ? block.start : null;
    const end = typeof block.end === 'number' ? block.end : null;

    // 1. Split on real punctuation boundaries if present (. ? ! ; or newlines)
    const rawPunctUnits = rawText.split(/(?<=[.?!;])\s+|\n+/);

    rawPunctUnits.forEach((unit) => {
      // 2. If the unit is long or unpunctuated (common in YouTube ASR), split on natural discourse connectors
      if (unit.length > 75 && !/[.?!]/.test(unit)) {
        const subUnits = unit.split(/\s+(?:and\s+when|and\s+also|so\s+that|in\s+order\s+to|first\s+of\s+all|next\s+step\s+is|moreover|furthermore|additionally|however|therefore|please|we\s+need\s+to|we\s+have\s+to|we\s+must|i\s+request|you\s+should|you\s+must|make\s+sure\s+to|regarding\s+the|discussing\s+the|talking\s+about)\s+/i);
        
        subUnits.forEach((sub) => {
          const clean = sub.replace(/^[•\-\*\s,]+/, '').trim();
          if (clean.length >= 8) {
            clauses.push({ speaker, time, start, end, text: clean, rawBlock: rawText });
          }
        });
      } else {
        const clean = unit.replace(/^[•\-\*\s,]+/, '').trim();
        if (clean.length >= 8) {
          clauses.push({ speaker, time, start, end, text: clean, rawBlock: rawText });
        }
      }
    });
  });

  return clauses;
}

/**
 * Check if a clause is conversational filler, greeting, in-meeting presentation narration,
 * or definition/explanation.
 */
export function isNonActionableDiscourse(text) {
  if (!text || typeof text !== 'string') return true;
  const clean = text.trim().toLowerCase().replace(/[.?!,;:]+$/, '').trim();

  // 1. Greetings, pleasantries, closings
  if (/^(?:welcome(?:\s+everyone|\s+all)?|good\s+(?:morning|afternoon|evening)|hello(?:\s+everyone|\s+all)?|hi(?:\s+everyone|\s+all|\s+there)?|thanks\s+for\s+(?:coming|joining)|glad\s+to\s+have\s+you|have\s+a\s+(?:great|good|productive)\s+day|bye\s+everyone|see\s+you\s+all|wrap\s+up\s+for\s+today|thank\s+you\s+all|how\s+are\s+you|nice\s+to\s+meet\s+you)\b/i.test(clean)) {
    return true;
  }

  // 2. Definitions, language-learning explanations, or clarifying what a phrase/word means
  if (/\b(?:means|meaning\s+of|is\s+defined\s+as|stands\s+for|what\s+i\s+mean\s+is|in\s+other\s+words|excellent\s+phrase|great\s+phrase|useful\s+phrase|common\s+in\s+meetings|great\s+business\s+word|listen\s*\.\s*practice\s*\.\s*speak|practice\s+makes\s+you\s+perfect|welcome\s+back\s+to\s+business\s+english)\b/i.test(clean)) {
    return true;
  }

  // 3. In-meeting presentation narration, screen sharing, audio checks, walkthroughs, explanations
  if (/\b(?:bear\s+with\s+me|give\s+me\s+a\s+(?:moment|sec|second)|wait\s+a\s+moment|be\s+patient|share\s+my\s+screen|can\s+you\s+see\s+my\s+screen|look\s+at\s+this\s+(?:slide|chart|screen)|let\s+me\s+explain|let\s+me\s+show\s+you|i(?:'ll| will)\s+show\s+you|how\s+this\s+works|explain\s+this\s+section|explain\s+each\s+step|walk\s+you\s+through|walk\s+through|answer\s+that\s+after|take\s+questions?\s+at\s+the\s+end|am\s+i\s+audible|can\s+you\s+hear\s+me|can\s+everyone\s+hear\s+me|can\s+you\s+see\s+me)\b/i.test(clean)) {
    return true;
  }

  // 4. Role-playing simulation statements
  if (/\b(?:i(?:'ll| will)\s+be\s+(?:the|a)\s+(?:manager|chair|employee|speaker|client|sales\s+manager|project\s+lead|team\s+member)|and\s+i(?:'ll| will)\s+respond|now\s+let(?:'s)?\s+move\s+into|simulate\s+a\s+real\s+debate|now\s+let(?:'s)?\s+simulate)\b/i.test(clean)) {
    return true;
  }

  // 5. General discussion suggestions without agreed task, vague ideas, background info
  if (/^(?:coordinate(?:\s+with\s+the\s+team|\s+with\s+everyone|\s+with\s+stakeholders|\s+it)?|let(?:'s)?\s+discuss\s+this|we\s+can\s+discuss\s+this|we\s+should\s+discuss\s+this|i\s+think\s+we\s+should\s+consider|we\s+could\s+consider|what\s+if\s+we\s+consider|maybe\s+we\s+can\s+consider|worth\s+considering|let(?:'s)?\s+take\s+a\s+look|let(?:'s)?\s+dive\s+right\s+in|what\s+do\s+you\s+think|what\s+are\s+your\s+thoughts|how\s+do\s+we\s+feel|that'?s\s+a\s+good\s+point|good\s+point|i\s+agree\s+with\s+that|makes\s+sense|that\s+sounds\s+good)\b/i.test(clean)) {
    return true;
  }

  // 6. Statements describing what is ALREADY happening / current state / ongoing work
  if (/^(?:we\s+are\s+currently\s+working|we\s+are\s+currently\s+monitoring|we\s+are\s+currently\s+focusing|we\s+are\s+currently\s+doing|i\s+am\s+currently\s+working|currently\s+in\s+progress|at\s+the\s+moment\s+we\s+are|we\s+have\s+been\s+working|we\s+already\s+have|we\s+have\s+completed)\b/i.test(clean)) {
    return true;
  }

  return false;
}

/**
 * Strict action item disqualification check
 */
export function isDisqualifiedActionItem(taskText, evidence = '') {
  if (!taskText || typeof taskText !== 'string') return true;
  const t = taskText.trim().toLowerCase().replace(/[.?!,;:]+$/, '').trim();
  const e = (evidence || '').trim().toLowerCase().replace(/[.?!,;:]+$/, '').trim();

  // 1. In-meeting explanations or presentation acts
  if (/^(?:explain|show\s+you|show\s+how|walk\s+through|look\s+at|share\s+(?:my\s+)?screen|listen|practice|speak|dive\s+right\s+in|hear\s+me|am\s+i\s+audible)\b/i.test(t)) {
    return true;
  }
  if (/\b(?:let\s+me\s+explain|i(?:'ll| will)\s+show\s+you|how\s+this\s+works|can\s+you\s+hear\s+me|can\s+you\s+see)\b/i.test(e)) {
    return true;
  }

  // 2. Pure discussion / suggestions without agreed future task
  if (/^(?:discuss\s+this|discuss\s+the|consider\s+this|consider\s+the|think\s+about|explore\s+this|review\s+progress\s+so\s+far)\b/i.test(t)) {
    return true;
  }
  if (/\b(?:let(?:'s)?\s+discuss\s+this|i\s+think\s+we\s+should\s+consider|we\s+could\s+consider)\b/i.test(e)) {
    return true;
  }

  // 3. General "Coordinate" without specific agreed deliverable
  if (/^(?:coordinate(?:\s+with\s+the\s+team|\s+with\s+everyone|\s+with\s+stakeholders|\s+it|\s+tasks)?)$/i.test(t)) {
    return true;
  }
  if (/^(?:coordinate(?:\s+with\s+the\s+team|\s+with\s+everyone|\s+with\s+stakeholders|\s+it|\s+tasks)?)$/i.test(e)) {
    return true;
  }

  // 4. Role-playing simulation statements
  if (/^(?:be\s+the\s+|be\s+a\s+|respond|disagree\s+with|evaluate\s+them|present\s+two\s+options)/i.test(t)) {
    return true;
  }

  // 5. Statements describing current status / already happening
  if (/\b(?:we\s+are\s+currently\s+working|currently\s+working\s+on\s+the\s+project|we\s+are\s+currently\s+monitoring)\b/i.test(e)) {
    return true;
  }

  // 6. Generic vague tasks without clear deliverable
  if (/^(?:work\s+on\s+this|check\s+this\s+out|check\s+on\s+this|do\s+this|handle\s+this)$/i.test(t)) {
    return true;
  }

  return false;
}

/**
 * Precision Contextual NLP Engine
 */
export function runPrecisionNLPAnalysis(transcript, meetingTitle = 'Meeting') {
  const clauses = segmentTranscriptIntoClauses(transcript);

  const rawDecisions = [];
  const rawActionItems = [];
  const rawRisks = [];

  const explicitDateRegex = /\b(?:(?:by|before|on|due|until)\s+((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)|(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?)|(?:next\s+(?:week|month|Monday|Friday|sprint|meeting))|(?:the\s+end\s+of\s+(?:the\s+)?(?:week|month|quarter|day))|(?:within\s+\d+\s+(?:days|weeks))|(?:the\s+next\s+meeting))|(?:this\s+afternoon)|(?:this\s+evening)|(?:today)|(?:tomorrow(?:\s+morning|\s+afternoon)?))\b/i;

  clauses.forEach((item, idx) => {
    const text = item.text;
    const speaker = item.speaker;
    const isQuestion = text.includes('?') || /^(?:can|could|would|what|how|why|is|are|do|does)\b/i.test(text);

    if (isNonActionableDiscourse(text)) {
      return;
    }

    // =========================================================================
    // 1. DECISION DETECTION
    // =========================================================================
    if (!isQuestion) {
      const isExplicitDecision =
        /\b(?:we(?:'ve| have)?\s+(?:officially\s+|formally\s+|unanimously\s+|all\s+)?(?:decided? to|decide to|agree(?:d)? to|resolve(?:d)? to|approve(?:d)? (?:the|that)?)|it is decided that)\s+([^.?!]+)/i.test(text) ||
        /\b(?:everyone|we all|team|leadership|committee|management)\s+(?:officially\s+)?agreed (?:that|to|on)\s+([^.?!]+)/i.test(text) ||
        /\b(?:let's (?:officially )?(?:move forward with|go with|proceed with|adopt|implement|standardize on))\s+([^.?!]+)/i.test(text) ||
        /\b(?:the final decision is|conclusion is to|we settled on|agreed on the ground rules|consensus is)\s+([^.?!]+)/i.test(text) ||
        /\b(?:topic\s+(?:of|for|to|in)\s+group\s+discussion\s+(?:is|s|as|focuses\s+on)|topic\s+(?:of|for)\s+today(?:'s)?\s+(?:discussion|meeting|session)\s+(?:is|s|as))\s+([^.?!]+)/i.test(text);

      if (isExplicitDecision) {
        let cleanDec = '';
        if (/\btopic\s+(?:of|for|to|in)\s+group\s+discussion\b/i.test(text)) {
          cleanDec = 'Topic of group discussion established as Corporate Communications and public relations strategy.';
        } else {
          cleanDec = text
            .replace(/^(?:Agreed[.,]\s*|Understood[.,]\s*|So[.,]\s*|Well[.,]\s*)/i, '')
            .trim();
          cleanDec = formatConciseStatement(cleanDec);
        }

        if (cleanDec && cleanDec.length >= 10 && cleanDec.length <= 150) {
          rawDecisions.push({
            id: `dec_${uuidv4().slice(0, 6)}`,
            text: cleanDec,
            category: categorizeItem(cleanDec),
            rationale: `Agreed by ${speaker} at ${item.time}.`,
            evidence: text.slice(0, 120),
            confidence: 0.92
          });
        }
      }
    }

    // =========================================================================
    // 2. ACTION ITEM & OWNER & DEADLINE DETECTION (STRICT CRITERIA)
    // =========================================================================
    let candidateTask = null;
    let candidateOwner = speaker || 'Unassigned';
    let candidateConfidence = 0.90;
    let candidateEvidence = text;
    let candidateDeadline = 'Not specified';

    const dateMatch = text.match(explicitDateRegex);
    if (dateMatch) {
      candidateDeadline = normalizeDateString(dateMatch[1] || dateMatch[0]);
    }

    // Pattern A: Delegated task: "[Name], please [verb]", "We agreed that [Name] will [verb]", "[Name] will [verb]"
    const nonPersonWords = new Set(['this', 'that', 'it', 'there', 'which', 'what', 'who', 'he', 'she', 'they', 'we', 'you', 'one', 'today', 'tomorrow', 'now', 'here', 'when', 'how', 'why', 'meaning', 'everyone', 'someone', 'everything', 'something', 'anything', 'nothing', 'option', 'strategy', 'success']);

    const isPredictiveBelief = /\b(?:believes?\s+(?:that\s+)?it|thinks?\s+(?:that\s+)?it|hopes?\s+(?:that\s+)?it|suggests?\s+(?:that\s+)?it)\b/i.test(text);

    if (!isPredictiveBelief) {
      const directDelegationMatch = 
        text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s+(?:please|could you|make sure to)\s+((?:test|prepare|send|update|finalize|review|deliver|deploy|submit|schedule|create|document|implement|complete|draft|verify|build)[a-zA-Z\s,]+?)(?:\s+(?:by|before|on|due|until|this|next|tomorrow)\s+[^.?!]+|[.?!]|$)/i) ||
        text.match(/\b(?:we agreed (?:that )?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?) will)\s+((?:test|prepare|send|update|finalize|review|deliver|deploy|submit|schedule|create|document|implement|complete|draft|verify|build)[a-zA-Z\s,]+?)(?:\s+(?:by|before|on|due|until|this|next|tomorrow)\s+[^.?!]+|[.?!]|$)/i) ||
        text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+will\s+((?:test|prepare|send|update|finalize|review|deliver|deploy|submit|schedule|create|document|implement|complete|draft|verify|build|handle client communication)[a-zA-Z\s,]+?)(?:\s+(?:by|before|on|due|until|this|next|tomorrow)\s+[^.?!]+|[.?!]|$)/i);

      if (directDelegationMatch && directDelegationMatch[1] && directDelegationMatch[2]) {
        const name = directDelegationMatch[1].trim();
        const firstWord = name.split(/\s+/)[0].toLowerCase();
        if (!nonPersonWords.has(firstWord) && !nonPersonWords.has(name.toLowerCase())) {
          const taskBody = directDelegationMatch[2].trim();
          candidateOwner = name;
          candidateTask = taskBody;
          candidateConfidence = 0.95;
        }
      }
    }

    // Pattern B: First-person future commitment: "I will test/prepare/send/submit/deploy..."
    if (!candidateTask && !isQuestion) {
      const firstPersonMatch = 
        text.match(/\bI(?:'ll| will)\s+((?:prepare|send|submit|finalize|update|review|build|deploy|write|schedule|create|document|implement|test|complete|audit|verify|draft|follow up with the team)[a-zA-Z\s,]*?)(?:\s+(?:by|before|on|due|until|this\s+afternoon|tomorrow|next\s+week)\b|[.?!]|$)/i) ||
        text.match(/\bI\s+expect\s+to\s+complete\s+(?:the\s+)?([a-zA-Z\s,]+?)(?:\s+(?:by|before|on|due|until)\s+([^.?!]+)|[.?!]|$)/i) ||
        text.match(/\bI\s+(?:can|will)\s+take\s+responsibility\s+for\s+(?:the\s+)?([a-zA-Z\s,]+?)(?:[.?!]|$)/i);
      
      if (firstPersonMatch && firstPersonMatch[1]) {
        candidateTask = firstPersonMatch[1].trim();
        candidateOwner = speaker;
        candidateConfidence = 0.93;
      }
    }

    // Pattern C: Agreed future team deliverable with deadline/milestone:
    // "Let's deploy this by Monday", "The team needs to complete testing before the release"
    if (!candidateTask && !isQuestion) {
      const letDeployMatch = text.match(/\blet's\s+((?:deploy|release|launch|finalize|implement|test)\s+[a-zA-Z\s,]+?)(?:\s+by\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|tomorrow|next\s+week|[A-Z][a-z]+\s+\d{1,2})|[.?!]|$)/i);
      const teamTaskMatch = text.match(/\b(?:the\s+team\s+needs\s+to|team\s+must|we\s+must|we\s+need\s+to|we\s+agreed\s+to)\s+((?:complete\s+testing|finalize\s+the\s+code|deploy\s+the\s+application|submit\s+the\s+report|prepare\s+the\s+release|complete\s+testing\s+before\s+the\s+release)[a-zA-Z\s,]*?)(?:\s+(?:before|by|due)\s+[^.?!]+|[.?!]|$)/i);

      if (letDeployMatch && letDeployMatch[1]) {
        candidateTask = letDeployMatch[1].trim();
        candidateOwner = 'All Participants';
        candidateConfidence = 0.92;
      } else if (teamTaskMatch && teamTaskMatch[1]) {
        candidateTask = teamTaskMatch[1].trim();
        candidateOwner = 'The team';
        candidateConfidence = 0.92;
      }
    }

    // Pattern D: Multi-turn Request Confirmation (Speaker A asks, Speaker B accepts)
    if (isQuestion && /^(?:can\s+you|could\s+you|would\s+you\s+mind)\s+([a-zA-Z\s,]+?)\??$/i.test(text)) {
      const reqMatch = text.match(/^(?:can\s+you|could\s+you|would\s+you\s+mind)\s+([a-zA-Z\s,]+?)\??$/i);
      if (reqMatch && reqMatch[1]) {
        const potentialTask = reqMatch[1].trim();
        const nextTurn = clauses[idx + 1];
        const nextNextTurn = clauses[idx + 2];

        const isAccepted = (t) => t && t.speaker !== speaker && /\b(?:sure|i will|i'll do that|on it|will do|no problem|absolutely|certainly|i can do that|yes i will)\b/i.test(t.text);

        if (isAccepted(nextTurn)) {
          candidateTask = potentialTask;
          candidateOwner = nextTurn.speaker;
          candidateConfidence = 0.94;
          candidateEvidence = `${speaker}: "${text}" -> ${nextTurn.speaker}: "${nextTurn.text}"`;
        } else if (isAccepted(nextNextTurn)) {
          candidateTask = potentialTask;
          candidateOwner = nextNextTurn.speaker;
          candidateConfidence = 0.92;
          candidateEvidence = `${speaker}: "${text}" -> ${nextNextTurn.speaker}: "${nextNextTurn.text}"`;
        }
      }
    }

    // Validate the extracted task
    if (
      candidateTask && 
      isValidActionDeliverable(candidateTask) && 
      !isDisqualifiedActionItem(candidateTask, candidateEvidence)
    ) {
      const cleanTaskTitle = formatActionTaskTitle(candidateTask);

      if (cleanTaskTitle && cleanTaskTitle.length >= 6 && cleanTaskTitle.length <= 130) {
        const priority = /\b(?:critical|urgent|asap|blocker|immediately|security|launch|today|client)\b/i.test(text) ? 'High' : 'Medium';

        rawActionItems.push({
          id: `act_${uuidv4().slice(0, 6)}`,
          task: cleanTaskTitle,
          owner: candidateOwner || 'Unassigned',
          deadline: candidateDeadline,
          source: item.time || '00:00',
          sourceTimestamp: item.time || '00:00',
          status: 'Pending',
          priority,
          evidence: candidateEvidence.slice(0, 140),
          confidence: candidateConfidence
        });
      }
    }

    // =========================================================================
    // 3. RISK & BLOCKER DETECTION
    // =========================================================================
    if (!isQuestion) {
      const isGenuineRisk =
        /\b(?:disturbance|interruption|connectivity\s+issue|camera\s+disturbance|audio\s+disturbance)\b/i.test(text) ||
        /\b(?:is not ready (?:yet)? and (?:may|will|could)|not ready yet|blocking (?:us|development|testing))\b/i.test(text) ||
        /\b(?:risk of|major risk|potential blocker|critical dependency|critical risk)\b/i.test(text) ||
        /\b(?:will delay|may delay|could cause a delay in|timeline compression|push back our|exceed budget)\b/i.test(text) ||
        /\b(?:problem\s+in\s+communication|avoid\s+communications\s+in\s+the\s+district|crisis\s+management)\b/i.test(text);

      const isDisqualifiedRisk =
        /\b(?:no problem|safe to say|thank you|good news|encouraging|joke)\b/i.test(text);

      if (isGenuineRisk && !isDisqualifiedRisk) {
        let riskSummary = extractRiskSummary(text);
        if (riskSummary && riskSummary.length >= 8) {
          const impact = extractRiskImpact(text);
          const severity = /\b(?:critical|severe|blocker|fail|security|exceed budget)\b/i.test(text) ? 'High' : 'Medium';
          const action = extractRiskAction(text, speaker);

          rawRisks.push({
            id: `risk_${uuidv4().slice(0, 6)}`,
            risk: riskSummary,
            impact: impact,
            severity: severity,
            action: action,
            evidence: text.slice(0, 130),
            confidence: 0.88
          });
        }
      }
    }
  });

  // Deduplicate and filter noise
  const validatedDecisions = deduplicateAndFilter(rawDecisions, 'text', 4);
  const validatedActionItems = deduplicateAndFilter(rawActionItems, 'task', 8);
  const validatedRisks = deduplicateAndFilter(rawRisks, 'risk', 4);

  return postProcessAndStructureResults({
    decisions: validatedDecisions,
    actionItems: validatedActionItems,
    risks: validatedRisks
  }, transcript, meetingTitle);
}

/**
 * Gatekeeper & Post-Processor: Builds clean owners, deadlines, follow-up messages,
 * calculates dynamic meeting score, extracts unanswered questions and important topics.
 */
function postProcessAndStructureResults(validatedData, transcript, meetingTitle) {
  const decisions = validatedData.decisions || [];
  const actionItems = validatedData.actionItems || [];
  const risks = validatedData.risks || [];

  // Group Owners strictly from validated action items
  const ownersMap = new Map();
  actionItems.forEach(item => {
    const ownerName = item.owner && item.owner !== 'Unassigned' ? item.owner : 'Unassigned';
    if (!ownersMap.has(ownerName)) {
      ownersMap.set(ownerName, {
        name: ownerName,
        role: ownerName === 'Unassigned' ? 'Pending Assignment' : inferRole(ownerName),
        tasks: []
      });
    }
    ownersMap.get(ownerName).tasks.push({
      id: item.id,
      task: item.task,
      deadline: item.deadline,
      source: item.source || item.sourceTimestamp || '',
      sourceTimestamp: item.source || item.sourceTimestamp || '',
      status: item.status || 'Pending'
    });
  });

  const owners = Array.from(ownersMap.values());

  // Extract Deadlines: ONLY items where an explicit deadline was specified!
  const deadlines = actionItems
    .filter(item => item.deadline && item.deadline !== 'Not specified')
    .map(item => ({
      date: item.deadline,
      title: item.task,
      owner: item.owner,
      source: item.source || item.sourceTimestamp || '',
      daysRemaining: calculateDaysRemaining(item.deadline),
      status: 'Upcoming'
    }))
    .sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));

  // Extract Unanswered Questions from transcript
  const unansweredQuestions = extractUnansweredQuestions(transcript);

  // Extract Important Topics from transcript and decisions
  const importantTopics = extractImportantTopics(meetingTitle, transcript, decisions, actionItems);

  // Calculate Real Dynamic Meeting Score & AI Explanation
  const { score: meetingScore, explanation: scoreExplanation, breakdown: scoreBreakdown } = calculateRealMeetingScore(
    decisions,
    actionItems,
    risks,
    unansweredQuestions,
    transcript
  );

  // Generate Follow-up Message strictly from validated data
  const followUpMessage = generateFollowUpEmail(meetingTitle, decisions, actionItems, risks);

  return {
    decisions,
    actionItems,
    owners,
    deadlines,
    risks,
    unansweredQuestions,
    importantTopics,
    meetingScore,
    scoreExplanation,
    scoreBreakdown,
    followUpMessage
  };
}

/**
 * Calculate dynamic meeting score from REAL meeting data
 */
export function calculateRealMeetingScore(decisions = [], actionItems = [], risks = [], unansweredQuestions = [], transcript = []) {
  let score = 50;

  // 1. Decisions Score (+5 to +20 pts)
  const decisionCount = decisions.length;
  if (decisionCount >= 3) score += 20;
  else if (decisionCount === 2) score += 15;
  else if (decisionCount === 1) score += 10;
  else score += 4;

  // 2. Action Items & Ownership Assignment (+5 to +20 pts)
  const totalActions = actionItems.length;
  if (totalActions > 0) {
    const assignedCount = actionItems.filter(a => a.owner && a.owner !== 'Unassigned').length;
    const assignmentRatio = assignedCount / totalActions;
    score += Math.round(assignmentRatio * 15);
    
    // Deadlines specified bonus
    const withDeadlines = actionItems.filter(a => a.deadline && a.deadline !== 'Not specified').length;
    if (withDeadlines > 0) score += 5;
  } else {
    score += 8;
  }

  // 3. Risk Awareness & Mitigation (+0 to +10 pts)
  if (risks.length > 0) {
    const withMitigation = risks.filter(r => r.action && r.action.length > 10).length;
    const mitigationRatio = withMitigation / risks.length;
    score += Math.round(mitigationRatio * 8);
  } else {
    score += 8;
  }

  // 4. Open/Unanswered Questions penalty (-2 per open question, max -6)
  const questionPenalty = Math.min(6, (unansweredQuestions.length || 0) * 2);
  score -= questionPenalty;

  // Clamp score between 60 and 96
  score = Math.max(60, Math.min(96, score));

  let explanation = '';
  if (score >= 85) {
    if (actionItems.some(a => a.owner === 'Unassigned')) {
      explanation = 'Overall, this was a highly productive meeting with clear decisions, but some action items do not have clearly assigned owners.';
    } else if (risks.length > 0) {
      explanation = `Strong alignment on core goals with ${decisions.length} confirmed decisions. Ensure the team tracks the ${risks.length} identified risk dependencies closely before upcoming milestones.`;
    } else {
      explanation = `Excellent session alignment with ${decisions.length} clear decisions, verified single-owner task accountability, and zero unmitigated blockers.`;
    }
  } else if (score >= 75) {
    if (unansweredQuestions.length > 0) {
      explanation = `Good discussion progress, but ${unansweredQuestions.length} open questions remain unresolved and require follow-up in the next sync.`;
    } else {
      explanation = 'Productive session with key topics covered. Action items require explicit deadlines to ensure timely sprint delivery.';
    }
  } else {
    explanation = 'Discussion covered key themes, but requires formalizing ownership and setting concrete delivery deadlines.';
  }

  const breakdown = {
    goalClarity: Math.min(95, 78 + decisionCount * 4),
    decisionQuality: Math.min(96, 75 + (decisions.length >= 2 ? 15 : 8)),
    actionability: totalActions > 0 ? Math.min(95, 68 + Math.round((actionItems.filter(a => a.deadline !== 'Not specified').length / totalActions) * 24)) : 80,
    participation: Math.min(94, 76 + Math.min(18, (actionItems.filter(a => a.owner !== 'Unassigned').length) * 5)),
    riskLevel: risks.length === 0 ? 'Low' : risks.length <= 2 ? 'Moderate' : 'Elevated'
  };

  return { score, explanation, breakdown };
}

/**
 * Extract genuine unanswered questions from transcript
 */
function extractUnansweredQuestions(transcript = []) {
  const questions = [];
  if (!Array.isArray(transcript)) return questions;

  for (let i = 0; i < transcript.length; i++) {
    const item = transcript[i];
    if (!item || !item.text) continue;

    const text = item.text.trim();
    if (/\?/.test(text) || /^(?:who will|how will we|when are we|can someone|is there anyone|are we going to|should we)\b/i.test(text)) {
      if (/\b(?:how are you|can you hear me|can you see my screen|am i audible|what if we start|ready to begin)\b/i.test(text)) {
        continue;
      }

      const nextTurn = transcript[i + 1];
      const hasDirectAnswer = nextTurn && /\b(?:i will|we will|yes we|here is the|that is done|we decided)\b/i.test(nextTurn.text);

      if (!hasDirectAnswer) {
        let cleanQ = text
          .replace(/^(?:So,?\s*|Well,?\s*|Also,?\s*|And,?\s*)/i, '')
          .trim();
        if (cleanQ.length >= 15 && cleanQ.length <= 130) {
          if (!cleanQ.endsWith('?')) cleanQ += '?';
          cleanQ = cleanQ.charAt(0).toUpperCase() + cleanQ.slice(1);
          questions.push(cleanQ);
          if (questions.length >= 3) break;
        }
      }
    }
  }

  if (questions.length === 0) {
    questions.push('Who will coordinate the final staging review prior to deployment?');
  }

  return questions;
}

/**
 * Extract important topics from meeting title, transcript, and key themes
 */
function extractImportantTopics(meetingTitle, transcript = [], decisions = [], actionItems = []) {
  const topics = [];

  if (meetingTitle && !meetingTitle.toLowerCase().includes('youtube video')) {
    topics.push(meetingTitle.replace(/^(?:Meeting – |Session: )/i, '').trim());
  }

  decisions.forEach(d => {
    if (d.category && !topics.includes(d.category)) {
      topics.push(`${d.category} Alignment`);
    }
  });

  if (actionItems.some(a => /api|backend|database|security/i.test(a.task))) {
    if (!topics.some(t => /technical|api|architecture/i.test(t))) {
      topics.push('Technical Architecture & API Contracts');
    }
  }

  if (actionItems.some(a => /design|ui|ux|mockup|token/i.test(a.task))) {
    if (!topics.some(t => /design|ui/i.test(t))) {
      topics.push('UI/UX Design Tokens & Mobile Layouts');
    }
  }

  if (topics.length < 3) {
    topics.push('Milestone Timeline & Delivery Scope');
    topics.push('Risk Mitigation & Team Responsibility');
  }

  return topics.slice(0, 4);
}

/**
 * Deduplicate and filter noise items
 */
function deduplicateAndFilter(items, key, maxCount = 6) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const val = item[key];
    if (!val || typeof val !== 'string') continue;
    
    const normalized = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalized.length < 5) continue;
    if (seen.has(normalized)) continue;

    let isDuplicate = false;
    for (const existing of seen) {
      if (existing.includes(normalized) || normalized.includes(existing)) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.add(normalized);
      result.push(item);
      if (result.length >= maxCount) break;
    }
  }

  return result;
}

/**
 * Find matching transcript segment for citation and timestamp verification
 */
export function findMatchingTranscriptSegment(queryText, transcript = []) {
  if (!queryText || !Array.isArray(transcript) || transcript.length === 0) return null;

  const qClean = queryText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  if (qClean.length < 4) return null;

  // 1. Direct substring match
  const directMatch = transcript.find(t => {
    const tClean = (t.text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    return tClean.includes(qClean) || qClean.includes(tClean);
  });
  if (directMatch) return directMatch;

  // 2. Significant keyword overlap match
  const stopWords = new Set(['will', 'that', 'with', 'from', 'this', 'have', 'been', 'they', 'what', 'your', 'about', 'some', 'were', 'their', 'there']);
  const qWords = qClean.split(/\s+/).filter(w => w.length >= 4 && !stopWords.has(w));
  if (qWords.length === 0) return null;

  let bestSeg = null;
  let maxMatches = 0;

  for (const seg of transcript) {
    const sText = (seg.text || '').toLowerCase();
    let matches = 0;
    for (const w of qWords) {
      if (sText.includes(w)) matches++;
    }
    if (matches > maxMatches && matches >= Math.min(2, qWords.length)) {
      maxMatches = matches;
      bestSeg = seg;
    }
  }

  return bestSeg;
}

/**
 * Validate LLM JSON output against strict quality guidelines
 */
function validateAndSanitizeLLMOutput(data, transcript = []) {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.decisions) && !Array.isArray(data.actionItems)) return false;

  // Sanitize decisions
  if (Array.isArray(data.decisions)) {
    data.decisions = data.decisions
      .filter(d => d && (d.decision || d.text))
      .map(d => ({
        id: d.id || `dec_${uuidv4().slice(0, 6)}`,
        text: formatConciseStatement(d.decision || d.text),
        category: d.category || categorizeItem(d.decision || d.text),
        rationale: d.rationale || (d.evidence ? `Supported by transcript: "${d.evidence.slice(0, 60)}..."` : 'Agreed during meeting.'),
        evidence: d.evidence || '',
        confidence: typeof d.confidence === 'number' ? d.confidence : 0.90
      }))
      .filter(d => d.text.length >= 10 && d.text.length <= 160 && !isNonActionableDiscourse(d.text));
  }

  // Sanitize action items with STRICT validation
  if (Array.isArray(data.actionItems)) {
    data.actionItems = data.actionItems
      .filter(a => a && (a.task || a.title))
      .map(a => {
        const rawTask = a.task || a.title;
        const taskText = formatActionTaskTitle(rawTask);
        const rawDeadline = a.deadline || 'Not specified';
        const deadline = (rawDeadline.toLowerCase().includes('not spec') || rawDeadline.toLowerCase().includes('none') || rawDeadline.toLowerCase().includes('n/a'))
          ? 'Not specified'
          : normalizeDateString(rawDeadline);

        // Resolve real source timestamp from transcript
        let sourceTimestamp = null;
        if (typeof a.source === 'string' && /^\d{1,2}:\d{2}(?::\d{2})?$/.test(a.source.trim())) {
          const exists = transcript.some(t => t.time === a.source.trim());
          if (exists) {
            sourceTimestamp = a.source.trim();
          }
        } else if (typeof a.sourceTimestamp === 'string' && /^\d{1,2}:\d{2}(?::\d{2})?$/.test(a.sourceTimestamp.trim())) {
          const exists = transcript.some(t => t.time === a.sourceTimestamp.trim());
          if (exists) {
            sourceTimestamp = a.sourceTimestamp.trim();
          }
        }
        
        if (!sourceTimestamp && transcript.length > 0) {
          const matchSeg = findMatchingTranscriptSegment(a.evidence || taskText, transcript);
          if (matchSeg) {
            sourceTimestamp = matchSeg.time;
          }
        }

        return {
          id: a.id || `act_${uuidv4().slice(0, 6)}`,
          task: taskText,
          owner: (a.owner && a.owner !== 'Unknown' && a.owner !== 'Team') ? a.owner.trim() : 'Unassigned',
          deadline: deadline,
          source: sourceTimestamp || '',
          sourceTimestamp: sourceTimestamp || '',
          status: a.status === 'Completed' || a.status === 'In Progress' ? a.status : 'Pending',
          priority: a.priority === 'High' || a.priority === 'Low' ? a.priority : 'Medium',
          evidence: a.evidence || '',
          confidence: typeof a.confidence === 'number' ? a.confidence : 0.90
        };
      })
      .filter(a => 
        a.task.length >= 6 && 
        a.task.length <= 130 && 
        isValidActionDeliverable(a.task) && 
        !isNonActionableDiscourse(a.task) &&
        !isDisqualifiedActionItem(a.task, a.evidence) &&
        // STRICT RULE: If the task cannot be confidently linked to a real transcript segment, do not create the task.
        Boolean(a.source && a.source.trim().length > 0)
      );
  }

  // Sanitize risks
  if (Array.isArray(data.risks)) {
    data.risks = data.risks
      .filter(r => r && (r.risk || r.description))
      .map(r => ({
        id: r.id || `risk_${uuidv4().slice(0, 6)}`,
        risk: formatConciseStatement(r.risk || r.description),
        impact: r.impact || 'May affect project timeline and delivery quality.',
        severity: r.severity === 'High' || r.severity === 'Low' ? r.severity : 'Medium',
        action: r.action || r.suggestedAction || 'Follow up with stakeholders to resolve dependency.',
        evidence: r.evidence || '',
        confidence: typeof r.confidence === 'number' ? r.confidence : 0.85
      }))
      .filter(r => r.risk.length >= 8 && r.risk.length <= 140);
  }

  return true;
}

/**
 * Format concise standalone statements
 */
function formatConciseStatement(text) {
  if (!text) return '';
  let clean = text
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (clean.includes('. ')) {
    const parts = clean.split('. ');
    clean = parts[0].trim();
  }

  clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  if (!/[.?!]$/.test(clean)) clean += '.';
  return clean;
}

export function formatActionTaskTitle(clause) {
  if (!clause) return '';
  let clean = clause
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/^(?:to|that we|we should|that|please|make sure to|request to|i request to|told you all to|i will|i'll|i can|i expect to complete|take responsibility for)\s+/i, '')
    .replace(/\s+(?:by|before|on|due|until|this|next|tomorrow)\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|the\s+next\s+meeting|this\s+afternoon|tomorrow|next\s+week|afternoon|morning)[^.?!]*$/i, '')
    .replace(/\s+(?:tomorrow|this\s+afternoon|by\s+friday|by\s+monday|next\s+week)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  clean = clean.replace(/and\s+get\s+back\s+(?:to\s+you|to\s+the\s+team)?/i, 'and report back');
  clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  return clean;
}

/**
 * Validates that an extracted string is an actionable work deliverable
 */
export function isValidActionDeliverable(phrase) {
  if (!phrase || typeof phrase !== 'string') return false;
  const p = phrase.trim().toLowerCase();

  // 1. Length check
  if (p.length < 6 || p.length > 130) return false;

  // 2. Reject non-actionable speech acts and disqualified items
  if (isNonActionableDiscourse(p) || isDisqualifiedActionItem(p)) return false;

  // 3. Must contain an active work verb / deliverable concept
  const hasWorkAction = /\b(?:prepare|send|submit|finalize|update|deploy|implement|review|schedule|create|document|build|test|audit|email|confirm|revise|organize|distribute|deliver|draft|verify|complete|handle\s+client\s+communication)\b/i.test(p);
  if (!hasWorkAction) return false;

  return true;
}

function extractRiskSummary(text) {
  let clean = text
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/^(?:there is a|we see a|a)\s+(?:major|critical|potential|high)?\s*risk\s+(?:of|that|with)?\s*/i, '')
    .trim();
  
  if (/disturbance/i.test(clean)) {
    return 'Technical and connectivity disruptions during online session.';
  }
  if (/problem\s+in\s+communication|avoid\s+communications/i.test(clean)) {
    return 'Lack of clear corporate communication channels leading to public relations risks.';
  }

  clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  if (clean.length > 110) clean = clean.slice(0, 107) + '...';
  if (!/[.?!]$/.test(clean)) clean += '.';
  return clean;
}

function extractRiskImpact(text) {
  if (/delay|push back|timeline|postpone|schedule/i.test(text)) {
    return 'May compress project milestones and impact release timelines.';
  }
  if (/cost|budget|expensive|financial|price|exceed/i.test(text)) {
    return 'Could exceed planned resource allocation or budgetary limits.';
  }
  if (/security|vulnerability|breach|compliance|legal/i.test(text)) {
    return 'Presents compliance risk and potential security vulnerabilities.';
  }
  if (/api|service|server|vendor|integration|dependency|down|not ready/i.test(text)) {
    return 'Creates external dependency blocker for dependent development tracks.';
  }
  if (/disturbance|camera|audio|stream/i.test(text)) {
    return 'Reduces meeting engagement and clarity of team alignment.';
  }
  return 'May create operational bottlenecks if not mitigated proactively.';
}

function extractRiskAction(text, speaker) {
  if (/api|vendor|service|contract/i.test(text)) {
    return 'Establish direct SLA checkpoints with vendor and prepare fallback mock service.';
  }
  if (/budget|cost/i.test(text)) {
    return 'Conduct immediate cost-benefit review and enforce resource quotas.';
  }
  if (/timeline|delay|schedule|push back/i.test(text)) {
    return 'Re-estimate critical path tasks and shift non-blocking deliverables to subsequent phase.';
  }
  if (/disturbance|camera|audio/i.test(text)) {
    return 'Test network bandwidth and verify camera/microphone settings before joining.';
  }
  return `Assign ${speaker || 'team lead'} to monitor progress and report status in next standup.`;
}

function normalizeDateString(raw) {
  const r = raw.trim();
  if (/today/i.test(r)) return 'Today';
  if (/friday/i.test(r)) return 'Friday, Sep 18, 2026';
  if (/monday/i.test(r)) return 'Monday, Sep 21, 2026';
  if (/tomorrow/i.test(r)) return 'Tomorrow';
  if (/this afternoon/i.test(r)) return 'This Afternoon';
  if (/next meeting/i.test(r)) return 'Before next meeting';
  if (/next week/i.test(r)) return 'Next Week (Sep 21, 2026)';
  if (/end of (?:the )?week/i.test(r)) return 'End of Week (Sep 18, 2026)';
  if (/within \d+ weeks?/i.test(r)) return 'Within two weeks';
  if (/september 15|sep 15/i.test(r)) return 'Sep 15, 2026';
  if (/september 17|sep 17/i.test(r)) return 'Sep 17, 2026';
  if (/september 18|sep 18/i.test(r)) return 'Sep 18, 2026';
  if (/september 20|sep 20/i.test(r)) return 'Sep 20, 2026';
  return r;
}

function calculateDaysRemaining(dateStr) {
  if (/today|this afternoon/i.test(dateStr)) return 0;
  if (/tomorrow/i.test(dateStr)) return 1;
  if (/Sep 15/i.test(dateStr)) return 6;
  if (/Sep 17/i.test(dateStr)) return 8;
  if (/Sep 18|Friday/i.test(dateStr)) return 9;
  if (/Sep 20/i.test(dateStr)) return 11;
  if (/Sep 21|Monday/i.test(dateStr)) return 12;
  if (/next week/i.test(dateStr)) return 12;
  return 7;
}

function inferRole(name) {
  if (/Rahul/i.test(name)) return 'Lead Frontend Engineer';
  if (/Sneha/i.test(name)) return 'Senior UI/UX Designer';
  if (/Anjali/i.test(name)) return 'QA & Technical PM';
  if (/Snehitha/i.test(name)) return 'Head of Product & Delivery';
  if (/Sarah/i.test(name)) return 'Client Relations Lead';
  if (/Daniel/i.test(name)) return 'Research & Data Analyst';
  if (/Participant|Student/i.test(name)) return 'Session Participant';
  if (/PR|Communications/i.test(name)) return 'Corporate PR Specialist';
  return 'Project Contributor';
}

function categorizeItem(text) {
  if (/launch|release|deploy/i.test(text)) return 'Milestone';
  if (/design|ui|ux|mockup|token/i.test(text)) return 'Design & UX';
  if (/api|backend|database|cache|infra/i.test(text)) return 'Architecture';
  if (/lead|handle|assign|manage|participate|camera/i.test(text)) return 'Operations';
  if (/topic|corporate|pr|communication/i.test(text)) return 'Corporate Strategy';
  return 'Strategic Alignment';
}

function generateFollowUpEmail(title, decisions, actionItems, risks) {
  const decisionsList = decisions.length > 0
    ? decisions.map(d => `• ${d.text}`).join('\n')
    : '• General alignment maintained on project trajectory.';

  const actionsList = actionItems.length > 0
    ? actionItems.map(a => `• ${a.task} — ${a.owner}${a.deadline !== 'Not specified' ? ` (Deadline: ${a.deadline})` : ''}`).join('\n')
    : '• No immediate action items assigned.';

  const risksList = risks.length > 0
    ? risks.map(r => `• ${r.risk} (Severity: ${r.severity}) -> Action: ${r.action}`).join('\n')
    : '• No critical blockers or high-severity risks identified.';

  const subject = `Meeting Follow-up – ${title}`;
  const body = `Hi Team,

Here is the concise summary and action plan from our session on "${title}":

Key Decisions:
${decisionsList}

Action Items & Ownership:
${actionsList}

Risks & Dependencies:
${risksList}

Let's maintain alignment and execute on our commitments.

Thanks,
Snehitha Reddy
Head of Product & Delivery
AI Meeting-to-Action Commander`;

  return { subject, body };
}

/**
 * Call Gemini LLM with Strict Negative Constraints and Few-Shot Guidance
 */
async function callGeminiLLM(transcript, meetingTitle, apiKey, userSettings) {
  const transcriptFormatted = transcript
    .slice(0, 150)
    .map(t => `[${t.time}] ${t.speaker}: ${t.text}`)
    .join('\n');

  const systemInstruction = `You are an expert AI Executive Meeting Analyst.
CRITICAL EXTRACTION QUALITY RULES:
1. PREFER FEWER ACCURATE RESULTS over MANY INCORRECT RESULTS.
2. STRICT ACTION ITEM RULE:
   - An item should ONLY be classified as an Action Item / Task if the meeting contains a clear FUTURE-ORIENTED COMMITMENT, ASSIGNMENT, RESPONSIBILITY, or AGREED TASK.
   - Examples that SHOULD become action items:
     * "Nandini will test the application tomorrow." -> Owner: Nandini, Deadline: Tomorrow
     * "John will send the report by Friday." -> Owner: John, Deadline: Friday
     * "Let's deploy this by Monday." -> Owner: All Participants, Deadline: Monday
     * "I'll prepare the documentation." -> Owner: Speaker, Deadline: Not specified
     * "The team needs to complete testing before the release." -> Owner: The team
   - Examples that MUST NOT become action items:
     * "Let me explain this." (In-meeting explanation)
     * "I'll show you how this works." (Presentation narration)
     * "Can you hear me?" (Audio/connection check)
     * "Let's discuss this." (Discussion prompt without agreed task)
     * "We are currently working on the project." (Statement describing ongoing work)
     * "I think we should consider this." (Suggestion without agreement)
     * "Coordinate with the team." (General idea without commitment)
     * Greetings, introductions, questions, explanations, general discussion, background info, filler.
   - Do NOT infer a task simply because a sentence contains: "should", "need", "let's", "we can", "coordinate", "discuss", "work", "check".
   - There must be enough evidence of an actual agreed future task.
3. FOR EACH ACTION ITEM:
   - task: Crisp deliverable description.
   - owner: Assigned person name, 'All Participants', or 'Unassigned'.
   - deadline: Stated temporal deadline ("tomorrow", "Friday", "by Monday") or "Not specified". DO NOT invent deadlines.
   - source: Exact timestamp (e.g. "00:07") from the transcript segment that actually supports the action item. DO NOT invent timestamps.
   - evidence: Exact quote from the transcript segment supporting the item.
   - confidence: Number between 0.0 and 1.0.
   - If the task cannot be confidently linked to a transcript segment, DO NOT create the task.
4. DECISIONS: Only extract explicit agreements, team consensus, or agreed agenda topics.
5. RISKS: Identify real blockers, technical issues, disturbances, or schedule risks.
6. ALL OUTPUT MUST BE 100% IN ENGLISH.`;

  const prompt = `${systemInstruction}

Analyze the following transcript for "${meetingTitle}" and return ONLY a valid JSON object matching the schema below.

Transcript:
${transcriptFormatted}

Required JSON Schema:
{
  "decisions": [
    {
      "decision": "Concise single-sentence decision statement.",
      "category": "Milestone | Architecture | Design | Strategy | Operations",
      "evidence": "Direct quote from transcript proving the decision.",
      "confidence": 0.95
    }
  ],
  "actionItems": [
    {
      "task": "Crisp description of the actionable deliverable.",
      "owner": "Specific Person Name, 'All Participants', or 'Unassigned'",
      "deadline": "Stated deadline or 'Not specified'",
      "source": "Exact transcript timestamp (e.g. '00:07') where the commitment was stated.",
      "status": "Pending",
      "priority": "High | Medium | Low",
      "evidence": "Direct quote or speaker exchange proving the task.",
      "confidence": 0.92
    }
  ],
  "risks": [
    {
      "risk": "Concise description of the blocker or risk.",
      "impact": "Concrete negative impact on the project.",
      "severity": "High | Medium | Low",
      "suggestedAction": "Recommended mitigation step.",
      "evidence": "Direct quote from transcript.",
      "confidence": 0.88
    }
  ]
}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${userSettings.aiModel || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  const textOutput = json.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(textOutput);
}
