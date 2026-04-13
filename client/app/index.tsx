import { StyleSheet, View } from 'react-native';

import { FullCard } from '@/client/components/Card/FullCard';

export default function Index() {
    return (
        <View style={styles.container}>
            <FullCard card={{ rank: 'A', suit: 'hearts' }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
});
