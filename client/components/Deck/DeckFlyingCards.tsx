import { StyleSheet } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { FullCard } from '@/client/components/Card/FullCard';
import { cardStyles } from '@/client/utils/constants';
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
        <Animated.View style={styles.flyingCardAnchor}>
            <Animated.View style={[styles.flyingCardMotion, animatedStyle]}>
                <FullCard card={{ rank: card.rank, suit: card.suit, isFlipped: false }} />
            </Animated.View>
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
    flyingCardAnchor: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: cardStyles.width,
        height: cardStyles.height,
        zIndex: 2,
    },
    flyingCardMotion: {
        width: '100%',
        height: '100%',
    },
});
