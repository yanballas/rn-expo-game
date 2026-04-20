import { cardStyles } from '@/client/utils/constants';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

export function BackCard() {
    const imageSource = require('@/client/assets/images/cardBack.png');

    return (
        <View style={styles.container}>
            <Image source={imageSource} style={styles.image} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: cardStyles.width,
        height: cardStyles.height,
        borderRadius: cardStyles.borderRadius,
        overflow: cardStyles.overflow,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
});
