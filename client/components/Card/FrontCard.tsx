import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import Hearts from '../../assets/svg/card_suits_1.svg';
import Diamonds from '../../assets/svg/card_suits_2.svg';
import Clubs from '../../assets/svg/card_suits_3.svg';
import Spades from '../../assets/svg/card_suits_4.svg';

import HighCardJ from '../../assets/svg/img_j.svg';
import HighCardK from '../../assets/svg/img_k.svg';
import HighCardQ from '../../assets/svg/img_q.svg';

import { cardStyles, colors } from '@/client/utils/constants';
import { FrontCard as FrontCardType } from '@/client/utils/types';

import { Background } from '@/client/components/Background';

import bgWalpaperPng from '@/client/assets/images/card/bg_walpaper_0.png';

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

const highCardIcons: Partial<Record<FrontCardType['rank'], ComponentType<SvgProps>>> = {
    J: HighCardJ,
    Q: HighCardQ,
    K: HighCardK,
};

const highCards = new Set(['J', 'Q', 'K']);

export function FrontCard({ card: { rank, suit } }: { card: FrontCardType }) {
    const SuitIcon = suitIcons[suit];
    const cardColor = rankColorBySuit[suit];

    const isHighCard = highCards.has(rank);
    const HighCardIcon = highCardIcons[rank];

    return (
        <View style={styles.container}>
            <Background source={bgWalpaperPng} />
            <View style={styles.content}>
                <View style={[styles.rankContainer, styles.rankContainerTop]}>
                    <Text style={[styles.rankText, { color: cardColor }]}>{rank.toUpperCase()}</Text>
                    {isHighCard && (
                        <View style={styles.rankImg}>
                            <SuitIcon
                                width="100%"
                                height="100%"
                                color={cardColor}
                                preserveAspectRatio="xMidYMid meet"
                            />
                        </View>
                    )}
                </View>

                {isHighCard && HighCardIcon ? (
                    <View style={styles.characterContainer}>
                        <HighCardIcon
                            width="100%"
                            height="100%"
                            color={cardColor}
                            preserveAspectRatio="xMidYMid meet"
                        />
                    </View>
                ) : (
                    <View style={styles.suitContainer}>
                        <SuitIcon width="100%" height="100%" color={cardColor} preserveAspectRatio="xMidYMid meet" />
                    </View>
                )}

                <View style={[styles.rankContainer, styles.rankContainerBottom]}>
                    {isHighCard && (
                        <View style={styles.rankImg}>
                            <SuitIcon
                                width="100%"
                                height="100%"
                                color={cardColor}
                                preserveAspectRatio="xMidYMid meet"
                            />
                        </View>
                    )}
                    <Text style={[styles.rankText, { color: cardColor }]}>{rank.toUpperCase()}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: cardStyles.width,
        height: cardStyles.height,
        borderRadius: cardStyles.borderRadius,
        overflow: cardStyles.overflow,
    },
    content: {
        flex: 1,
        position: 'relative',
    },
    rankContainer: {
        position: 'absolute',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rankContainerTop: {
        top: 6,
        left: 6,
    },
    rankContainerBottom: {
        bottom: 6,
        right: 6,
    },
    rankText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    rankImg: {
        width: 8,
        height: 8,
    },
    suitContainer: {
        width: 28,
        height: 28,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    },
    characterContainer: {
        width: 55,
        height: 72,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    },
});
