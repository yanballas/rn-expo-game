import { cardRanks, cardSuits } from '@/utils/constants';

export interface FrontCard {
    rank: (typeof cardRanks)[number];
    suit: (typeof cardSuits)[number];
}

export interface FullCard extends FrontCard {
    isHidden?: boolean;
}
