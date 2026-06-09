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
        const randomValue = (Math.random() * 16) | 0;
        return (c === 'x' ? randomValue : (randomValue & 0x3) | 0x8).toString(16);
    });
}

const flyResolvers = new Map<string, () => void>();
const flipResolvers = new Map<string, () => void>();
const dealerCardResolvers = new Map<string, () => void>();

export function onFlyComplete(entityId: string) {
    flyResolvers.get(entityId)?.();
    flyResolvers.delete(entityId);
}

export function onFlipComplete(entityId: string) {
    flipResolvers.get(entityId)?.();
    flipResolvers.delete(entityId);
}

let isCancelled = false;

export function cancelRunningAnimation() {
    isCancelled = true;
    clearAnimationResolvers();
    dealerCardResolvers.clear();
}

async function runWithTimeout(promise: Promise<void>, timeoutMs: number, label: string): Promise<void> {
    const timeoutId = setTimeout(() => {
        throw new Error(`Animation timeout: ${label}`);
    }, timeoutMs);
    try {
        await promise;
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function runAsync(animationFunction: () => Promise<void>, label: string = 'animation') {
    isCancelled = false;
    try {
        await animationFunction();
    } catch (error) {
        if (isCancelled) return;
        console.error(`[Animation Error] ${label}:`, error);
    }
}

export function clearAnimationResolvers() {
    flyResolvers.clear();
    flipResolvers.clear();
    dealerCardResolvers.clear();
}

export function clearDealerCardResolvers() {
    dealerCardResolvers.clear();
}

export function notifyNextDealerCard() {
    dealerCardResolvers.get('next')?.();
    dealerCardResolvers.delete('next');
}

const animationTimeoutMs = 5000;

export async function waitForFly(entityId: string): Promise<void> {
    await runWithTimeout(new Promise<void>(resolve => flyResolvers.set(entityId, resolve)), animationTimeoutMs, `fly:${entityId}`);
}

export async function waitForFlip(entityId: string): Promise<void> {
    await runWithTimeout(new Promise<void>(resolve => flipResolvers.set(entityId, resolve)), animationTimeoutMs, `flip:${entityId}`);
}

export async function waitForNextDealerCard(): Promise<void> {
    await runWithTimeout(new Promise<void>(resolve => dealerCardResolvers.set('next', resolve)), animationTimeoutMs, 'dealerCard:next');
}
