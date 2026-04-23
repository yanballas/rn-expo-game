import type { ImageContentFit } from 'expo-image';
import { ReactNode, RefObject } from 'react';
import { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

import { cardRanks, cardSuits } from '@utils/constants';
import { SharedValue } from 'react-native-reanimated';

export interface FrontCard {
    rank: (typeof cardRanks)[number];
    suit: (typeof cardSuits)[number];
}

export interface AnimatedCardFace {
    children: ReactNode;
    isVisible: boolean;
    rotateY: string;
    style?: StyleProp<ViewStyle>;
}

export interface FullCard extends FrontCard {
    isFlipped?: boolean;
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
export type DeckPosRef = RefObject<CardPosition>;
export type UniqueIdRef = RefObject<number>;

export type DeckFlyingCardItem = {
    id: number;
    card: FrontCard;
    targetIndex: number;
};

export type DealFlightMotion = {
    translateXRefs: SharedValue<number>[];
    translateYRefs: SharedValue<number>[];
    reset: () => void;
};

export type HitRecipient = 'player' | 'dealer';

export type HitRequest = {
    id: number;
    recipient: HitRecipient;
    slotIndex: number;
};

export type FlightSchedulingHandles = {
    rafId: number | null;
    timeoutId: ReturnType<typeof setTimeout> | null;
};
