import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StreakBadge({ count = 0 }) {
	return (
		<View style={styles.badge}>
			<Text style={styles.text}>🔥 {count} day streak</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	badge: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 16,
		backgroundColor: '#EEF2FF',
		borderWidth: 1,
		borderColor: '#C7D2FE',
	},
	text: {
		fontSize: 13,
		fontWeight: '700',
		color: '#3730A3',
	},
});
