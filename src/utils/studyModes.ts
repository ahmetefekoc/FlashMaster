import type { Flashcard } from '../types/flashcard';

export interface ClozeSegment {
  type: 'text' | 'cloze';
  content: string;
}

const CLOZE_REGEX = /\{\{([^}]+)\}\}/g;

export function hasClozeSyntax(text: string): boolean {
  return /\{\{[^}]+\}\}/.test(text);
}

export function parseClozeText(text: string): ClozeSegment[] {
  const segments: ClozeSegment[] = [];
  let lastIndex = 0;
  const regex = new RegExp(CLOZE_REGEX.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: 'cloze',
      content: match[1].trim(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return segments;
}

export function stripClozeBraces(text: string): string {
  return text.replace(CLOZE_REGEX, (_, inner: string) => inner.trim());
}

/**
 * Extracts the canonical expected answer for Typing / Quiz modes.
 * If the front contains {{cloze}} syntax, the first cloze deletion is used;
 * otherwise, the card's back (or front if reversed) is used.
 */
export function extractTargetAnswer(
  card: Pick<Flashcard, 'front' | 'back'>,
  reversed = false
): string {
  if (!reversed && hasClozeSyntax(card.front)) {
    const match = card.front.match(/\{\{([^}]+)\}\}/);
    if (match) return match[1].trim();
  }
  return stripClozeBraces(reversed ? card.front : card.back).trim();
}

export function normalizeTurkishText(input: string): string {
  return input
    .toLocaleLowerCase('tr-TR')
    .replace(/[.,!?;:"'()\[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1]);
      }
      prev = temp;
    }
  }
  return dp[n];
}

export interface TypedEvaluation {
  status: 'exact' | 'close' | 'wrong';
  similarity: number; // 0..1
  expected: string;
  normalizedUser: string;
  normalizedExpected: string;
}

export function evaluateTypedAnswer(userInput: string, expectedRaw: string): TypedEvaluation {
  const normalizedUser = normalizeTurkishText(userInput);
  // Support slash-separated aliases in answers like "bellek / hafıza"
  const variants = expectedRaw
    .split('/')
    .map((v) => v.trim())
    .filter(Boolean);
  const candidates = variants.length > 1 ? [expectedRaw, ...variants] : [expectedRaw];

  let bestDistance = Infinity;
  let bestExpectedNormalized = normalizeTurkishText(expectedRaw);

  for (const candidate of candidates) {
    const normCand = normalizeTurkishText(candidate);
    if (normalizedUser === normCand && normCand.length > 0) {
      return {
        status: 'exact',
        similarity: 1,
        expected: expectedRaw,
        normalizedUser,
        normalizedExpected: normCand,
      };
    }
    const dist = levenshteinDistance(normalizedUser, normCand);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestExpectedNormalized = normCand;
    }
  }

  const maxLen = Math.max(normalizedUser.length, bestExpectedNormalized.length, 1);
  const similarity = Math.max(0, 1 - bestDistance / maxLen);

  // Close match if similarity >= 0.78 and user actually typed something meaningful
  if (normalizedUser.length >= 2 && (similarity >= 0.78 || bestDistance <= 1)) {
    return {
      status: 'close',
      similarity: Number(similarity.toFixed(2)),
      expected: expectedRaw,
      normalizedUser,
      normalizedExpected: bestExpectedNormalized,
    };
  }

  return {
    status: 'wrong',
    similarity: Number(similarity.toFixed(2)),
    expected: expectedRaw,
    normalizedUser,
    normalizedExpected: bestExpectedNormalized,
  };
}

export interface QuizOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

const FALLBACK_DISTRACTORS = [
  'Bilinmeyen kavram',
  'Kısa süreli bellek',
  'Sentaktik ayrıştırıcı',
  'Otonom tepki',
  'Doğrusal ölçekleme',
  'Pasif aktarım',
];

export function shuffleArray<T>(items: T[], rng: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateQuizOptions(
  targetCard: Flashcard,
  pool: Flashcard[],
  reversed = false,
  rng: () => number = Math.random
): QuizOption[] {
  const correctLabel = extractTargetAnswer(targetCard, reversed);
  const seen = new Set<string>([normalizeTurkishText(correctLabel)]);
  const distractors: string[] = [];

  const shuffledPool = shuffleArray(
    pool.filter((c) => c.id !== targetCard.id),
    rng
  );

  for (const candidate of shuffledPool) {
    const label = extractTargetAnswer(candidate, reversed);
    const norm = normalizeTurkishText(label);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      distractors.push(label);
      if (distractors.length === 3) break;
    }
  }

  for (const fallback of FALLBACK_DISTRACTORS) {
    if (distractors.length === 3) break;
    const norm = normalizeTurkishText(fallback);
    if (!seen.has(norm)) {
      seen.add(norm);
      distractors.push(fallback);
    }
  }

  const options: QuizOption[] = [
    { id: `opt-correct-${targetCard.id}`, label: correctLabel, isCorrect: true },
    ...distractors.map((label, idx) => ({
      id: `opt-dist-${targetCard.id}-${idx}`,
      label,
      isCorrect: false,
    })),
  ];

  return shuffleArray(options, rng);
}

export interface MatchTile {
  tileId: string;
  pairId: string;
  side: 'front' | 'back';
  text: string;
}

export function buildMatchPairsRound(
  cards: Flashcard[],
  maxPairs = 6,
  rng: () => number = Math.random
): MatchTile[] {
  const selected = shuffleArray(cards, rng).slice(0, Math.min(maxPairs, cards.length));
  const tiles: MatchTile[] = [];

  for (const card of selected) {
    const frontText = hasClozeSyntax(card.front)
      ? card.front.replace(/\{\{[^}]+\}\}/g, '[ ... ]')
      : card.front;
    const backText = extractTargetAnswer(card, false);

    tiles.push({
      tileId: `${card.id}-front`,
      pairId: card.id,
      side: 'front',
      text: frontText,
    });
    tiles.push({
      tileId: `${card.id}-back`,
      pairId: card.id,
      side: 'back',
      text: backText,
    });
  }

  return shuffleArray(tiles, rng);
}

export interface ParsedBulkCard {
  front: string;
  back: string;
  hint?: string;
  example?: string;
}

/**
 * Parses lines separated by `;` or `\t` or `|` into flashcard drafts.
 * Format: Front ; Back ; Hint (optional) ; Example (optional)
 */
export function parseBulkImportText(rawText: string): ParsedBulkCard[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const results: ParsedBulkCard[] = [];

  for (const line of lines) {
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes(';')) {
      parts = line.split(';');
    } else if (line.includes('|')) {
      parts = line.split('|');
    } else if (line.includes(' - ')) {
      parts = line.split(' - ');
    }

    const cleaned = parts.map((p) => p.trim());
    if (cleaned.length >= 2 && cleaned[0] && cleaned[1]) {
      results.push({
        front: cleaned[0],
        back: cleaned[1],
        hint: cleaned[2] || undefined,
        example: cleaned[3] || undefined,
      });
    }
  }

  return results;
}

export function exportCardsToCsv(cards: Flashcard[]): string {
  const escapeCsv = (val: string | undefined) => {
    const str = val ?? '';
    if (/[",\n;]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = 'Ön Yüz;Arka Yüz;İpucu;Örnek;Etiket;Leitner Kutusu';
  const rows = cards.map((c) =>
    [
      escapeCsv(c.front),
      escapeCsv(c.back),
      escapeCsv(c.hint),
      escapeCsv(c.example),
      escapeCsv(c.tag),
      String(c.leitnerBox),
    ].join(';')
  );
  return [header, ...rows].join('\n');
}
