import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { FullCard } from '@/client/components/Card/FullCard';
import { cardStyles, deckAnimation, TableCardInitialZIndex } from '@/client/utils/constants';
import type { CardPosition } from '@/client/utils/types';

import type { TableVisualCard } from './types/table.types';

const { duration, sequenceInterval, easingBezier } = deckAnimation;
const easing = Easing.bezier(easingBezier[0], easingBezier[1], easingBezier[2], easingBezier[3]);

interface TableCardProps {
    visualCard: TableVisualCard;
    currentPosition: CardPosition;
    onFlyEnd: (cardId: string) => void;
    onFlipEnd: (cardId: string) => void;
}

export function TableCard({ visualCard, currentPosition, onFlyEnd, onFlipEnd }: TableCardProps) {
    const deltaX = visualCard.targetPosition.x - visualCard.startPosition.x;
    const deltaY = visualCard.targetPosition.y - visualCard.startPosition.y;

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const [zIndex, setZIndex] = useState(() => TableCardInitialZIndex - visualCard.sequenceIndex);

    useEffect(() => {
        if (visualCard.layoutMode === 'settled') return;

        const delay = visualCard.sequenceIndex * sequenceInterval;

        translateX.value = withDelay(delay, withTiming(deltaX, { duration, easing }, finished => {
            if (finished === true) {
                runOnJS(onFlyEnd)(visualCard.id);
            }
        }));
        translateY.value = withDelay(delay, withTiming(deltaY, { duration, easing }));

        const zIndexTimeoutId = setTimeout(() => {
            setZIndex(TableCardInitialZIndex + visualCard.sequenceIndex);
        }, delay);

        return () => {
            clearTimeout(zIndexTimeoutId);
        };
        // The flight intentionally uses the start/target snapshot from the visual card creation moment.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        if (visualCard.layoutMode === 'settled') {
            return {
                transform: [{ translateX: 0 }, { translateY: 0 }],
            };
        }

        return {
            transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
        };
    }, [visualCard.layoutMode]);

    return (
        <Animated.View style={[styles.cardAnchor, { left: currentPosition.x, top: currentPosition.y, zIndex }]}>
            <Animated.View style={[styles.cardMotion, animatedStyle]}>
                <FullCard
                    card={{
                        rank: visualCard.card.rank,
                        suit: visualCard.card.suit,
                        isFlipped: visualCard.card.isFlipped,
                    }}
                    onFlipEnd={() => onFlipEnd(visualCard.id)}
                />
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    cardAnchor: {
        position: 'absolute',
        width: cardStyles.width,
        height: cardStyles.height,
    },
    cardMotion: {
        width: '100%',
        height: '100%',
    },
});
