export interface SymbolDefinition {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'export';
  line: number;
}

export interface FileMetadata {
  path: string;
  size: number;
  tokens: number;
  symbols: SymbolDefinition[];
  imports: string[];
  lastModified: number;
}

export interface ContextBreakdown {
  systemTokens: number;
  projectTokens: number;
  conversationTokens: number;
  toolsTokens: number;
  totalTokens: number;
  limit: number;
  remaining: number;
}

export interface RankedFile {
  path: string;
  score: number;
  reasons: string[];
  topSymbols: string[];
}
