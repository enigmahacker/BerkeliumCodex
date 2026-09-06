/**
 * @berkelium/runtime — Core Type Definitions
 *
 * The runtime abstraction layer provides a unified interface for local model
 * management and inference. Every runtime adapter (MLX, GGUF, CPU) implements
 * the RuntimeAdapter interface, enabling the model router to treat all
 * inference backends identically.
 *
 * This is the key architectural boundary that makes Berkelium provider-neutral
 * at the inference layer, not just the cloud API layer.
 */
export {};
//# sourceMappingURL=types.js.map