import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { FullCard } from '@/client/components/Card/FullCard';
import { useGameStore } from '@/client/store';
import { cardStyles, deckAnimation, deckCardOriginInset, TableCardInitialZIndex } from '@/client/utils/constants';
import type { CardEntity } from '@/client/utils/types';
import { isFlippedAfterFly } from './helpers.functions';

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

    const [isFlipped, setFlipped] = useState(false);
    const [zIndex, setZIndex] = useState(() => TableCardInitialZIndex - entity.animationChannel);

    useEffect(() => {
        const delay = entity.animationChannel * sequenceInterval;
        const flyDuration = duration;
        const totalTime = delay + flyDuration;

        translateX.value = withDelay(delay, withTiming(deltaX, { duration: flyDuration, easing }));
        translateY.value = withDelay(delay, withTiming(deltaY, { duration: flyDuration, easing }));

        const zIndexTimeoutId = setTimeout(() => {
            setZIndex(TableCardInitialZIndex + entity.animationChannel);
        }, delay);

        const flipTimeoutId = setTimeout(() => {
            setFlipped(isFlippedAfterFly(entity));
            useGameStore.getState().completeEntityAnimation(entity.id);
        }, totalTime);

        return () => {
            clearTimeout(zIndexTimeoutId);
            clearTimeout(flipTimeoutId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (entity.card.isFlipped) {
            setFlipped(true);
        }
    }, [entity.card.isFlipped]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[styles.cardAnchor, { zIndex }]}>
            <Animated.View style={[styles.cardMotion, animatedStyle]}>
                <FullCard card={{ rank: entity.card.rank, suit: entity.card.suit, isFlipped }} />
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
