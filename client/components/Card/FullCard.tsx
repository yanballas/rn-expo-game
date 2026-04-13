import { StyleSheet, View } from 'react-native';

import { BackCard } from './BackCard';
import { FrontCard } from './FrontCard';

import { cardStyles } from '@/utils/constants';
import { FullCard as FullCardType } from '@/utils/types';

export function FullCard({ card: { rank, suit, isHidden = false } }: { card: FullCardType }) {
    return (
        <View style={styles.container}>
            <View style={styles.cardAbsolute}>
                <FrontCard card={{ rank, suit }} />
            </View>
            {isHidden && (
                <View style={styles.cardAbsolute}>
                    <BackCard />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: cardStyles.width,
        height: cardStyles.height,
        overflow: cardStyles.overflow,
    },
    cardAbsolute: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
});
