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

export const DOCUMENT_TITLE = 'Quantum Mechanics, Ch. 2 — Bell\'s theorem';
export const DOCUMENT_SUBTITLE = 'Quantum Mechanics · Chapter 2 · 8 pages · ~15 min read';

export const documentNodes: DocNode[] = [
  { kind: 'h1', text: '2 — Quantum Entanglement and Bell\'s Theorem' },
  { kind: 'sub', text: DOCUMENT_SUBTITLE },
  { kind: 'block-before-reading' },

  { kind: 'p', sectionId: '2.0',
    text: 'Quantum entanglement is one of the most counterintuitive features of modern physics. When two particles are entangled, measurements on one appear to be *instantly correlated* with measurements on the other — regardless of the distance between them. Einstein called this "spooky action at a distance" and suspected it revealed an *incompleteness* in quantum mechanics, not a genuine feature of nature. What followed was one of the most important debates in the history of science.' },

  { kind: 'h2', num: '2.1', sectionId: '2.1', text: 'The three fundamental assumptions' },
  { kind: 'p', sectionId: '2.1',
    text: 'Three assumptions underlie our classical picture of the world. **Locality**: an action on particle A cannot instantaneously influence particle B at a distant location — information cannot travel faster than light. **Realism**: physical properties exist and have definite values before — and independent of — any measurement; particles carry their outcomes like hidden instructions. **Freedom** (also called *statistical independence*): experimenters can choose their measurement settings freely, independent of any hidden variables in the system. Bell\'s theorem is a precise statement about what happens when you take all three seriously at once.' },

  { kind: 'block-concept-link', from: '§1.3',
    text: 'You saw **superposition** in the previous chapter as a single particle existing in multiple states simultaneously. Entanglement extends this: two particles can share a *joint* superposition across space, so that measuring one collapses both — even when separated by kilometers.' },

  { kind: 'h2', num: '2.2', sectionId: '2.2', text: 'The EPR argument and hidden variables' },
  { kind: 'p', sectionId: '2.2',
    text: 'Einstein, Podolsky, and Rosen argued in 1935 that if locality holds — if measuring particle A truly cannot affect particle B — then the outcome of measuring B must have been *predetermined*. Predetermination requires hidden variables: extra information carried by the particles, invisible to quantum mechanics, that fix their outcomes before any measurement takes place. For EPR, the strange correlations were just classical correlations in disguise, and quantum mechanics was simply incomplete.' },

  { kind: 'h2', num: '2.3', sectionId: '2.3', text: 'Bell\'s inequality and its experimental violation' },
  { kind: 'p', sectionId: '2.3',
    text: 'John Bell showed in 1964 that the combination of locality **and** realism places a precise mathematical upper bound on how strongly correlated measurement outcomes can be. This bound — Bell\'s inequality — is a provable consequence of assuming both. Crucially, quantum mechanics predicts correlations that *exceed* this limit. Experiments from Aspect (1982) to the loophole-free tests of 2015 have confirmed the violation beyond any reasonable doubt. The data forces a stark conclusion: at least one of the three assumptions — locality, realism, or freedom — must be false.' },

  { kind: 'block-formula-anchor',
    formula: 'locality ∧ realism  ⇒  |⟨AB⟩ + ⟨Ab⟩ + ⟨aB⟩ − ⟨ab⟩| ≤ 2',
    explanation: 'The CHSH form of Bell\'s inequality: if both locality and realism hold, the correlation measure on the left cannot exceed 2. Quantum mechanics allows values up to 2√2 ≈ 2.83. Experiments consistently reach ~2.7 — well above the classical bound.' },

  { kind: 'checkpoint-slot', checkpointId: 'bell-inequality' },

  { kind: 'h2', num: '2.4', sectionId: '2.4', text: 'What the violation means' },
  { kind: 'p', sectionId: '2.4',
    text: 'Most physicists accept that **realism must be abandoned**: quantum particles do not carry definite properties before measurement — measuring particle B does not reveal a pre-existing value, it creates one. A minority prefer abandoning **locality** instead, accepting hidden non-local influences that are undetectable from the outside. A small group invoke **superdeterminism**: abandoning freedom, claiming the experimenters\' choices are themselves correlated with the hidden variables through some past common cause. Each choice has profound consequences for what we believe physics is about.' },
];

export const QUANTUM_CHECKPOINT_QUESTION =
  'If locality were confirmed experimentally, which of the three fundamental assumptions from §2.1 would have to be abandoned to account for quantum entanglement?';

export const QUANTUM_CHECKPOINT_CONTEXT = `§2.1 Three fundamental assumptions. Locality: action on A cannot instantaneously affect B. Realism: properties exist as definite values before measurement (hidden variables). Freedom: measurement settings are independent of hidden variables. §2.3 Bell's theorem: locality AND realism together imply Bell's inequality must hold. Experiments violate this bound. Therefore at least one assumption must be false. §2.4 Most physicists: realism must be abandoned — particles have no definite properties before measurement. Locality is maintained in the standard view.`;
