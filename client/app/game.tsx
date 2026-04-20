import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';
import { useState } from 'react';

import { FullCard } from '@/client/components/Card/FullCard';

export default function GameScreen() {
    const router = useRouter();
    const [isFlipped, setIsFlipped] = useState(true);

    const handleAnimatePress = () => {
        setIsFlipped(currentValue => !currentValue);
    };

    return (
        <View style={styles.container}>
            <FullCard card={{ rank: 'A', suit: 'hearts', isFlipped }} />
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
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
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
