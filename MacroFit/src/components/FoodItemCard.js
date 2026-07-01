import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function FoodItemCard({ item, onDelete }) {
	const quantity = Number(item?.quantity);
	const showQuantity = Number.isFinite(quantity) && quantity > 0;

	return (
		<View style={styles.card}>
			<View style={styles.topRow}>
				<View style={styles.nameWrap}>
					<Text style={styles.name}>{item?.name || 'Food item'}</Text>
					{showQuantity ? (
						<Text style={styles.meta}>
							Qty: {quantity} {item?.unit || ''}
						</Text>
					) : null}
				</View>
				<TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
					<Text style={styles.deleteText}>Delete</Text>
				</TouchableOpacity>
			</View>
			<Text style={styles.macros}>
				{Math.round(Number(item?.cal) || 0)} kcal  |  P {Math.round(Number(item?.protein) || 0)}g  |  C {Math.round(Number(item?.carb) || 0)}g  |  F {Math.round(Number(item?.fat) || 0)}g
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#E2E8F0',
		padding: 12,
		marginTop: 8,
	},
	topRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	nameWrap: {
		flex: 1,
		paddingRight: 8,
	},
	name: {
		fontSize: 14,
		fontWeight: '700',
		color: '#0F172A',
	},
	meta: {
		marginTop: 2,
		fontSize: 12,
		color: '#64748B',
	},
	deleteButton: {
		paddingVertical: 5,
		paddingHorizontal: 9,
		borderRadius: 8,
		backgroundColor: '#FEE2E2',
	},
	deleteText: {
		fontSize: 12,
		fontWeight: '700',
		color: '#B91C1C',
	},
	macros: {
		marginTop: 8,
		fontSize: 12,
		fontWeight: '600',
		color: '#334155',
	},
});
