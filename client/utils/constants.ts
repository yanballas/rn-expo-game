export const colors = {
    red: '#AA0505',
    black: '#000000',
    background: '#191a01',
};

export const cardStyles = {
    width: 86,
    height: 103,
    borderRadius: 8,
    overflow: 'hidden',
} as const;

export const flipTransition = {
    type: 'timing' as const,
    duration: 800,
};

export const defaultHandSlotCount = 2;

/** Horizontal gap between cards in `Hand` row — keep in sync with `Hand` layout. */
export const handCardsRowGap = 12;

export const deckAnimation = {
    duration: 500,
    sequenceInterval: 180,
    flyingCardCount: 4,
    easingBezier: [0.25, 0.1, 0.25, 1] as const,
} as const;

export const deckStackOffset = 6;

export const deckLeftInset = 14;
