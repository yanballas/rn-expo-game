import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

export default function MenuScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Blackjack Game</Text>
            <View style={styles.buttonsContainer}>
                <Pressable style={styles.button} onPress={() => router.push({ pathname: '/game' })}>
                    <Text style={styles.buttonText}>Играть</Text>
                </Pressable>
                <Pressable style={styles.button} onPress={() => router.push({ pathname: '/settings' })}>
                    <Text style={styles.buttonText}>Настройки</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 40,
    },
    buttonsContainer: {
        gap: 20,
        width: '80%',
    },
    button: {
        backgroundColor: '#1f2937',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
});
