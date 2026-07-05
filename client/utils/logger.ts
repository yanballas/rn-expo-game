import type { FrontCard } from '@/client/utils/types';

export function logger(message: string, color: string) {
    console.log(`%c${message}`, `color: ${color}`);
}

const colorDeck = '#9333ea';
const colorPlayer = '#2563eb';
const colorDealer = '#dc2626';
const colorEntities = '#22d3ee';
const colorReset = '#f97316';

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

export function logGameReset() {
    logger('───── Game Reset ─────', colorReset);
}

export function logStoreState(state: {
    phase: string;
    playerScore: number;
    dealerScore: number;
    playerHandCount: number;
    dealerHandCount: number;
    entityCount: number;
    poolCount: number;
}) {
    logger(
        `Store: phase=${state.phase} player=${state.playerScore}/${state.playerHandCount} dealer=${state.dealerScore}/${state.dealerHandCount} entities=${state.entityCount} pool=${state.poolCount}`,
        colorEntities,
    );
}
