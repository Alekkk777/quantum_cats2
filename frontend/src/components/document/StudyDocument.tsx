import { documentNodes } from '../../data/documentContent';
import { renderInline } from './inline';
import { BeforeReadingBlock } from '../blocks/BeforeReadingBlock';
import { ConceptLinkBlock } from '../blocks/ConceptLinkBlock';
import { FormulaAnchorBlock } from '../blocks/FormulaAnchorBlock';
import { CheckpointSlot } from '../blocks/CheckpointSlot';
import type { StudySession } from '../../types';
import type { SessionAction } from '../../lib/sessionReducer';

interface StudyDocumentProps {
  session: StudySession;
  dispatch: (a: SessionAction) => void;
  onSubmitAnswer: (checkpointId: string) => void;
  onApplyRevision: (checkpointId: string) => void;
}

export function StudyDocument(props: StudyDocumentProps) {
  return (
    <article className="doc-prose max-w-[var(--doc-col)] mx-auto px-8 pt-14 pb-56" data-screen-label="Document">
      {documentNodes.map((node, i) => {
        switch (node.kind) {
          case 'h1':
            return <h1 key={i} className="font-serif text-[32px] font-semibold -tracking-[0.015em] leading-[1.15] mb-1.5">{node.text}</h1>;
          case 'sub':
            return <div key={i} className="font-mono text-[11px] text-ink-3 tracking-[0.06em] uppercase mb-7">{node.text}</div>;
          case 'h2':
            return <h2 key={i}><span className="num">{node.num}</span>{node.text}</h2>;
          case 'p': {
            const focused = node.sectionId === '4.2' && props.session.checkpoints['reader-mcp']?.phase === 'open';
            return (
              <p key={i} className={focused ? 'rounded transition-colors' : ''}
                 style={focused ? { background: 'linear-gradient(90deg, oklch(0.96 0.025 280 / 0.7), oklch(0.96 0.025 280 / 0))' } : undefined}>
                {renderInline(node.text)}
              </p>
            );
          }
          case 'block-before-reading': return <BeforeReadingBlock key={i} />;
          case 'block-concept-link':   return <ConceptLinkBlock key={i} from={node.from} text={node.text} />;
          case 'block-formula-anchor': return <FormulaAnchorBlock key={i} formula={node.formula} explanation={node.explanation} />;
          case 'checkpoint-slot':      return <CheckpointSlot key={i} {...props} checkpointId={node.checkpointId} />;
        }
      })}
    </article>
  );
}
