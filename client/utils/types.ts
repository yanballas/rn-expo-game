import type { ImageContentFit } from 'expo-image';
import { ReactNode } from 'react';
import { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

import { cardRanks, cardSuits } from '@utils/constants';

export interface FrontCard {
    rank: (typeof cardRanks)[number];
    suit: (typeof cardSuits)[number];
}

export interface FullCard extends FrontCard {
    isFlipped?: boolean;
}

export interface AnimatedCardFace {
    children: ReactNode;
    isVisible: boolean;
    rotateY: string;
    onFlipEnd?: () => void;
    style?: StyleProp<ViewStyle>;
}

export type BackgroundProps = {
    source: ImageSourcePropType;
    contentFit?: ImageContentFit;
    style?: StyleProp<ViewStyle>;
};

export type CardPosition = {
    x: number;
    y: number;
};

export type Recipient = 'player' | 'dealer';

export type ActionResult<T> = { ok: true; value: T } | { ok: false; reason: string };

export type InitialDealReservation = {
    dealerCards: FrontCard[];
    playerCards: FrontCard[];
};

export type SingleCardReservation = {
    recipient: Recipient;
    card: FrontCard;
    slotIndex: number;
};

export type CardSlotTarget = {
    recipient: Recipient;
    slotIndex: number;
};

export type VisualCard = CardSlotTarget & {
    id: string;
    card: FullCard;
    sequenceIndex: number;
};

export type CardLayout = {
    deck: CardPosition | null;
    dealerSlots: CardPosition[];
    playerSlots: CardPosition[];
};

export type GamePhase = 'idle' | 'playerTurn' | 'dealerTurn' | 'roundEnd' | 'roundError';
