import { Image } from 'expo-image';
import { ImageStyle, StyleSheet } from 'react-native';

import { BackgroundProps } from '@/client/utils/types';

const styles = StyleSheet.create({
    image: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
    },
});

export function Background({ source, contentFit = 'cover', style }: BackgroundProps) {
    return <Image source={source} style={[styles.image, style as ImageStyle]} contentFit={contentFit} />;
}
