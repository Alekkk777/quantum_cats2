import { Fragment } from 'react';
import { documentNodes } from '../../data/documentContent';
import { renderInline } from './inline';
import { BeforeReadingBlock } from '../blocks/BeforeReadingBlock';
import { ConceptLinkBlock } from '../blocks/ConceptLinkBlock';
import { FormulaAnchorBlock } from '../blocks/FormulaAnchorBlock';
import { CheckpointSlot } from '../blocks/CheckpointSlot';
import { TextAnchorNote } from '../blocks/TextAnchorNote';
import { ConceptLinkNote } from '../blocks/ConceptLinkNote';
import type { StudySession, TextAnchor, ConceptLink } from '../../types';
import type { SessionAction } from '../../lib/sessionReducer';

interface StudyDocumentProps {
  session: StudySession;
  dispatch: (a: SessionAction) => void;
  onSubmitAnswer: (checkpointId: string) => void;
  onApplyRevision: (checkpointId: string) => void;
  textAnchors?: TextAnchor[];
  conceptLinks?: ConceptLink[];
}

export function StudyDocument(props: StudyDocumentProps) {
  const { textAnchors = [], conceptLinks = [] } = props;

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
            const focused = node.sectionId === '2.3' && props.session.checkpoints['bell-inequality']?.phase === 'open';
            const anchors = textAnchors.filter((a) => a.anchor_id === node.sectionId);
            const links = conceptLinks.filter((l) => l.anchor_id === node.sectionId);

            return (
              <Fragment key={i}>
                <p
                  className={focused ? 'rounded transition-colors' : ''}
                  style={
                    focused
                      ? { background: 'linear-gradient(90deg, oklch(0.96 0.025 280 / 0.7), oklch(0.96 0.025 280 / 0))' }
                      : undefined
                  }
                >
                  {renderInline(node.text)}
                </p>
                {anchors.map((a) => <TextAnchorNote key={a.id} anchor={a} />)}
                {links.map((l) => <ConceptLinkNote key={l.id} link={l} />)}
              </Fragment>
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
