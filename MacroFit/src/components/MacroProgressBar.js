import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PRIMARY = '#4F46E5';

export default function MacroProgressBar({ label, current = 0, target = 0, unit = '', color }) {
	const safeCurrent = Number(current) || 0;
	const safeTarget = Number(target) || 0;
	const progress = safeTarget > 0 ? Math.min(safeCurrent / safeTarget, 1) : 0;

	return (
		<View style={styles.container}>
			<View style={styles.row}>
				<Text style={styles.label}>{label}</Text>
				<Text style={styles.value}>
					{Math.round(safeCurrent)} / {Math.round(safeTarget)} {unit}
				</Text>
			</View>
			<View style={styles.track}>
				<View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: color || PRIMARY }]} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 12,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 6,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		color: '#334155',
	},
	value: {
		fontSize: 13,
		fontWeight: '600',
		color: '#64748B',
	},
	track: {
		height: 10,
		borderRadius: 6,
		backgroundColor: '#E2E8F0',
		overflow: 'hidden',
	},
	fill: {
		height: '100%',
		backgroundColor: PRIMARY,
		borderRadius: 6,
	},
});
