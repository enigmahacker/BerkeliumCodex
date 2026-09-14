export type SkillRisk = 'safe' | 'low' | 'medium' | 'high' | 'destructive';

export interface SkillDefinition {
  name: string;
  version: string;
  description: string;
  category: string;
  dir: string;
  risk: SkillRisk;
  requires_permission: boolean;
  required_tools: string[];
  optional_tools: string[];
  fallbacks: string;
  title: string;
  purpose: string;
  when_to_activate: string;
  inputs: string;
  preconditions: string;
  procedure: string;
  tool_usage: string;
  safety: string;
  permissions: string;
  verification: string;
  failure_handling: string;
  output_contract: string;
  examples: string;
  related_skills: string[];
}
