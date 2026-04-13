import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { cardStyles, colors } from '@/utils/constants';
import { FrontCard as FrontCardType } from '@/utils/types';

const rankColorBySuit: Record<FrontCardType['suit'], string> = {
    hearts: colors.red,
    diamonds: colors.red,
    clubs: colors.black,
    spades: colors.black,
};

const suitSources = {
    hearts: require('@/client/assets/svg/hearts.svg'),
    diamonds: require('@/client/assets/svg/diamonds.svg'),
    clubs: require('@/client/assets/svg/clubs.svg'),
    spades: require('@/client/assets/svg/spades.svg'),
};

export function FrontCard({ card: { rank, suit } }: { card: FrontCardType }) {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={[styles.rank, { color: rankColorBySuit[suit] }]}>{rank}</Text>
                <View style={styles.suitContainer}>
                    <Image source={suitSources[suit]} style={styles.suit} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        width: cardStyles.width,
        height: cardStyles.height,
        borderRadius: cardStyles.borderRadius,
        borderWidth: cardStyles.borderWidth,
        borderColor: cardStyles.borderColor,
        padding: cardStyles.padding,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rank: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    suitContainer: {
        width: 24,
        flexShrink: 0,
        height: 24,
    },
    suit: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
});
