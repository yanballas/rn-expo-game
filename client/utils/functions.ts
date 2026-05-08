import type { FullCard } from '@/client/utils/types';
import { cardRankValues } from '@utils/constants';

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

export function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}
