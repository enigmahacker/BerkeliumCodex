# BERKELIUM ARCHITECTURE

## System Overview

Berkelium is architected around a strict separation of concerns:

```
                         BERKELIUM CLI
                              │
              ┌───────────────┴────────────────┐
              │                                │
             TUI                         CLI COMMANDS
              │                                │
              └───────────────┬────────────────┘
                              │
                         EVENT BUS
                              │
                        AGENT RUNTIME
                  (12-State Finite State Machine)
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
         CONTEXT            PLANNER          MEMORY
         ENGINE               │                 │
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
                     TOOL ORCHESTRATOR
                              │
             ┌────────────────┼────────────────┐
             │                │                │
        PERMISSIONS       TOOL REGISTRY       MCP
             │                │                │
             └────────────────┼────────────────┘
                              │
                       PROVIDER ROUTER
                              │
       ┌──────────────┬───────┼───────┬──────────────┐
       │              │       │       │              │
     NVIDIA       OpenRouter Ollama LM Studio       FUTURE
       │              │       │       │
       └──────────────┴───────┴───────┘
                              │
                    RESPONSE NORMALIZER
                              │
                       MODEL STREAM
                              │
                         EVENT BUS
                              │
                          LIVE TUI
```

## Agent State Machine

The core `AgentRuntime` operates as a 12-state deterministic state machine:

1. `IDLE`: Awaiting user input or command.
2. `THINKING`: Processing user intent and initializing context.
3. `PLANNING`: Constructing step-by-step goal decomposition.
4. `WAITING_FOR_MODEL`: Streaming completion or tool calls from the active provider.
5. `WAITING_FOR_PERMISSION`: Pausing for user confirmation on medium/high risk actions.
6. `EXECUTING_TOOL`: Running authorized tool executions in the orchestrator pipeline.
7. `COMPACTING_CONTEXT`: Condensing conversation history when approaching token limits.
8. `RUNNING_SUBAGENT`: Delegating specialized tasks to child subagents (Explorer, Tester, etc.).
9. `VERIFYING`: Validating changes against build, test, lint, and diff criteria.
10. `COMPLETED`: Successfully finalized autonomous task.
11. `FAILED`: Unrecoverable failure or exceeded retry limits.
12. `CANCELLED`: Interrupted via user `Ctrl+C`.

## Providers & Router

- Universal `Provider` contract with streaming generator support.
- Zero provider-specific APIs leak into the agent loop.
- Dynamic capability discovery (tool calling, vision, reasoning tokens, context windows).
- Model Aliasing (`coding`, `local`, `workstation`, `cloud`, `fast`, `reasoning`).
- Resilient fallback chains.

## Tool Orchestrator & Security

1. **Schema Validation**: JSON Schema / Zod verification on tool arguments.
2. **Permission Check**: Policy rules evaluated against workspace boundary and action risk.
3. **Execution Queue**: Serialized or dependency-ordered tool execution with abort signal propagation.
4. **Secret Redaction**: Automatic sanitization of keys, passwords, and tokens before emitting to UI or LLM.
