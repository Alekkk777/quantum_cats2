import type { Mutazione } from '../lib/api';
import { ClozeWord } from './mutations/ClozeWord';
import { InsightBlock } from './mutations/InsightBlock';
import { ChallengeBlock } from './mutations/ChallengeBlock';

interface LiveDocumentProps {
  sectionId: string;
  testo: string;
  mutazioni: Mutazione[];
  onInteraction: (concetto: string, esito: 'superato' | 'fallito') => void;
}

export function LiveDocument({ sectionId, testo, mutazioni, onInteraction }: LiveDocumentProps) {
  const paragraphs = testo.split(/\n\n+/).filter(p => p.trim());

  return (
    <article className="doc-prose max-w-[740px] mx-auto px-8 py-10">
      <div className="label-mono text-indigo mb-6">{sectionId.replace('_', ' ').toUpperCase()}</div>
      {paragraphs.map((para, i) => (
        <AnnotatedParagraph
          key={i}
          text={para}
          mutazioni={mutazioni}
          onInteraction={onInteraction}
        />
      ))}
    </article>
  );
}

function AnnotatedParagraph({
  text,
  mutazioni,
  onInteraction,
}: {
  text: string;
  mutazioni: Mutazione[];
  onInteraction: (concetto: string, esito: 'superato' | 'fallito') => void;
}) {
  // Heading detection
  if (text.startsWith('## ') || text.startsWith('### ')) {
    return <h2>{text.replace(/^#{2,3} /, '')}</h2>;
  }
  if (text.startsWith('# ')) {
    return <h1>{text.replace(/^# /, '')}</h1>;
  }

  // Check for domanda_inline that matches this paragraph
  const challengeMut = mutazioni.find(
    m => m.tipo_ui === 'domanda_inline' && text.includes(m.target)
  );

  // Collect inline mutations (cloze, insight, confronto) for this paragraph
  const inlineMuts = mutazioni.filter(
    m => (m.tipo_ui === 'cloze' || m.tipo_ui === 'insight' || m.tipo_ui === 'confronto') &&
         text.includes(m.target)
  );

  return (
    <>
      <p>
        <AnnotatedText text={text} mutations={inlineMuts} onInteraction={onInteraction} />
      </p>
      {challengeMut && (
        <ChallengeBlock
          mutazione={challengeMut}
          onAnswer={esito => onInteraction(challengeMut.target, esito)}
        />
      )}
    </>
  );
}

function AnnotatedText({
  text,
  mutations,
  onInteraction,
}: {
  text: string;
  mutations: Mutazione[];
  onInteraction: (concetto: string, esito: 'superato' | 'fallito') => void;
}): React.ReactNode {
  if (mutations.length === 0) return renderMarkdown(text);

  const mut = mutations[0];
  const idx = text.indexOf(mut.target);
  if (idx === -1) {
    return <AnnotatedText text={text} mutations={mutations.slice(1)} onInteraction={onInteraction} />;
  }

  const before = text.slice(0, idx);
  const after = text.slice(idx + mut.target.length);

  return (
    <>
      {renderMarkdown(before)}
      {mut.tipo_ui === 'cloze' ? (
        <ClozeWord
          target={mut.target}
          contenuto={mut.contenuto}
          onAnswer={esito => onInteraction(mut.target, esito)}
        />
      ) : (
        <InsightBlock
          target={mut.target}
          contenuto={mut.contenuto}
          tipo={mut.tipo_ui as 'insight' | 'confronto'}
        />
      )}
      <AnnotatedText text={after} mutations={mutations.slice(1)} onInteraction={onInteraction} />
    </>
  );
}

function renderMarkdown(text: string): React.ReactNode {
  // Basic markdown: **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
