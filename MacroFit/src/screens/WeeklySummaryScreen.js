import { useMemo } from 'react';
import {
	View,
	Text,
	ScrollView,
	StyleSheet,
	SafeAreaView,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { getWeekDateKeys, computeWeeklyDietBudget } from '../utils/dietBudget';
import { todayKey } from '../utils/calculations';

const PRIMARY = '#4F46E5';
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildTotals(dayLog) {
	const meals = [dayLog?.Breakfast, dayLog?.Lunch, dayLog?.Dinner, dayLog?.Snacks];
	const entries = meals.flatMap((meal) => (Array.isArray(meal) ? meal : []));

	return entries.reduce(
		(acc, item) => ({
			cal: acc.cal + (Number(item?.cal) || 0),
			protein: acc.protein + (Number(item?.protein) || 0),
			carb: acc.carb + (Number(item?.carb) || 0),
			fat: acc.fat + (Number(item?.fat) || 0),
		}),
		{ cal: 0, protein: 0, carb: 0, fat: 0 }
	);
}

function parseDateKey(dateKey) {
	const date = new Date(`${dateKey}T00:00:00`);
	return Number.isNaN(date.getTime()) ? new Date() : date;
}

function shortDayName(dateKey) {
	const date = parseDateKey(dateKey);
	return DAY_NAMES[date.getDay()];
}

function getCaloriesState(totalCalories, goalCalories, hasEntries) {
	if (!hasEntries) {
		return { color: '#94A3B8' };
	}

	if (!goalCalories || goalCalories <= 0) {
		return { color: '#94A3B8' };
	}

	const pct = (totalCalories / goalCalories) * 100;
	if (pct >= 90 && pct <= 110) {
		return { color: '#16A34A' };
	}
	if (pct >= 70 && pct <= 130) {
		return { color: '#F59E0B' };
	}
	return { color: '#DC2626' };
}

function MetricGrid({ avgCalories, avgProtein, avgCarb, avgFat }) {
	const items = [
		{ label: 'Calories', value: `${Math.round(avgCalories)} kcal` },
		{ label: 'Protein', value: `${Math.round(avgProtein)} g` },
		{ label: 'Carbs', value: `${Math.round(avgCarb)} g` },
		{ label: 'Fat', value: `${Math.round(avgFat)} g` },
	];

	return (
		<View style={styles.metricGrid}>
			{items.map((item) => (
				<View key={item.label} style={styles.metricCard}>
					<Text style={styles.metricLabel}>{item.label}</Text>
					<Text style={styles.metricValue}>{item.value}</Text>
				</View>
			))}
		</View>
	);
}

function DietBar({ used, allowed }) {
	const ratio = allowed > 0 ? Math.min(used / allowed, 1) : 0;
	return (
		<View style={styles.barTrack}>
			<View style={[styles.barFill, { width: `${ratio * 100}%` }]} />
		</View>
	);
}

export default function WeeklySummaryScreen() {
	const { logs, plan, settings } = useApp();
	const weekKeys = getWeekDateKeys();
	const weeklyBudget = computeWeeklyDietBudget(logs, settings);
	const currentToday = todayKey();

	const weeklyData = useMemo(
		() =>
			weekKeys.map((dateKey) => {
				const dayLog = logs?.[dateKey];
				const totals = buildTotals(dayLog);
				const hasEntries =
					(Boolean(dayLog?.Breakfast?.length) ||
						Boolean(dayLog?.Lunch?.length) ||
						Boolean(dayLog?.Dinner?.length) ||
						Boolean(dayLog?.Snacks?.length));

				return {
					dateKey,
					dayName: shortDayName(dateKey),
					totals,
					hasEntries,
					isToday: dateKey === currentToday,
					state: getCaloriesState(totals.cal, Number(plan?.goalCalories) || 0, hasEntries),
				};
			}),
		[logs, plan?.goalCalories, weekKeys, currentToday]
	);

	const summary = useMemo(() => {
		const loggedDays = weeklyData.filter((day) => day.hasEntries);
		const daysLoggedCount = loggedDays.length;

		if (daysLoggedCount === 0) {
			return {
				daysLoggedCount,
				avgCalories: 0,
				avgProtein: 0,
				avgCarb: 0,
				avgFat: 0,
				adherencePct: 0,
			};
		}

		const totals = loggedDays.reduce(
			(acc, day) => ({
				cal: acc.cal + day.totals.cal,
				protein: acc.protein + day.totals.protein,
				carb: acc.carb + day.totals.carb,
				fat: acc.fat + day.totals.fat,
			}),
			{ cal: 0, protein: 0, carb: 0, fat: 0 }
		);

		const avgCalories = totals.cal / daysLoggedCount;
		const avgProtein = totals.protein / daysLoggedCount;
		const avgCarb = totals.carb / daysLoggedCount;
		const avgFat = totals.fat / daysLoggedCount;
		const goalCalories = Number(plan?.goalCalories) || 0;
		const adherencePct = goalCalories > 0 ? Math.round((avgCalories / goalCalories) * 100) : 0;

		return {
			daysLoggedCount,
			avgCalories,
			avgProtein,
			avgCarb,
			avgFat,
			adherencePct,
		};
	}, [weeklyData, plan?.goalCalories]);

	const adherenceMessage = useMemo(() => {
		if (summary.daysLoggedCount === 0) {
			return { text: 'No data logged yet this week', color: '#94A3B8' };
		}

		const pct = summary.adherencePct;
		if (pct >= 90 && pct <= 110) {
			return { text: 'Right on track! 🎯', color: '#16A34A' };
		}
		if ((pct >= 70 && pct <= 89) || (pct >= 111 && pct <= 130)) {
			return { text: 'Getting close, adjust a bit', color: '#F59E0B' };
		}
		return { text: 'Way off target this week', color: '#DC2626' };
	}, [summary.adherencePct, summary.daysLoggedCount]);

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<Text style={styles.title}>Weekly Summary</Text>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>This Week's Averages</Text>
					<MetricGrid
						avgCalories={summary.avgCalories}
						avgProtein={summary.avgProtein}
						avgCarb={summary.avgCarb}
						avgFat={summary.avgFat}
					/>
					<Text style={styles.daysLoggedText}>{summary.daysLoggedCount}/7 days logged</Text>
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Calorie Adherence</Text>
					{summary.daysLoggedCount === 0 ? (
						<Text style={[styles.adherenceMessage, { color: adherenceMessage.color }]}>
							{adherenceMessage.text}
						</Text>
					) : (
						<View>
							<Text style={[styles.adherencePct, { color: adherenceMessage.color }]}>
								{summary.adherencePct}%
							</Text>
							<Text style={[styles.adherenceMessage, { color: adherenceMessage.color }]}>
								{adherenceMessage.text}
							</Text>
						</View>
					)}
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Diet Budget This Week</Text>
					{settings?.pureVegMode ? (
						<Text style={styles.vegModeText}>🌱 Pure Veg Mode active all week</Text>
					) : (
						<View style={styles.budgetWrap}>
							<View style={styles.budgetItem}>
								<View style={styles.budgetHeaderRow}>
									<Text style={styles.budgetLabel}>Eggs: {weeklyBudget.eggUsed}/{weeklyBudget.eggAllowed} days used</Text>
								</View>
								<DietBar used={weeklyBudget.eggUsed} allowed={weeklyBudget.eggAllowed} />
							</View>
							<View style={styles.budgetItem}>
								<View style={styles.budgetHeaderRow}>
									<Text style={styles.budgetLabel}>Non-veg: {weeklyBudget.nonvegUsed}/{weeklyBudget.nonvegAllowed} days used</Text>
								</View>
								<DietBar used={weeklyBudget.nonvegUsed} allowed={weeklyBudget.nonvegAllowed} />
							</View>
						</View>
					)}
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Day by Day</Text>
					{weeklyData.map((day) => (
						<View key={day.dateKey} style={styles.dayRow}>
							<View style={styles.dayLeft}>
								<View style={[styles.dot, { backgroundColor: day.state.color }]} />
								<View>
									<Text style={styles.dayName}>{day.dayName}</Text>
									<Text style={styles.dayDate}>{day.isToday ? 'Today' : day.dateKey}</Text>
								</View>
							</View>
							<Text style={styles.dayCalories}>{Math.round(day.totals.cal)} kcal</Text>
						</View>
					))}
				</View>
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
	metricGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
	},
	metricCard: {
		width: '48%',
		padding: 12,
		borderRadius: 12,
		backgroundColor: '#F8FAFC',
		borderWidth: 1,
		borderColor: '#E2E8F0',
	},
	metricLabel: {
		fontSize: 12,
		fontWeight: '700',
		color: '#64748B',
		marginBottom: 6,
	},
	metricValue: {
		fontSize: 15,
		fontWeight: '800',
		color: '#0F172A',
	},
	daysLoggedText: {
		marginTop: 12,
		fontSize: 13,
		fontWeight: '600',
		color: '#64748B',
	},
	adherencePct: {
		fontSize: 40,
		fontWeight: '900',
		color: PRIMARY,
	},
	adherenceMessage: {
		marginTop: 4,
		fontSize: 14,
		fontWeight: '700',
	},
	vegModeText: {
		fontSize: 14,
		fontWeight: '700',
		color: '#047857',
	},
	budgetWrap: {
		gap: 12,
	},
	budgetItem: {
		gap: 8,
	},
	budgetHeaderRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	budgetLabel: {
		fontSize: 13,
		fontWeight: '700',
		color: '#334155',
	},
	barTrack: {
		height: 10,
		borderRadius: 999,
		backgroundColor: '#E2E8F0',
		overflow: 'hidden',
	},
	barFill: {
		height: '100%',
		backgroundColor: PRIMARY,
		borderRadius: 999,
	},
	dayRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#E2E8F0',
	},
	dayLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	dot: {
		width: 10,
		height: 10,
		borderRadius: 5,
	},
	dayName: {
		fontSize: 14,
		fontWeight: '800',
		color: '#0F172A',
	},
	dayDate: {
		fontSize: 12,
		fontWeight: '600',
		color: '#94A3B8',
		marginTop: 2,
	},
	dayCalories: {
		fontSize: 14,
		fontWeight: '800',
		color: '#0F172A',
	},
});
