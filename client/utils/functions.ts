import { cardRankValues } from '@utils/constants';
import type { FrontCard, FullCard } from '@/client/utils/types';

export function calculateScore(hand: Pick<FullCard, 'rank'>[]): number {
    let score = 0;
    let aces = 0;
    for (const card of hand) {
        if (card.rank === 'A') {
            aces++;
            score += 11;
        } else {
            score += cardRankValues[card.rank];
        }
    }
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    return score;
}

export function sleep(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export function logger(message: string, color: string) {
    console.log(`%c${message}`, `color: ${color}`);
}

const colorDeck = '#9333ea';
const colorPlayer = '#2563eb';
const colorDealer = '#dc2626';

export function formatCard(card: Pick<FrontCard, 'rank' | 'suit'>): string {
    return `${card.rank}-${card.suit}`;
}

export function formatCards(cards: readonly Pick<FrontCard, 'rank' | 'suit'>[]): string {
    if (cards.length === 0) return '—';
    return cards.map(formatCard).join(', ');
}

export function logDeckRemaining(cards: readonly Pick<FrontCard, 'rank' | 'suit'>[]) {
    logger(`Колода (${cards.length}): ${formatCards(cards)}`, colorDeck);
}

export function logPlayerHand(cards: readonly Pick<FrontCard, 'rank' | 'suit'>[]) {
    logger(`Игрок (${cards.length}): ${formatCards(cards)}`, colorPlayer);
}

export function logDealerHand(cards: readonly Pick<FrontCard, 'rank' | 'suit'>[]) {
    logger(`Дилер (${cards.length}): ${formatCards(cards)}`, colorDealer);
}

export function logEntitiesCleared() {
    logger('Карты entities очистились', '#64748b');
}

export function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}
