import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { FullCard } from '@/client/components/Card/FullCard';
import { useGameStore } from '@/client/store';
import { cardStyles, deckAnimation, deckCardOriginInset, TableCardInitialZIndex } from '@/client/utils/constants';
import { onFlipComplete, onFlyComplete } from '@/client/utils/functions';
import type { CardEntity } from '@/client/utils/types';

const { duration, sequenceInterval, easingBezier } = deckAnimation;
const easing = Easing.bezier(easingBezier[0], easingBezier[1], easingBezier[2], easingBezier[3]);

interface TableCardProps {
    entity: CardEntity;
}

export function TableCard({ entity }: TableCardProps) {
    const deckPosition = useGameStore(store => store.deckPosition);
    const deltaX = entity.targetPosition.x - deckPosition.x;
    const deltaY = entity.targetPosition.y - deckPosition.y;

    const translateX = useSharedValue(deckCardOriginInset);
    const translateY = useSharedValue(deckCardOriginInset);

    const [zIndex, setZIndex] = useState(() => TableCardInitialZIndex - entity.animationChannel);

    useEffect(() => {
        const delay = entity.animationChannel * sequenceInterval;
        const flyDuration = duration;

        translateX.value = withDelay(delay, withTiming(deltaX, { duration: flyDuration, easing }, finished => {
            if (finished === true) {
                runOnJS(onFlyComplete)(entity.id);
            }
        }));
        translateY.value = withDelay(delay, withTiming(deltaY, { duration: flyDuration, easing }));

        const zIndexTimeoutId = setTimeout(() => {
            setZIndex(TableCardInitialZIndex + entity.animationChannel);
        }, delay);

        return () => {
            clearTimeout(zIndexTimeoutId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    }));

    const handleFlipEnd = () => {
        onFlipComplete(entity.id);
    };

    return (
        <Animated.View style={[styles.cardAnchor, { zIndex }]}>
            <Animated.View style={[styles.cardMotion, animatedStyle]}>
                <FullCard
                    card={{ rank: entity.card.rank, suit: entity.card.suit, isFlipped: entity.card.isFlipped }}
                    onFlipEnd={handleFlipEnd}
                />
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    cardAnchor: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: cardStyles.width,
        height: cardStyles.height,
    },
    cardMotion: {
        width: '100%',
        height: '100%',
    },
});
