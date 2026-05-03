import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { FullCard } from '@/client/components/Card/FullCard';
import { cardStyles, deckAnimation } from '@/client/utils/constants';
import type { CardEntity, CardPosition } from '@/client/utils/types';

const { duration, sequenceInterval, easingBezier } = deckAnimation;
const easing = Easing.bezier(easingBezier[0], easingBezier[1], easingBezier[2], easingBezier[3]);

interface TableCardProps {
    entity: CardEntity;
    deckPos: CardPosition;
    onComplete: (entityId: number) => void;
}

export function TableCard({ entity, deckPos, onComplete }: TableCardProps) {
    const deltaX = entity.targetPosition.x - deckPos.x;
    const deltaY = entity.targetPosition.y - deckPos.y;

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const [isFlipped, setFlipped] = useState(false);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    useEffect(() => {
        const delay = entity.animationChannel * sequenceInterval;
        const totalTime = delay + duration;

        translateX.value = withDelay(delay, withTiming(deltaX, { duration, easing }));
        translateY.value = withDelay(delay, withTiming(deltaY, { duration, easing }));

        const timeoutId = setTimeout(() => {
            setFlipped(true);
            onCompleteRef.current(entity.id);
        }, totalTime);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[styles.cardAnchor, { zIndex: 5 }]}>
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
