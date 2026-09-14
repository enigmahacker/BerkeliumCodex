export type UserIntent =
  | 'CHAT'
  | 'QUESTION'
  | 'RESEARCH'
  | 'CODE_TASK'
  | 'COMMAND'
  | 'DEBUG'
  | 'REVIEW';

export interface IntentClassificationResult {
  intent: UserIntent;
  confidence: number;
  reason: string;
  isActionable: boolean;
}

const CHAT_PATTERNS = [
  /^(hi|hello|hey|greetings|howdy|sup|yo)\b/i,
  /^(good\s+(morning|afternoon|evening|day|night))\b/i,
  /^(thanks|thank\s+you|thx|cheers)\b/i,
  /^(bye|goodbye|see\s+ya|cya)\b/i,
  /^(who\s+are\s+you|what\s+are\s+you|what\s+is\s+your\s+name)\b/i,
  /^(what\s+can\s+you\s+do|help|what\s+are\s+your\s+capabilities)\b/i,
  /^(ok|okay|cool|great|awesome|nice|got\s+it|understood)\b/i,
];

const QUESTION_PATTERNS = [
  /^(what\s+is|what\s+are|what\s+does)\b/i,
  /^(explain|describe|tell\s+me\s+about|clarify|elaborate\s+on)\b/i,
  /^(how\s+does|how\s+do|how\s+can|why\s+does|why\s+do|why\s+is)\b/i,
  /^(can\s+you\s+explain|could\s+you\s+explain)\b/i,
  /^(what\s+is\s+the\s+difference\s+between)\b/i,
  /\?$/i,
];

const REVIEW_PATTERNS = [
  /\b(code\s+review|review\s+(my\s+)?(code|changes|pr|diff|branch))\b/i,
  /\b(audit\s+(this|the)\s+code|security\s+review)\b/i,
  /^git\s+diff\b/i,
  /\bcheck\s+(my\s+)?(changes|diff|work)\b/i,
];

const DEBUG_PATTERNS = [
  /\b(debug|diagnose|troubleshoot|investigate\s+(the\s+)?(error|bug|issue|crash|failure))\b/i,
  /\b(fix\s+(the\s+)?(error|bug|issue|crash|failure|broken|failing))\b/i,
  /\b(stack\s*trace|typeerror|referenceerror|syntaxerror|unhandledrejection)\b/i,
  /\b(failing\s+test|tests\s+are\s+failing|test\s+failed)\b/i,
  /\bwhy\s+is\s+(this|it)\s+(failing|crashing|broken|throwing)\b/i,
];

const COMMAND_PATTERNS = [
  /^(run|execute|call)\s+(the\s+)?(command|script|binary|cli)\b/i,
  /^(npm|pnpm|yarn|bun|cargo|go|python|pytest|node|docker|kubectl|git|make|bash|sh)\s+/i,
  /^(install|add|remove|uninstall)\s+[a-z0-9@/._-]+/i,
];

const RESEARCH_PATTERNS = [
  /\b(search\s+for|find\s+where|locate|where\s+is\s+(the|a)|grep|search\s+in)\b/i,
  /\b(research|look\s+up|explore\s+the\s+codebase|find\s+references)\b/i,
];

const CODE_PATTERNS = [
  /\b(write|create|implement|add|generate|build|code|author)\s+(a\s+|an\s+|the\s+)?(function|class|method|module|file|component|endpoint|interface|type|service|feature|test)\b/i,
  /\b(refactor|rewrite|optimize|simplify|clean\s+up|reorganize)\b/i,
  /\b(modify|update|edit|change|patch|delete|remove)\s+(the\s+|this\s+)?(file|code|line|function|class)\b/i,
  /\b(create|add|write)\s+([a-z0-9_.-]+\.[a-z0-9]+)\b/i,
];

/**
 * Classifies a user's prompt into one of the 7 supported intents.
 */
export function classifyIntent(prompt: string): IntentClassificationResult {
  const trimmed = prompt.trim();

  // 1. Check for exact or high-confidence CHAT patterns
  for (const pattern of CHAT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        intent: 'CHAT',
        confidence: 0.95,
        reason: 'Matched conversational greeting or pleasantry pattern.',
        isActionable: false,
      };
    }
  }

  // 2. Check for REVIEW
  for (const pattern of REVIEW_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        intent: 'REVIEW',
        confidence: 0.9,
        reason: 'User requested code or diff review.',
        isActionable: true,
      };
    }
  }

  // 3. Check for DEBUG
  for (const pattern of DEBUG_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        intent: 'DEBUG',
        confidence: 0.9,
        reason: 'User requested debugging, diagnosing, or error fixing.',
        isActionable: true,
      };
    }
  }

  // 4. Check for COMMAND
  for (const pattern of COMMAND_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        intent: 'COMMAND',
        confidence: 0.9,
        reason: 'User requested shell or tool command execution.',
        isActionable: true,
      };
    }
  }

  // 5. Check for CODE_TASK
  for (const pattern of CODE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        intent: 'CODE_TASK',
        confidence: 0.85,
        reason: 'User requested file mutation, creation, or code implementation.',
        isActionable: true,
      };
    }
  }

  // 6. Check for RESEARCH
  for (const pattern of RESEARCH_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        intent: 'RESEARCH',
        confidence: 0.85,
        reason: 'User requested codebase search or information lookup.',
        isActionable: false,
      };
    }
  }

  // 7. Check for QUESTION
  for (const pattern of QUESTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        intent: 'QUESTION',
        confidence: 0.85,
        reason: 'User asked a conceptual or explanatory question.',
        isActionable: false,
      };
    }
  }

  // Fallback heuristic:
  // If short and looks like a general query without code verbs, default to QUESTION or CHAT
  if (trimmed.length < 30 && !trimmed.includes('.') && !trimmed.includes('/')) {
    return {
      intent: 'CHAT',
      confidence: 0.6,
      reason: 'Short input with no actionable code verbs.',
      isActionable: false,
    };
  }

  // Default to CODE_TASK for arbitrary instructions
  return {
    intent: 'CODE_TASK',
    confidence: 0.7,
    reason: 'Defaulted to actionable code task for complex instructions.',
    isActionable: true,
  };
}

export function isActionableIntent(intent: UserIntent): boolean {
  return ['CODE_TASK', 'COMMAND', 'DEBUG', 'REVIEW'].includes(intent);
}

export function isConversationalIntent(intent: UserIntent): boolean {
  return intent === 'CHAT' || intent === 'QUESTION';
}
