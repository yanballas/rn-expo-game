import type { CardEntity, CardPosition, FrontCard } from '@/client/utils/types';
import { cardRanks, cardSuits } from '@utils/constants';

export function buildDeck(): FrontCard[] {
    const deck: FrontCard[] = [];
    for (const rank of cardRanks) {
        for (const suit of cardSuits) {
            deck.push({ rank: rank as FrontCard['rank'], suit: suit as FrontCard['suit'] });
        }
    }
    return deck;
}

export function resolveSlotPosition(
    positions: CardPosition[],
    slotIndex: number,
    cardWidth: number,
    rowGap: number,
): CardPosition | null {
    if (positions.length === 0) return null;
    if (slotIndex < positions.length) return positions[slotIndex];

    const iLast = positions.length - 1;
    if (iLast === 0) {
        const stepX = cardWidth + rowGap;
        return {
            x: positions[0].x + stepX * slotIndex,
            y: positions[0].y,
        };
    }
    const deltaX = positions[iLast].x - positions[iLast - 1].x;
    const deltaY = positions[iLast].y - positions[iLast - 1].y;
    const steps = slotIndex - iLast;
    return {
        x: positions[iLast].x + deltaX * steps,
        y: positions[iLast].y + deltaY * steps,
    };
}

function shufflePool(pool: FrontCard[]): FrontCard[] {
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function takeRandomCardsFromPool(
    pool: FrontCard[],
    count: number,
): { picked: FrontCard[]; remaining: FrontCard[] } {
    const shuffled = shufflePool(pool);
    const picked = shuffled.slice(0, count);
    const remaining = shuffled.slice(count);
    return { picked, remaining };
}

export function isFlippedAfterFly(entity: CardEntity): boolean {
    if (entity.origin === 'hit') return true;
    if (entity.recipient === 'player') return true;
    return entity.slotIndex === 0;
}
