import { StyleSheet } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { FullCard } from '@/client/components/Card/FullCard';
import { cardStyles, deckLeftInset } from '@/client/utils/constants';
import type { DealFlightMotion, DeckFlyingCardItem, FrontCard } from '@/client/utils/types';

function AnimatedFlyingCard({
    card,
    translateX,
    translateY,
}: {
    card: FrontCard;
    translateX: SharedValue<number>;
    translateY: SharedValue<number>;
}) {
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[styles.flyingCard, animatedStyle]}>
            <FullCard card={{ rank: card.rank, suit: card.suit, isFlipped: false }} />
        </Animated.View>
    );
}

export function DeckFlyingCardsList({ items, motion }: { items: DeckFlyingCardItem[]; motion: DealFlightMotion }) {
    const { translateXRefs, translateYRefs } = motion;
    return (
        <>
            {items.map(flyingCard => (
                <AnimatedFlyingCard
                    key={flyingCard.id}
                    card={flyingCard.card}
                    translateX={translateXRefs[flyingCard.targetIndex]}
                    translateY={translateYRefs[flyingCard.targetIndex]}
                />
            ))}
        </>
    );
}

const styles = StyleSheet.create({
    flyingCard: {
        position: 'absolute',
        left: deckLeftInset,
        top: '50%',
        width: cardStyles.width,
        height: cardStyles.height,
        marginTop: -(cardStyles.height / 2),
        zIndex: 100,
    },
});
