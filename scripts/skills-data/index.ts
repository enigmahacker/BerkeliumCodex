import { SkillDefinition } from './types.js';
import { coreSkills } from './core.js';
import { filesystemSkills } from './filesystem.js';
import { terminalSkills } from './terminal.js';
import { codeSkills } from './code.js';
import { gitSkills } from './git.js';
import { githubSkills } from './github.js';
import { testingSkills } from './testing.js';
import { buildSkills } from './build.js';
import { webSkills } from './web.js';
import { networkSkills } from './network.js';
import { dataSkills } from './data.js';
import { securitySkills } from './security.js';
import { agentsSkills } from './agents.js';
import { browserSkills } from './browser.js';
import { languagesSkills } from './languages.js';
import { frameworksSkills } from './frameworks.js';
import { aiSkills } from './ai.js';
import { infrastructureSkills } from './infrastructure.js';
import { projectSkills } from './project.js';

export * from './types.js';
export {
  coreSkills,
  filesystemSkills,
  terminalSkills,
  codeSkills,
  gitSkills,
  githubSkills,
  testingSkills,
  buildSkills,
  webSkills,
  networkSkills,
  dataSkills,
  securitySkills,
  agentsSkills,
  browserSkills,
  languagesSkills,
  frameworksSkills,
  aiSkills,
  infrastructureSkills,
  projectSkills,
};

export const allSkills: SkillDefinition[] = [
  ...coreSkills,
  ...filesystemSkills,
  ...terminalSkills,
  ...codeSkills,
  ...gitSkills,
  ...githubSkills,
  ...testingSkills,
  ...buildSkills,
  ...webSkills,
  ...networkSkills,
  ...dataSkills,
  ...securitySkills,
  ...agentsSkills,
  ...browserSkills,
  ...languagesSkills,
  ...frameworksSkills,
  ...aiSkills,
  ...infrastructureSkills,
  ...projectSkills,
];
