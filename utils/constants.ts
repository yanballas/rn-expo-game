export const cardRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
export const cardSuits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
export const cardRankValues = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    J: 10,
    Q: 10,
    K: 10,
    A: 11,
} as const satisfies Record<(typeof cardRanks)[number], number>;
