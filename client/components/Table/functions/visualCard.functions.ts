import { deckCardOriginInset, defaultHandSlotCount } from '@/client/utils/constants';
import { generateId } from '@/client/utils/functions';
import type {
    CardLayout,
    FrontCard,
    InitialDealReservation,
    Recipient,
    SingleCardReservation,
} from '@/client/utils/types';

import { resolveCardPosition } from '../hooks/useTableLayout';
import type { TableVisualCard } from '../types/table.types';

export function warnTableActionError(reason: string) {
    console.warn(`[Table Action] ${reason}`);
}

export function createVisualCard(
    card: FrontCard,
    recipient: Recipient,
    slotIndex: number,
    sequenceIndex: number,
    layoutSnapshot: CardLayout,
): TableVisualCard | null {
    const deck = layoutSnapshot.deck;
    if (!deck) return null;

    const targetPosition = resolveCardPosition(layoutSnapshot, recipient, slotIndex);
    if (!targetPosition) return null;

    return {
        id: generateId(),
        card: { ...card, isFlipped: false },
        recipient,
        slotIndex,
        sequenceIndex,
        startPosition: {
            x: deck.x + deckCardOriginInset,
            y: deck.y + deckCardOriginInset,
        },
        targetPosition,
    };
}

export function createInitialDealVisualCards(
    reservation: InitialDealReservation,
    layoutSnapshot: CardLayout,
): TableVisualCard[] | null {
    const dealerCards = reservation.dealerCards.map((card, index) => createVisualCard(
        card,
        'dealer',
        index,
        index,
        layoutSnapshot,
    ));
    const playerCards = reservation.playerCards.map((card, index) => createVisualCard(
        card,
        'player',
        index,
        index + defaultHandSlotCount,
        layoutSnapshot,
    ));

    const nextCards = [...dealerCards, ...playerCards];
    if (nextCards.some(card => card === null)) return null;

    return nextCards as TableVisualCard[];
}

export function createHitVisualCard(
    reservation: SingleCardReservation,
    layoutSnapshot: CardLayout,
): TableVisualCard | null {
    return createVisualCard(reservation.card, reservation.recipient, reservation.slotIndex, 0, layoutSnapshot);
}

export function getInitialDealFaceUpCardIds(cards: TableVisualCard[]): string[] {
    return cards
        .filter(card => card.recipient === 'player' || (card.recipient === 'dealer' && card.slotIndex === 0))
        .map(card => card.id);
}
