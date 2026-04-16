import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FullCard } from '@/client/components/Card/FullCard';

export default function Index() {
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
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
