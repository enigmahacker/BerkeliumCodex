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
                  (15-State Finite State Machine)
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

The core `AgentRuntime` operates as a 15-state deterministic state machine:

1. `IDLE`: Awaiting user input or command.
2. `THINKING`: Processing user intent and initializing context.
3. `RESPONDING`: Producing a conversational answer without tool execution.
4. `PLANNING`: Constructing step-by-step goal decomposition.
5. `WAITING_FOR_MODEL`: Streaming completion or tool calls from the active provider.
6. `WAITING_FOR_PERMISSION`: Pausing for user confirmation on medium/high risk actions.
7. `EXECUTING`: Running an authorized non-tool action.
8. `EXECUTING_TOOL`: Running authorized tool executions in the orchestrator pipeline.
9. `VERIFYING`: Validating changes against build, test, lint, and diff criteria.
10. `REMEDIATING`: Attempting an automated repair after a failed verification.
11. `COMPACTING_CONTEXT`: Condensing conversation history when approaching token limits.
12. `RUNNING_SUBAGENT`: Delegating specialized tasks to child subagents (Explorer, Tester, etc.).
13. `COMPLETED`: Successfully finalized autonomous task.
14. `FAILED`: Unrecoverable failure or exceeded retry limits.
15. `CANCELLED`: Interrupted via user `Ctrl+C`.

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
