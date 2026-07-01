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
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../theme/theme';

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
						<Text style={[styles.adherenceMessageText, { color: adherenceMessage.color }]}>
							{adherenceMessage.text}
						</Text>
					) : (
						<View style={styles.adherenceContainer}>
							<View style={styles.adherenceRingContainer}>
								<Svg width={120} height={120}>
									<Circle
										cx="60"
										cy="60"
										r="48"
										stroke={theme.colors.border}
										strokeWidth="8"
										fill="transparent"
									/>
									<Circle
										cx="60"
										cy="60"
										r="48"
										stroke={adherenceMessage.color}
										strokeWidth="8"
										fill="transparent"
										strokeDasharray={`${2 * Math.PI * 48}`}
										strokeDashoffset={
											2 * Math.PI * 48 * (1 - Math.min(summary.adherencePct / 100, 1))
										}
										strokeLinecap="round"
										rotation="-90"
										originX="60"
										originY="60"
									/>
								</Svg>
								<View style={styles.adherenceTextContainer}>
									<Text style={[styles.adherencePctText, { color: adherenceMessage.color }]}>
										{summary.adherencePct}%
									</Text>
								</View>
							</View>
							<Text style={[styles.adherenceMessageText, { color: adherenceMessage.color }]}>
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
								<View style={styles.verticalBarTrack}>
									<View
										style={[
											styles.verticalBarFill,
											{
												height: `${(plan?.goalCalories > 0 ? Math.min(day.totals.cal / plan.goalCalories, 1) : 0) * 100}%`,
												backgroundColor: day.state.color,
											},
										]}
									/>
								</View>
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
	metricGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: theme.spacing.sm,
	},
	metricCard: {
		width: '48%',
		padding: theme.spacing.sm,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.primaryLight,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	metricLabel: {
		...theme.typography.caption,
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.xs,
	},
	metricValue: {
		...theme.typography.body,
		fontWeight: '800',
		color: theme.colors.textPrimary,
	},
	daysLoggedText: {
		marginTop: theme.spacing.sm,
		...theme.typography.caption,
		color: theme.colors.textSecondary,
	},
	adherenceContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: theme.spacing.sm,
	},
	adherenceRingContainer: {
		position: 'relative',
		width: 120,
		height: 120,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: theme.spacing.md,
	},
	adherenceTextContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
	},
	adherencePctText: {
		fontSize: 24,
		fontWeight: '900',
	},
	adherenceMessageText: {
		...theme.typography.body,
		fontWeight: '700',
		textAlign: 'center',
	},
	vegModeText: {
		...theme.typography.body,
		fontWeight: '700',
		color: '#047857',
	},
	budgetWrap: {
		gap: theme.spacing.sm,
	},
	budgetItem: {
		gap: theme.spacing.xs,
	},
	budgetHeaderRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	budgetLabel: {
		...theme.typography.body,
		fontWeight: '700',
		color: theme.colors.textSecondary,
	},
	barTrack: {
		height: 10,
		borderRadius: theme.radius.pill,
		backgroundColor: theme.colors.border,
		overflow: 'hidden',
	},
	barFill: {
		height: '100%',
		backgroundColor: theme.colors.primary,
		borderRadius: theme.radius.pill,
	},
	dayRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: theme.spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	dayLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: theme.spacing.sm,
	},
	verticalBarTrack: {
		width: 8,
		height: 36,
		borderRadius: 4,
		backgroundColor: theme.colors.border,
		justifyContent: 'flex-end',
		overflow: 'hidden',
	},
	verticalBarFill: {
		width: '100%',
		borderRadius: 4,
	},
	dayName: {
		...theme.typography.body,
		fontWeight: '800',
		color: theme.colors.textPrimary,
	},
	dayDate: {
		...theme.typography.caption,
		color: theme.colors.textSecondary,
		marginTop: 2,
	},
	dayCalories: {
		...theme.typography.body,
		fontWeight: '800',
		color: theme.colors.textPrimary,
	},
});
