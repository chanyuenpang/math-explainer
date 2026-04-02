import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexProps {
  content: string;
  displayMode?: boolean;
}

export function Latex({ content, displayMode = false }: LatexProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(content, containerRef.current, {
          displayMode,
          throwOnError: false,
          trust: true,
        });
      } catch (e) {
        containerRef.current.textContent = content;
      }
    }
  }, [content, displayMode]);

  return <span ref={containerRef} />;
}
