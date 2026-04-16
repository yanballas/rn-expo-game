import { MotiView } from 'moti';
import { StyleSheet, View } from 'react-native';

import { BackCard } from './BackCard';
import { FrontCard } from './FrontCard';

import { cardStyles, flipTransition } from '@/utils/constants';
import { AnimatedCardFace as AnimatedCardFaceType, FullCard as FullCardType } from '@/utils/types';

function AnimatedCardFace({ children, isVisible, rotateY, style }: AnimatedCardFaceType) {
    return (
        <MotiView
            animate={{
                transform: [{ perspective: 1000 }, { rotateY }],
            }}
            pointerEvents={isVisible ? 'auto' : 'none'}
            style={[styles.cardFace, style]}
            transition={flipTransition}
        >
            {children}
        </MotiView>
    );
}

export function FullCard({ card: { rank, suit, isFlipped = true } }: { card: FullCardType }) {
    const showFront = isFlipped;

    return (
        <View style={styles.container}>
            <AnimatedCardFace isVisible={showFront} rotateY={showFront ? '0deg' : '180deg'} style={styles.cardFront}>
                <FrontCard card={{ rank, suit }} />
            </AnimatedCardFace>
            <AnimatedCardFace isVisible={!showFront} rotateY={showFront ? '-180deg' : '0deg'} style={styles.cardBack}>
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
