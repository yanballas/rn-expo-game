import type { ImageContentFit } from 'expo-image';
import { ReactNode, RefObject } from 'react';
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

export type PoolRef = RefObject<FrontCard[]>;
export type UniqueIdRef = RefObject<number>;

export type Recipient = 'player' | 'dealer';

export type CardEntity = {
    id: string;
    card: FullCard;
    origin: 'deal' | 'hit';
    recipient: Recipient;
    slotIndex: number;
    targetPosition: CardPosition;
    animationChannel: number;
};

export type HitRequest = {
    id: number;
    recipient: Recipient;
    slotIndex: number;
};

export type GamePhase = 'idle' | 'dealing' | 'playerTurn' | 'hitAnimating' | 'dealerTurn' | 'roundEnd';
