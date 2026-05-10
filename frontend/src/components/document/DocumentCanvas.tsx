import { forwardRef, type ReactNode } from 'react';

export const DocumentCanvas = forwardRef<HTMLDivElement, { children: ReactNode }>(function DocumentCanvas({ children }, ref) {
  return (
    <div ref={ref} className="h-[calc(100vh-52px)] overflow-y-auto scroll-smooth" data-screen-label="Document pane">
      <article className="doc-body max-w-[720px] mx-auto px-8 pt-14 pb-56">
        {children}
      </article>
    </div>
  );
});
