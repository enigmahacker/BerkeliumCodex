# Berkelium Provider Guide — Building Custom Model Adapters

Berkelium Codex is architected for strict **provider neutrality**. The runtime makes zero assumptions about proprietary API surfaces, response envelopes, or vendor headers.

This guide explains how to implement and register a new local or cloud AI model provider adapter.

---

## 1. The `Provider` Interface

All model adapters must implement the `Provider` contract defined in `@berkelium/providers`:

```typescript
import {
  Provider,
  ProviderCapabilities,
  Message,
  ProviderRequestOptions,
  NormalizedChunk,
  NormalizedResponse,
} from '@berkelium/providers';

export interface Provider {
  readonly id: string;
  readonly name: string;

  capabilities(): ProviderCapabilities;
  isAvailable(): Promise<boolean>;
  listModels(): Promise<Array<{ id: string; name: string; contextWindow: number }>>;
  stream(messages: Message[], options: ProviderRequestOptions): AsyncIterable<NormalizedChunk>;
  generate(messages: Message[], options: ProviderRequestOptions): Promise<NormalizedResponse>;
}
```

---

## 2. Implementing a Provider Adapter

Create `packages/providers/src/adapters/custom-provider.ts`:

```typescript
import {
  Provider,
  ProviderCapabilities,
  Message,
  ProviderRequestOptions,
  NormalizedChunk,
  NormalizedResponse,
  ResponseNormalizer,
} from '../types.js';

export class CustomProvider implements Provider {
  public readonly id = 'custom';
  public readonly name = 'Custom Inference Provider';

  public capabilities(): ProviderCapabilities {
    return {
      streaming: true,
      tool_calling: true,
      vision: false,
      reasoning: true,
      structured_output: true,
      embeddings: false,
      model_discovery: true,
    };
  }

  public async isAvailable(): Promise<boolean> {
    return Boolean(process.env.CUSTOM_API_KEY);
  }

  public async listModels() {
    return [
      { id: 'custom-coder-32b', name: 'Custom Coder 32B', contextWindow: 65536 },
    ];
  }

  public async *stream(messages: Message[], options: ProviderRequestOptions): AsyncIterable<NormalizedChunk> {
    // 1. Convert messages to target API format
    // 2. Fetch stream from remote API
    // 3. Yield normalized chunks
    yield { type: 'token', text: '...' };
  }

  public async generate(messages: Message[], options: ProviderRequestOptions): Promise<NormalizedResponse> {
    const acc = ResponseNormalizer.createAccumulator(options.model, this.id);
    for await (const chunk of this.stream(messages, options)) {
      acc.processChunk(chunk);
    }
    return acc.toNormalizedResponse();
  }
}
```

---

## 3. Registering in `ProviderRouter`

Add the adapter to `packages/providers/src/router.ts`:

```typescript
import { CustomProvider } from './adapters/custom-provider.js';

// In ProviderRouter initialization:
this.registerProvider(new CustomProvider());
```

---

## 4. Unit Testing Your Adapter

Add a test suite in `tests/unit/custom-provider.test.ts` mocking the network layer and verifying:
- Correct chunk yielding during streaming.
- Tool call parsing and argument normalization.
- Offline graceful fallback.
