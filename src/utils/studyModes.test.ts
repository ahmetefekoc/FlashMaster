import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseClozeText,
  hasClozeSyntax,
  extractTargetAnswer,
  evaluateTypedAnswer,
  generateQuizOptions,
  buildMatchPairsRound,
  parseBulkImportText,
} from './studyModes';
import type { Flashcard } from '../types/flashcard';

const makeCard = (id: string, front: string, back: string): Flashcard => ({
  id,
  deckId: 'd1',
  front,
  back,
  starred: false,
  easeFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
  leitnerBox: 1,
  lapses: 0,
  nextReviewAt: 0,
  createdAt: 0,
});

test('cloze parser splits text and extracts cloze target answer', () => {
  const text = 'Hücrenin enerji santrali {{mitokondri}} organelidir.';
  assert.equal(hasClozeSyntax(text), true);
  const segs = parseClozeText(text);
  assert.deepEqual(segs, [
    { type: 'text', content: 'Hücrenin enerji santrali ' },
    { type: 'cloze', content: 'mitokondri' },
    { type: 'text', content: ' organelidir.' },
  ]);

  const card = makeCard('c1', text, 'Enerji üretimi (ATP)');
  assert.equal(extractTargetAnswer(card, false), 'mitokondri');
  assert.equal(extractTargetAnswer(makeCard('c2', 'Ubiquitous', 'Her yerde bulunan'), false), 'Her yerde bulunan');
});

test('evaluateTypedAnswer handles Turkish casing, slash aliases, close typos, and mismatches', () => {
  assert.equal(evaluateTypedAnswer('İSTANBUL', 'İstanbul').status, 'exact');
  assert.equal(evaluateTypedAnswer('hafıza', 'bellek / hafıza').status, 'exact');
  assert.equal(evaluateTypedAnswer('mitokondr', 'mitokondri').status, 'close');
  assert.equal(evaluateTypedAnswer('ribozom', 'mitokondri').status, 'wrong');
});

test('generateQuizOptions produces 4 unique options with 1 correct answer', () => {
  const pool: Flashcard[] = [
    makeCard('1', 'A', 'Elma'),
    makeCard('2', 'B', 'Armut'),
    makeCard('3', 'C', 'Kiraz'),
    makeCard('4', 'D', 'Muz'),
  ];
  const opts = generateQuizOptions(pool[0], pool, false, () => 0.5);
  assert.equal(opts.length, 4);
  assert.equal(opts.filter((o) => o.isCorrect).length, 1);
  assert.equal(opts.find((o) => o.isCorrect)?.label, 'Elma');
  assert.equal(new Set(opts.map((o) => o.label)).size, 4);
});

test('buildMatchPairsRound returns 2 tiles per card up to maxPairs', () => {
  const pool: Flashcard[] = [
    makeCard('1', 'Soru 1', 'Cevap 1'),
    makeCard('2', 'Soru 2', 'Cevap 2'),
    makeCard('3', 'Soru 3', 'Cevap 3'),
  ];
  const tiles = buildMatchPairsRound(pool, 2, () => 0.4);
  assert.equal(tiles.length, 4);
  assert.equal(tiles.filter((t) => t.side === 'front').length, 2);
  assert.equal(tiles.filter((t) => t.side === 'back').length, 2);
});

test('parseBulkImportText parses semicolon and tab separated lines with optional hints', () => {
  const input = [
    'Ephemeral ; Kısa ömürlü ; Geçici',
    'Resilient\tDayanıklı\tEsnek yapı\tShe is resilient.',
    'Invalid line without separator',
  ].join('\n');

  const parsed = parseBulkImportText(input);
  assert.equal(parsed.length, 2);
  assert.deepEqual(parsed[0], {
    front: 'Ephemeral',
    back: 'Kısa ömürlü',
    hint: 'Geçici',
    example: undefined,
  });
  assert.equal(parsed[1].example, 'She is resilient.');
});
