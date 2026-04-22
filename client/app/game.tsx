import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Background } from '@/client/components/Background';
import { FullCard } from '@/client/components/Card/FullCard';

import bgItemsPng from '@/client/assets/images/background/bg_items.png';
import bgMainPng from '@/client/assets/images/background/bg_main.png';
import bgPatternPng from '@/client/assets/images/background/bg_pattern.png';
import { colors } from '@/client/utils/constants';

export default function GameScreen() {
    const router = useRouter();
    const [isFlipped, setIsFlipped] = useState(true);

    const handleAnimatePress = () => {
        setIsFlipped(currentValue => !currentValue);
    };

    return (
        <View style={styles.container}>
            <Background source={bgMainPng} />
            <Background source={bgItemsPng} />
            <Image source={bgPatternPng} style={styles.backgroundImagePattern} contentFit="contain" />
            <FullCard card={{ rank: 'K', suit: 'clubs', isFlipped }} />
            <Pressable onPress={handleAnimatePress} style={styles.button}>
                <Text style={styles.buttonText}>Flip card</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.backButton]} onPress={() => router.push({ pathname: '/menu' })}>
                <Text style={styles.buttonText}>Назад в меню</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        backgroundColor: colors.background,
    },
    backgroundImagePattern: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
        width: 210,
        height: 210,
    },
    button: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#1f2937',
    },
    backButton: {
        marginTop: 20,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
