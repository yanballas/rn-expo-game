import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import Clubs from '../../assets/svg/clubs.svg';
import Diamonds from '../../assets/svg/diamonds.svg';
import Hearts from '../../assets/svg/hearts.svg';
import Spades from '../../assets/svg/spades.svg';

import { cardStyles, colors } from '@/client/utils/constants';
import { FrontCard as FrontCardType } from '@/client/utils/types';

const rankColorBySuit: Record<FrontCardType['suit'], string> = {
    hearts: colors.red,
    diamonds: colors.red,
    clubs: colors.black,
    spades: colors.black,
};

const suitIcons: Record<FrontCardType['suit'], ComponentType<SvgProps>> = {
    hearts: Hearts,
    diamonds: Diamonds,
    clubs: Clubs,
    spades: Spades,
};

export function FrontCard({ card: { rank, suit } }: { card: FrontCardType }) {
    const SuitIcon = suitIcons[suit];
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={[styles.rank, { color: rankColorBySuit[suit] }]}>{rank}</Text>
                <View style={styles.suitContainer}>
                    <SuitIcon width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />
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
});
