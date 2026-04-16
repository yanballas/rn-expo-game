import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { cardRanks, cardSuits } from '@/utils/constants';

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
