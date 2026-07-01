import { useMemo, useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
	SafeAreaView,
	Dimensions,
} from 'react-native';
import { useApp } from '../context/AppContext';
import SimpleLineChart from '../components/SimpleLineChart';
import { todayKey, addDays } from '../utils/calculations';

const PRIMARY = '#4F46E5';

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
	const changeLabel = netChange < 0 ? `${Math.abs(netChange).toFixed(1)} kg lost` : `${Math.abs(netChange).toFixed(1)} kg gained`;

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
					<TextInput
						style={styles.input}
						keyboardType="numeric"
						placeholder="Weight in kg"
						placeholderTextColor="#94A3B8"
						value={weightInput}
						onChangeText={setWeightInput}
					/>
					<TouchableOpacity style={styles.saveButton} onPress={onSaveWeight}>
						<Text style={styles.saveButtonText}>Save</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Weight Trend</Text>
					<SimpleLineChart data={sortedHistory} width={chartWidth} />

					{hasTrend ? (
						<View style={styles.summaryWrap}>
							<View style={styles.summaryItem}>
								<Text style={styles.summaryLabel}>Current</Text>
								<Text style={styles.summaryValue}>{Number(currentEntry?.weightKg || 0).toFixed(1)} kg</Text>
							</View>
							<View style={styles.summaryItem}>
								<Text style={styles.summaryLabel}>Starting</Text>
								<Text style={styles.summaryValue}>{Number(startingEntry?.weightKg || 0).toFixed(1)} kg</Text>
							</View>
							<View style={styles.summaryItem}>
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
		backgroundColor: '#F8FAFC',
	},
	content: {
		padding: 16,
		paddingBottom: 28,
	},
	title: {
		fontSize: 30,
		fontWeight: '800',
		color: '#0F172A',
		marginBottom: 16,
	},
	card: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 16,
		marginBottom: 14,
		shadowColor: '#0F172A',
		shadowOpacity: 0.06,
		shadowOffset: { width: 0, height: 6 },
		shadowRadius: 10,
		elevation: 2,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: '800',
		color: '#0F172A',
		marginBottom: 12,
	},
	input: {
		height: 48,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#CBD5E1',
		paddingHorizontal: 14,
		fontSize: 15,
		color: '#0F172A',
		backgroundColor: '#FFFFFF',
	},
	saveButton: {
		marginTop: 12,
		height: 48,
		borderRadius: 12,
		backgroundColor: PRIMARY,
		alignItems: 'center',
		justifyContent: 'center',
	},
	saveButtonText: {
		fontSize: 15,
		fontWeight: '800',
		color: '#FFFFFF',
	},
	summaryWrap: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 10,
		gap: 10,
		flexWrap: 'wrap',
	},
	summaryItem: {
		flexGrow: 1,
		minWidth: 92,
		padding: 10,
		borderRadius: 12,
		backgroundColor: '#F8FAFC',
		borderWidth: 1,
		borderColor: '#E2E8F0',
	},
	summaryLabel: {
		fontSize: 12,
		fontWeight: '700',
		color: '#64748B',
		marginBottom: 4,
	},
	summaryValue: {
		fontSize: 14,
		fontWeight: '800',
		color: '#0F172A',
	},
	lossText: {
		color: '#16A34A',
	},
	gainText: {
		color: '#DC2626',
	},
	hintText: {
		marginTop: 10,
		fontSize: 13,
		fontWeight: '600',
		color: '#94A3B8',
	},
	recentRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#E2E8F0',
	},
	recentDate: {
		fontSize: 14,
		fontWeight: '700',
		color: '#334155',
	},
	recentWeight: {
		fontSize: 14,
		fontWeight: '800',
		color: '#0F172A',
	},
	profileHint: {
		textAlign: 'center',
		fontSize: 12,
		fontWeight: '600',
		color: '#94A3B8',
		marginTop: 2,
	},
});
