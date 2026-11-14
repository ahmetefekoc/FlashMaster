import { parseClozeText } from '../utils/studyModes';

interface ClozeTextProps {
  text: string;
  revealed: boolean;
}

export function ClozeText({ text, revealed }: ClozeTextProps) {
  const segments = parseClozeText(text);

  return (
    <span>
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          return <span key={idx}>{seg.content}</span>;
        }
        if (revealed) {
          return (
            <mark
              key={idx}
              className="px-1.5 py-0.5 mx-0.5 rounded bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-100 font-semibold not-italic"
            >
              {seg.content}
            </mark>
          );
        }
        return (
          <span
            key={idx}
            className="inline-block min-w-16 px-2 py-0.5 mx-1 border-b-2 border-blue-600 dark:border-blue-400 text-blue-700 dark:text-blue-300 font-mono-tabular text-center"
            aria-label="Gizli kelime"
          >
            [ ... ]
          </span>
        );
      })}
    </span>
  );
}
