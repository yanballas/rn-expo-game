import { StyleSheet, Text } from 'react-native';

const LOREM_TEXT =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';

export function LoremBlock() {
  return <Text style={styles.text}>{LOREM_TEXT}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
});
