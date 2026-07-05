import type { RefObject } from 'react';
import type { View } from 'react-native';

import type { CardLayout, CardPosition, VisualCard } from '@/client/utils/types';

export type TableVisualCard = VisualCard & {
    startPosition: CardPosition;
    targetPosition: CardPosition;
};

export interface TableHandle {
    dealInitialCards: () => void;
    hitPlayer: () => void;
    stand: () => void;
    newRound: () => void;
    resetTable: () => void;
}

export type TableLayoutRefs = {
    wrapperRef: RefObject<View | null>;
    deckRef: RefObject<View | null>;
    dealerSlotRefs: RefObject<(View | null)[]>;
    playerSlotRefs: RefObject<(View | null)[]>;
};

export type TableAnimationActions = {
    dealInitialCards: () => void;
    hitPlayer: () => void;
    stand: () => void;
    newRound: () => void;
    resetTable: () => void;
};

export interface BlackjackAnimationControllerParams {
    layoutRef: RefObject<CardLayout>;
    onInteractionLockedChange?: (isLocked: boolean) => void;
}

export type TableOperationResult =
    | { ok: true }
    | { ok: false; reason: string }
    | { ok: false; isCancelled: true };

export type TableAnimationWaitResult = TableOperationResult;

export type TableAnimationResolverMap = Map<string, (result: TableAnimationWaitResult) => void>;
