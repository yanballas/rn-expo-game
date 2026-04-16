export const cardRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export const cardSuits = ['hearts', 'diamonds', 'clubs', 'spades'];

export const colors = {
    red: '#FF0000',
    black: '#000000',
};

export const cardStyles = {
    width: 120,
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'black',
    padding: 16,
    overflow: 'hidden',
} as const;

export const flipTransition = {
    type: 'timing' as const,
    duration: 800,
};
