import { cardStyles } from '@/client/utils/constants';
import { StyleSheet, View } from 'react-native';

import { Background } from '@/client/components/Background';

export function BackCard() {
    const bgWalpaperPng = require('@/client/assets/images/card/bg_walpaper_1.png');
    const bgBackCardPng = require('@/client/assets/images/card/bg_back_card_0.png');

    return (
        <View style={styles.container}>
            <Background source={bgWalpaperPng} />
            <Background source={bgBackCardPng} style={styles.backgroundBackCard} />
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
    backgroundBackCard: {
        width: '90%',
        height: '90%',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
        borderRadius: cardStyles.borderRadius - 6,
    },
});
