# Berkelium Skills Guide

Berkelium Codex supports modular, on-demand skill packages located in:

```
.berkelium/skills/<skill-name>/
└── SKILL.md
```

---

## 1. What is a Skill?

A **Skill** is an on-demand instruction set and tool bundle that equips the agent with domain-specific knowledge, conventions, and procedures.

Unlike monolithic prompts, skills are loaded progressively into context only when triggered by relevant user goals or file types.

---

## 2. Anatomy of a `SKILL.md`

Every skill directory must contain a `SKILL.md` with YAML frontmatter:

```markdown
---
name: react-native-performance
description: Optimization patterns and memory management for React Native apps
tools:
  - read_file
  - edit_file
  - diagnostics
permission_level: auto
triggers:
  - "**/*.tsx"
  - "react-native"
---

# React Native Performance Guidelines

When diagnosing frame drops or high memory usage in React Native:

1. **Avoid Unnecessary Re-renders**:
   - Wrap complex components with `React.memo()`.
   - Use `useCallback` for event handlers passed to child lists.

2. **List Optimization**:
   - Use `FlashList` from Shopify over standard `FlatList` for long collections.
   - Specify `estimatedItemSize`.
```

---

## 3. Creating and Registering Custom Skills

1. Create directory:
   ```bash
   mkdir -p .berkelium/skills/my-workflow
   ```
2. Create `.berkelium/skills/my-workflow/SKILL.md` following the template above.
3. Start Berkelium:
   ```bash
   bk
   ```
4. The skill is automatically indexed by the `PluginManager` and incorporated into prompt layers when triggered.
