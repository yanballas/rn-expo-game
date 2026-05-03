import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { FullCard } from '@/client/components/Card/FullCard';
import { cardStyles, deckAnimation, deckTopCardOriginInset, TableCardInitialZIndex } from '@/client/utils/constants';
import type { CardEntity, CardPosition } from '@/client/utils/types';
import { isFlippedAfterFly } from './helpers.functions';

const { duration, sequenceInterval, easingBezier } = deckAnimation;
const easing = Easing.bezier(easingBezier[0], easingBezier[1], easingBezier[2], easingBezier[3]);

interface TableCardProps {
    entity: CardEntity;
    deckPosition: CardPosition;
    onComplete: (entityId: number) => void;
}

export function TableCard({ entity, deckPosition, onComplete }: TableCardProps) {
    const deltaX = entity.targetPosition.x - deckPosition.x;
    const deltaY = entity.targetPosition.y - deckPosition.y;

    const translateX = useSharedValue(deckTopCardOriginInset);
    const translateY = useSharedValue(deckTopCardOriginInset);
    const [isFlipped, setFlipped] = useState(false);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    const [zIndex, setZIndex] = useState(() => TableCardInitialZIndex - entity.animationChannel);

    useEffect(() => {
        const delay = entity.animationChannel * sequenceInterval;
        const flyDuration = duration;
        const totalTime = delay + flyDuration;

        translateX.value = withDelay(delay, withTiming(deltaX, { duration: flyDuration, easing }));
        translateY.value = withDelay(delay, withTiming(deltaY, { duration: flyDuration, easing }));

        const zIndexTimeoutId = setTimeout(() => {
            setZIndex(TableCardInitialZIndex + entity.id);
        }, delay);

        const flipTimeoutId = setTimeout(() => {
            setFlipped(isFlippedAfterFly(entity));
            onCompleteRef.current(entity.id);
        }, totalTime);

        return () => {
            clearTimeout(zIndexTimeoutId);
            clearTimeout(flipTimeoutId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
