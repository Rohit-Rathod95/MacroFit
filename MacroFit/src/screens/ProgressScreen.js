import { useMemo, useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
	Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import SimpleLineChart from '../components/SimpleLineChart';
import { todayKey, addDays } from '../utils/calculations';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

function formatDateLabel(date) {
	if (!date) {
		return '';
	}

	const today = todayKey();
	const yesterday = todayKey(addDays(new Date(), -1));
	if (date === today) {
		return 'Today';
	}
	if (date === yesterday) {
		return 'Yesterday';
	}
	return date;
}

export default function ProgressScreen() {
	const { weightHistory, logWeight, profile } = useApp();
	const [weightInput, setWeightInput] = useState('');
	const chartWidth = Dimensions.get('window').width - 64;

	const sortedHistory = useMemo(
		() => (Array.isArray(weightHistory) ? [...weightHistory] : []).sort((a, b) => String(a.date).localeCompare(String(b.date))),
		[weightHistory]
	);

	const currentEntry = sortedHistory[sortedHistory.length - 1] || null;
	const startingEntry = sortedHistory[0] || null;
	const hasTrend = sortedHistory.length >= 2;
	const netChange = hasTrend
		? (Number(currentEntry?.weightKg) || 0) - (Number(startingEntry?.weightKg) || 0)
		: 0;

	const onSaveWeight = async () => {
		const parsed = Number(weightInput);
		if (!Number.isFinite(parsed) || parsed <= 0) {
			return;
		}

		await logWeight(parsed);
		setWeightInput('');
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<Text style={styles.title}>Progress</Text>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Log Today's Weight</Text>
					<View style={styles.inputGroup}>
						<TextInput
							style={styles.combinedInput}
							keyboardType="numeric"
							placeholder="Weight in kg"
							placeholderTextColor={theme.colors.textMuted}
							value={weightInput}
							onChangeText={setWeightInput}
						/>
						<TouchableOpacity style={styles.combinedSaveButton} onPress={onSaveWeight}>
							<Ionicons name="checkmark" size={20} color="#FFFFFF" />
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Weight Trend</Text>
					<SimpleLineChart data={sortedHistory} width={chartWidth} />

					{hasTrend ? (
						<View style={styles.summaryWrap}>
							<View style={styles.summaryCardItem}>
								<Ionicons name="body-outline" size={16} color={theme.colors.primary} style={styles.statIcon} />
								<Text style={styles.summaryLabel}>Current</Text>
								<Text style={styles.summaryValue}>{Number(currentEntry?.weightKg || 0).toFixed(1)} kg</Text>
							</View>
							<View style={styles.summaryCardItem}>
								<Ionicons name="flag-outline" size={16} color={theme.colors.primary} style={styles.statIcon} />
								<Text style={styles.summaryLabel}>Starting</Text>
								<Text style={styles.summaryValue}>{Number(startingEntry?.weightKg || 0).toFixed(1)} kg</Text>
							</View>
							<View style={styles.summaryCardItem}>
								<Ionicons
									name={netChange <= 0 ? 'trending-down-outline' : 'trending-up-outline'}
									size={16}
									color={netChange <= 0 ? theme.colors.accent : theme.colors.danger}
									style={styles.statIcon}
								/>
								<Text style={styles.summaryLabel}>Net Change</Text>
								<Text
									style={[
										styles.summaryValue,
										netChange <= 0 ? styles.lossText : styles.gainText,
									]}
								>
									{Math.abs(netChange).toFixed(1)} kg {netChange < 0 ? 'lost' : 'gained'}
								</Text>
							</View>
						</View>
					) : (
						<Text style={styles.hintText}>Log at least 2 weigh-ins to see your trend</Text>
					)}
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Recent Entries</Text>
					{sortedHistory.slice(-7).reverse().map((item) => (
						<View key={item.date} style={styles.recentRow}>
							<Text style={styles.recentDate}>{formatDateLabel(item.date)}</Text>
							<Text style={styles.recentWeight}>{Number(item.weightKg || 0).toFixed(1)} kg</Text>
						</View>
					))}
					{sortedHistory.length === 0 ? (
						<Text style={styles.hintText}>No weight entries yet</Text>
					) : null}
				</View>

				{profile?.weightKg ? (
					<Text style={styles.profileHint}>
						Profile weight: {Number(profile.weightKg).toFixed(1)} kg
					</Text>
				) : null}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	content: {
		padding: theme.spacing.md,
		paddingBottom: theme.spacing.xl,
	},
	title: {
		...theme.typography.h1,
		color: theme.colors.textPrimary,
		marginBottom: theme.spacing.md,
	},
	card: {
		backgroundColor: theme.colors.surface,
		borderRadius: theme.radius.lg,
		padding: theme.spacing.md,
		marginBottom: theme.spacing.md,
		...theme.shadow.card,
	},
	cardTitle: {
		...theme.typography.h2,
		color: theme.colors.textPrimary,
		marginBottom: theme.spacing.sm,
	},
	inputGroup: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 48,
		borderRadius: theme.radius.pill,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.surface,
		overflow: 'hidden',
		marginTop: theme.spacing.xs,
	},
	combinedInput: {
		flex: 1,
		height: '100%',
		paddingHorizontal: theme.spacing.md,
		...theme.typography.body,
		color: theme.colors.textPrimary,
	},
	combinedSaveButton: {
		width: 48,
		height: '100%',
		backgroundColor: theme.colors.primary,
		alignItems: 'center',
		justifyContent: 'center',
	},
	summaryWrap: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: theme.spacing.md,
		gap: theme.spacing.sm,
	},
	summaryCardItem: {
		flex: 1,
		minWidth: 85,
		paddingVertical: theme.spacing.sm,
		paddingHorizontal: theme.spacing.xs,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.surface,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: theme.colors.border,
		...theme.shadow.card,
	},
	statIcon: {
		marginBottom: theme.spacing.xs,
	},
	summaryLabel: {
		...theme.typography.caption,
		color: theme.colors.textSecondary,
		marginBottom: 2,
		textAlign: 'center',
	},
	summaryValue: {
		fontSize: 12,
		fontWeight: '800',
		color: theme.colors.textPrimary,
		textAlign: 'center',
	},
	lossText: {
		color: theme.colors.accent,
	},
	gainText: {
		color: theme.colors.danger,
	},
	hintText: {
		marginTop: theme.spacing.sm,
		...theme.typography.body,
		color: theme.colors.textMuted,
	},
	recentRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: theme.spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	recentDate: {
		...theme.typography.body,
		fontWeight: '700',
		color: theme.colors.textSecondary,
	},
	recentWeight: {
		...theme.typography.body,
		fontWeight: '800',
		color: theme.colors.textPrimary,
	},
	profileHint: {
		textAlign: 'center',
		...theme.typography.caption,
		color: theme.colors.textMuted,
		marginTop: theme.spacing.xs,
	},
});
