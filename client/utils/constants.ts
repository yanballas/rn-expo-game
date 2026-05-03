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
    duration: 800,
};

export const defaultHandSlotCount = 2;

export const handCardsRowGap = 12;

export const cardHalfHeightPx = Math.round(cardStyles.height / 2);

export const deckAnimation = {
    duration: 500,
    sequenceInterval: 180,
    flyingCardCount: 4,
    easingBezier: [0.25, 0.1, 0.25, 1] as const,
} as const;

export const deckStackOffset = 6;

export const deckLeftInset = 14;

export const deckTopCardOriginInset = deckStackOffset * 2;
