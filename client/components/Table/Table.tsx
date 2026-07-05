import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { BackCard } from '@/client/components/Card/BackCard';
import { useGameStore } from '@/client/store';
import { cardStyles, deckCardOriginInset, deckPosition, deckStackOffset } from '@/client/utils/constants';

import { TableCard } from './TableCard';

export function Table() {
    const deckRef = useRef<View>(null);
    const entities = useGameStore(store => store.entities);

    const handleDeckLayout = () => {
        deckRef.current?.measureInWindow((x: number, y: number) => {
            useGameStore.getState().setDeckPosition({ x, y });
        });
    };

    return (
        <View style={styles.wrapper}>
            <View ref={deckRef} style={styles.tableAnchor} onLayout={handleDeckLayout}>
                <View style={[styles.stackCard, styles.stackCard1]}>
                    <BackCard />
                </View>
                <View style={[styles.stackCard, styles.stackCard2]}>
                    <BackCard />
                </View>
                <View style={[styles.stackCard, styles.stackCard3]}>
                    <BackCard />
                </View>
                {entities.map(entity => (
                    <TableCard key={entity.id} entity={entity} />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 0,
        width: '100%',
        height: '100%',
        right: 0,
        top: 0,
        bottom: 0,
        pointerEvents: 'none',
    },
    tableAnchor: {
        position: 'absolute',
        left: deckPosition.left,
        top: deckPosition.top,
        width: cardStyles.width,
        height: cardStyles.height,
    },
    stackCard: {
        position: 'absolute',
        width: cardStyles.width,
        height: cardStyles.height,
        borderRadius: cardStyles.borderRadius,
        overflow: cardStyles.overflow,
    },
    stackCard1: {
        transform: [{ rotate: '-4deg' }],
        zIndex: 1,
    },
    stackCard2: {
        top: deckStackOffset,
        left: deckStackOffset,
        transform: [{ rotate: '2deg' }],
        zIndex: 2,
    },
    stackCard3: {
        top: deckCardOriginInset,
        left: deckCardOriginInset,
        zIndex: 3,
    },
});
