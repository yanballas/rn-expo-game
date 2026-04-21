export const colors = {
    red: '#FF0000',
    black: '#000000',
    background: '#191a01',
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
