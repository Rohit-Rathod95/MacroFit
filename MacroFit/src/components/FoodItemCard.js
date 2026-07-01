import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';

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
		backgroundColor: theme.colors.surface,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: theme.spacing.md,
		marginTop: theme.spacing.sm,
		...theme.shadow.card,
	},
	topRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	nameWrap: {
		flex: 1,
		paddingRight: theme.spacing.sm,
	},
	name: {
		...theme.typography.body,
		fontWeight: '700',
		color: theme.colors.textPrimary,
	},
	meta: {
		marginTop: theme.spacing.xs,
		...theme.typography.caption,
		color: theme.colors.textSecondary,
	},
	deleteButton: {
		paddingVertical: theme.spacing.xs,
		paddingHorizontal: theme.spacing.sm,
		borderRadius: theme.radius.sm,
		backgroundColor: '#FEE2E2',
	},
	deleteText: {
		...theme.typography.caption,
		fontWeight: '700',
		color: theme.colors.danger,
	},
	macros: {
		marginTop: theme.spacing.sm,
		...theme.typography.caption,
		fontWeight: '600',
		color: theme.colors.textSecondary,
	},
});
