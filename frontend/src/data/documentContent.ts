/**
 * The study document is modelled as an ordered array of nodes. Block nodes
 * (checkpoints, concept links, etc.) are inserted into the same stream as
 * paragraphs and headings so the document layer renders one column.
 */
export type DocNode =
  | { kind: 'h1'; text: string }
  | { kind: 'sub'; text: string }
  | { kind: 'h2'; num: string; text: string; sectionId: string }
  | { kind: 'p'; sectionId: string; text: string }
  | { kind: 'block-before-reading' }
  | { kind: 'block-concept-link'; from: string; text: string }
  | { kind: 'block-formula-anchor'; formula: string; explanation: string }
  | { kind: 'checkpoint-slot'; checkpointId: string };

export const DOCUMENT_TITLE = 'Agent Architectures, Ch. 4 — Trust tiers';
export const DOCUMENT_SUBTITLE = 'Agent Architectures · Chapter 4 · 12 pages · ~22 min read';

export const documentNodes: DocNode[] = [
  { kind: 'h1', text: '4 — Trust tiers in agent architectures' },
  { kind: 'sub', text: DOCUMENT_SUBTITLE },
  { kind: 'block-before-reading' },

  { kind: 'p', sectionId: '4.0',
    text: 'Modern agent systems are not single models — they are pipelines of tiers, each with a different relationship to *trust*. The fundamental design move in this chapter is to split capabilities across tiers so that no single component both **reads untrusted input** and **holds privileged tools**. This is the agent-architecture analogue of the principle of least authority.' },

  { kind: 'h2', num: '4.1', sectionId: '4.1', text: 'The three tiers' },
  { kind: 'p', sectionId: '4.1',
    text: 'We will work with three tiers throughout: the **Reader**, the **Planner**, and the **Resolver**. Their job descriptions are short. The **Reader** ingests untrusted documents — PDFs, scraped pages, user uploads — and produces a structured representation. The **Planner** consumes the Reader\u2019s structured output and decides what to do, but never the raw bytes. The **Resolver** executes the plan and writes the final, user-visible response.' },

  { kind: 'block-concept-link', from: '§3.2',
    text: 'You saw **trust boundary** in the previous chapter as the line where untrusted input meets privileged action. The same line reappears below — only the actors have names now (*Reader*, *Resolver*) and the action is an *MCP tool call*.' },

  { kind: 'h2', num: '4.2', sectionId: '4.2', text: 'Reader tier and MCP access' },
  { kind: 'p', sectionId: '4.2',
    text: 'The Reader is intentionally denied `MCP` tool access. This is a hard policy, not a default — the Reader\u2019s runtime cannot resolve a tool name to a callable. The reason is mechanical, not aesthetic: the Reader is the one tier whose input is fully *untrusted*. Any document it reads may contain prompt-injection payloads aimed at the model. If that same model could also call MCP tools, an injected instruction could become an external action — a request to a database, a webhook, an outbound email.' },
  { kind: 'p', sectionId: '4.2',
    text: 'The Resolver, by contrast, holds tool access. It does not see untrusted bytes; it sees a structured plan that has already passed through the Planner\u2019s typed interface. The trust boundary is therefore *between* the Reader and the Planner, and the architecture enforces it by splitting capabilities, not by asking the model to behave.' },

  { kind: 'block-formula-anchor',
    formula: 'untrusted_input(tier) ∧ mcp_access(tier) ⇒ exfiltration_risk',
    explanation: 'A tier that consumes untrusted input *and* can call MCP tools is, by construction, an exfiltration channel. The architecture below denies one of the two for each tier.' },

  { kind: 'checkpoint-slot', checkpointId: 'reader-mcp' },

  { kind: 'h2', num: '4.3', sectionId: '4.3', text: 'Why splitting beats hardening' },
  { kind: 'p', sectionId: '4.3',
    text: 'It is tempting to keep one model and try to *harden* it against prompt injection — system prompts, refusal training, classifier guards. These help at the margin, but they all share a structural weakness: they ask the model to remain reliable under adversarial input. Splitting the architecture removes the question. The Reader cannot exfiltrate because it cannot call. The Resolver cannot be injected because it never sees untrusted bytes.' },

  { kind: 'h2', num: '4.4', sectionId: '4.4', text: 'Where outputs come from' },
  { kind: 'p', sectionId: '4.4',
    text: 'A subtle implication: the user-visible answer is always written by the Resolver. The Reader\u2019s outputs are internal — typed structures consumed by the Planner. If you ever find yourself writing a system where the Reader emits text directly to the user, you have collapsed the trust boundary back to one tier and lost the property the architecture was designed to give you.' },
];

export const READER_MCP_QUESTION =
  'Why is the Reader tier restricted from accessing MCP tools when handling untrusted documents?';

export const READER_MCP_CONTEXT = `§4.2 Reader tier and MCP access. The Reader is intentionally denied MCP tool access. This is a hard policy, not a default. The Reader is the one tier whose input is fully untrusted. The Resolver writes final outputs; the Reader does not. §4.4 the user-visible answer is always written by the Resolver.`;
