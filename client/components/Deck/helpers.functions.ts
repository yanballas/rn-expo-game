import type { CardPosition, FlightSchedulingHandles, FrontCard } from '@/client/utils/types';
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

export function pickRandomCards(pool: FrontCard[], count: number): FrontCard[] {
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
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
    const dx = positions[iLast].x - positions[iLast - 1].x;
    const dy = positions[iLast].y - positions[iLast - 1].y;
    const steps = slotIndex - iLast;
    return {
        x: positions[iLast].x + dx * steps,
        y: positions[iLast].y + dy * steps,
    };
}

export function clearFlightScheduling(handles: FlightSchedulingHandles) {
    if (handles.rafId != null) {
        cancelAnimationFrame(handles.rafId);
        handles.rafId = null;
    }
    if (handles.timeoutId != null) {
        clearTimeout(handles.timeoutId);
        handles.timeoutId = null;
    }
}

export function runNextFrameAndAfterDelay(
    handles: FlightSchedulingHandles,
    delayMs: number,
    onNextFrame: () => void,
    onAfterDelay: () => void,
) {
    handles.rafId = requestAnimationFrame(() => {
        handles.rafId = null;
        onNextFrame();
        handles.timeoutId = setTimeout(() => {
            handles.timeoutId = null;
            onAfterDelay();
        }, delayMs);
    });
}
