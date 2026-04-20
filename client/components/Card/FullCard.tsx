import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { BackCard } from './BackCard';
import { FrontCard } from './FrontCard';

import { cardStyles, flipTransition } from '@/client/utils/constants';
import { AnimatedCardFace as AnimatedCardFaceType, FullCard as FullCardType } from '@/client/utils/types';

const rotatePositions = {
    front: {
        start: '0deg',
        end: '180deg',
    },
    back: {
        start: '-180deg',
        end: '0deg',
    },
};

function AnimatedCardFace({ children, isVisible, rotateY, style }: AnimatedCardFaceType) {
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ perspective: 1000 }, { rotateY: withTiming(rotateY, { duration: flipTransition.duration }) }],
        };
    }, [rotateY]);

    return (
        <Animated.View pointerEvents={isVisible ? 'auto' : 'none'} style={[styles.cardFace, style, animatedStyle]}>
            {children}
        </Animated.View>
    );
}

export function FullCard({ card: { rank, suit, isFlipped = true } }: { card: FullCardType }) {
    return (
        <View style={styles.container}>
            <AnimatedCardFace
                isVisible={isFlipped}
                rotateY={isFlipped ? rotatePositions.front.start : rotatePositions.front.end}
                style={styles.cardFront}
            >
                <FrontCard card={{ rank, suit }} />
            </AnimatedCardFace>
            <AnimatedCardFace
                isVisible={!isFlipped}
                rotateY={isFlipped ? rotatePositions.back.start : rotatePositions.back.end}
                style={styles.cardBack}
            >
                <BackCard />
            </AnimatedCardFace>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: cardStyles.width,
        height: cardStyles.height,
        overflow: 'visible',
    },
    cardFace: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backfaceVisibility: 'hidden',
        overflow: cardStyles.overflow,
    },
    cardFront: {
        zIndex: 2,
    },
    cardBack: {
        zIndex: 1,
    },
});
