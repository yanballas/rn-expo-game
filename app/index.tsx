import { StyleSheet, View } from 'react-native';

import { LoremBlock } from '@/components/lorem-block';

export default function Index() {
  return (
    <View style={styles.container}>
      <LoremBlock />
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
