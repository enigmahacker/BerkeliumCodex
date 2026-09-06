import { EventBus } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import { ConfigManager } from '@berkelium/config';
import { ThemeManager } from '@berkelium/themes';
import { AuthStore } from '@berkelium/auth';
import { PermissionEngine, SecretRedactor } from '@berkelium/permissions';
import {
  ProviderRouter,
  NVIDIAProvider,
  OpenRouterProvider,
  GeminiProvider,
  HuggingFaceProvider,
  GroqProvider,
  OllamaProvider,
  LMStudioProvider,
} from '@berkelium/providers';
import { ToolRegistry, ToolOrchestrator } from '@berkelium/tools';
import { ContextEngine } from '@berkelium/context';
import { PluginManager } from '@berkelium/plugins';
import { AgentRuntime, SessionManager } from '@berkelium/agent';

import { LaunchAnimation } from './tui/animation.js';
import { TUIRenderer } from './tui/renderer.js';
import { InteractiveSession } from './tui/interactive-session.js';
import { BkMatrix } from './tui/bk-matrix.js';
import { DoctorCommand } from './commands/doctor.js';
import { InitCommand } from './commands/init.js';
import { AuthCommand } from './commands/auth.js';
import { ModelsCommand } from './commands/models.js';
import { ListCommand } from './commands/list.js';
import { PullCommand } from './commands/pull.js';
import { ShowCommand } from './commands/show.js';
import { RmCommand } from './commands/rm.js';
import { PsCommand } from './commands/ps.js';
import { RuntimeCommand } from './commands/runtime.js';
import { CloudCommand } from './commands/cloud.js';
import { ModeCommand } from './commands/mode.js';
import { PrivacyCommand } from './commands/privacy.js';
import { ModelSubcommand } from './commands/model-cmd.js';
import { StatusCommand } from './commands/status.js';
import { GitCommand } from './commands/git-cmd.js';
import { SessionCommand } from './commands/session-cmd.js';
import { MapCommand } from './commands/map-cmd.js';
import { SearchCommand } from './commands/search-cmd.js';
import { InspectCommand } from './commands/inspect-cmd.js';
import { AccessibilityCommand } from './commands/accessibility-cmd.js';
import { ConfigCommand } from './commands/config-cmd.js';

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const logger = new Logger({ subsystem: 'berkelium' });
  const eventBus = new EventBus();
  const configManager = new ConfigManager();
  const authStore = new AuthStore();
  const themeManager = new ThemeManager(configManager.getConfig().theme.name);
  const renderer = new TUIRenderer(themeManager);

  // Initialize Provider Router & all standard adapters
  const router = new ProviderRouter(configManager.getConfig(), logger);
  router.registerProvider(new OpenRouterProvider(authStore, configManager.getConfig().providers.openrouter.base_url));
  router.registerProvider(new NVIDIAProvider(authStore, configManager.getConfig().providers.nvidia.base_url));
  router.registerProvider(new GeminiProvider(authStore, configManager.getConfig().providers.gemini?.base_url));
  router.registerProvider(new HuggingFaceProvider(authStore, configManager.getConfig().providers.huggingface?.base_url));
  router.registerProvider(new GroqProvider(authStore, configManager.getConfig().providers.groq?.base_url));
  router.registerProvider(new OllamaProvider(configManager.getConfig().providers.ollama.base_url));
  router.registerProvider(new LMStudioProvider(configManager.getConfig().providers.lmstudio.base_url));


  // Initialize Permission Engine & Redactor
  const permissionEngine = new PermissionEngine(
    configManager.getWorkspaceRoot(),
    configManager.getConfig().permissions,
    eventBus
  );
  const secretRedactor = new SecretRedactor();

  // Initialize Tool Registry & Orchestrator
  const toolRegistry = new ToolRegistry();
  const orchestrator = new ToolOrchestrator(
    toolRegistry,
    permissionEngine,
    secretRedactor,
    logger,
    configManager.getWorkspaceRoot(),
    eventBus
  );

  // Initialize Context Engine
  const contextEngine = new ContextEngine(configManager.getWorkspaceRoot(), logger);

  // Initialize Plugin Manager
  const pluginManager = new PluginManager(logger);

  // Initialize Session Manager
  const sessionManager = new SessionManager();

  // Parse CLI flags
  let noAnimation = false;
  let hackathonMode = false;
  let matrixMode = configManager.getConfig().ui.launch_matrix ?? true;
  let customTheme: string | undefined;
  let customModel: string | undefined;
  let customProvider: string | undefined;

  const positionalArgs: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--version' || arg === '-v') {
      console.log('Berkelium CLI v1.0.0 (darwin-arm64 native)');
      return;
    }

    if (arg === '--plain') {
      customTheme = 'plain';
      noAnimation = true;
      matrixMode = false;
    } else if (arg === '--no-animation') {
      noAnimation = true;
    } else if (arg === '--no-matrix') {
      matrixMode = false;
    } else if (arg === '--matrix' || arg === '-m') {
      matrixMode = true;
    } else if (arg === '--hackathon') {
      hackathonMode = true;
    } else if ((arg === '--theme' || arg === '-t') && i + 1 < argv.length) {
      customTheme = argv[++i];
    } else if (arg === '--model' && i + 1 < argv.length) {
      customModel = argv[++i];
    } else if (arg === '--provider' && i + 1 < argv.length) {
      customProvider = argv[++i];
    } else if (arg.startsWith('-')) {
      // Ignore other flags or store
    } else {
      positionalArgs.push(arg);
    }
  }

  // Apply theme override if given
  if (customTheme) {
    themeManager.setTheme(customTheme);
  }

  const firstArg = positionalArgs[0];

  // Subcommands
  if (firstArg === 'doctor') {
    const isJson = argv.includes('--json');
    await DoctorCommand.run(themeManager, authStore, router, isJson);
    return;
  }

  if (firstArg === 'init') {
    await InitCommand.run(themeManager, configManager.getWorkspaceRoot());
    return;
  }

  if (firstArg === 'auth') {
    await AuthCommand.run(
      themeManager,
      authStore,
      positionalArgs[1],
      positionalArgs[2],
      positionalArgs[3]
    );
    return;
  }

  if (firstArg === 'models' || firstArg === 'providers') {
    await ModelsCommand.run(themeManager, configManager, router);
    return;
  }

  if (firstArg === 'list') {
    await ListCommand.run(themeManager);
    return;
  }

  if (firstArg === 'pull') {
    await PullCommand.run(themeManager, positionalArgs[1]);
    return;
  }

  if (firstArg === 'show') {
    await ShowCommand.run(themeManager, positionalArgs[1]);
    return;
  }

  if (firstArg === 'rm') {
    await RmCommand.run(themeManager, positionalArgs[1]);
    return;
  }

  if (firstArg === 'ps') {
    await PsCommand.run(themeManager);
    return;
  }

  if (firstArg === 'runtime') {
    await RuntimeCommand.run(themeManager, positionalArgs[1]);
    return;
  }

  if (firstArg === 'cloud') {
    await CloudCommand.run(
      themeManager,
      configManager,
      authStore,
      router,
      positionalArgs[1],
      positionalArgs[2],
      positionalArgs[3]
    );
    return;
  }

  if (firstArg === 'mode') {
    await ModeCommand.run(themeManager, configManager, positionalArgs[1]);
    return;
  }

  if (firstArg === 'privacy') {
    await PrivacyCommand.run(themeManager, configManager, positionalArgs[1]);
    return;
  }

  if (firstArg === 'model') {
    await ModelSubcommand.run(
      themeManager,
      configManager,
      router,
      positionalArgs[1],
      positionalArgs[2]
    );
    return;
  }

  if (firstArg === 'status') {
    const isJson = argv.includes('--json');
    await StatusCommand.run(themeManager, configManager, router, isJson);
    return;
  }

  if (firstArg === 'matrix') {
    await BkMatrix.playMatrixRain(themeManager, { durationMs: 2000 });
    return;
  }

  if (firstArg === 'codex' || firstArg === 'bk') {
    BkMatrix.renderCodexEmblem(themeManager);
    return;
  }

  if (firstArg === 'git') {
    await GitCommand.run(
      themeManager,
      positionalArgs[1],
      positionalArgs.slice(2),
      configManager.getWorkspaceRoot()
    );
    return;
  }

  if (firstArg === 'session') {
    await SessionCommand.run(
      themeManager,
      configManager,
      positionalArgs[1],
      positionalArgs[2],
      sessionManager
    );
    return;
  }

  if (firstArg === 'map') {
    await MapCommand.run(themeManager, configManager.getWorkspaceRoot());
    return;
  }

  if (firstArg === 'search') {
    await SearchCommand.run(themeManager, positionalArgs[1], configManager.getWorkspaceRoot());
    return;
  }

  if (firstArg === 'inspect') {
    await InspectCommand.run(themeManager, positionalArgs[1], configManager.getWorkspaceRoot());
    return;
  }

  if (firstArg === 'accessibility') {
    await AccessibilityCommand.run(themeManager, configManager, positionalArgs[1]);
    return;
  }

  if (firstArg === 'config') {
    await ConfigCommand.run(
      themeManager,
      configManager,
      positionalArgs[1],
      positionalArgs[2],
      positionalArgs[3]
    );
    return;
  }

  // Initialize Agent Runtime
  const runtime = new AgentRuntime({
    workspaceRoot: configManager.getWorkspaceRoot(),
    configManager,
    router,
    orchestrator,
    contextEngine,
    logger,
    eventBus,
    hookManager: pluginManager.getHookManager(),
    sessionManager,
  });

  if (customModel) {
    runtime.setActiveModel(customModel);
  }

  // Direct autonomous run command: berkelium run "task"
  if (firstArg === 'run' && positionalArgs.length > 1) {
    eventBus.on('*', (e) => renderer.handleEvent(e));
    const task = positionalArgs.slice(1).join(' ');
    await runtime.executeTask(task);
    console.log();
    return;
  }

  // Resume session: berkelium resume [sessionId]
  if (firstArg === 'resume') {
    const targetSessionId = positionalArgs[1];
    const sessionData = targetSessionId
      ? await sessionManager.loadSession(targetSessionId)
      : await sessionManager.getLatestSession();

    if (!sessionData) {
      console.log(themeManager.getFormatted().error('No previous session found to resume.'));
      return;
    }

    await runtime.resumeFromSession(sessionData);
  }

  // Launch interactive TUI
  const skipAnim = noAnimation || !configManager.getConfig().ui.launch_animation;
  const activeTarget = router.resolveTarget(runtime.getActiveModel());
  await LaunchAnimation.play(themeManager, {
    skip: skipAnim,
    durationMs: configManager.getConfig().ui.launch_animation_duration_ms,
    matrix: matrixMode,
    model: runtime.getActiveModel(),
    provider: activeTarget.provider.name,
    workspace: configManager.getWorkspaceRoot(),
    toolCount: orchestrator.getRegistry().list().length,
  });

  const session = new InteractiveSession({
    runtime,
    themeManager,
    eventBus,
    configManager,
    router,
    orchestrator,
    contextEngine,
    authStore,
    hackathonMode: hackathonMode || configManager.getConfig().ui.hackathon_mode,
  });

  await session.start();
}
