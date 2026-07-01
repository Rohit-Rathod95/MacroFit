import React from 'react';
import {
	SafeAreaView,
	View,
	Text,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import MacroProgressBar from '../components/MacroProgressBar';
import StreakBadge from '../components/StreakBadge';
import FoodItemCard from '../components/FoodItemCard';
import { todayKey } from '../utils/calculations';
import { computeWeeklyDietBudget } from '../utils/dietBudget';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../theme/theme';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const MEAL_ICONS = {
	Breakfast: 'sunny-outline',
	Lunch: 'restaurant-outline',
	Dinner: 'moon-outline',
	Snacks: 'cafe-outline',
};

const EMPTY_DAY_LOG = {
	Breakfast: [],
	Lunch: [],
	Dinner: [],
	Snacks: [],
};

export default function HomeScreen() {
	const navigation = useNavigation();
	const { plan, logs, streak, settings, removeFoodEntry } = useApp();
	const today = todayKey();
	const todayLog = logs?.[today] || EMPTY_DAY_LOG;
	const weeklyBudget = computeWeeklyDietBudget(logs || {}, settings || {});

	const allItems = MEAL_TYPES.flatMap((mealType) => todayLog?.[mealType] || []);
	const totals = allItems.reduce(
		(acc, item) => ({
			cal: acc.cal + (Number(item?.cal) || 0),
			protein: acc.protein + (Number(item?.protein) || 0),
			carb: acc.carb + (Number(item?.carb) || 0),
			fat: acc.fat + (Number(item?.fat) || 0),
		}),
		{ cal: 0, protein: 0, carb: 0, fat: 0 }
	);

	const goalCalories = Number(plan?.goalCalories) || 0;
	const remainingCalories = goalCalories - totals.cal;

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<ScrollView
					contentContainerStyle={styles.contentContainer}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.headerRow}>
						<Text style={styles.title}>Today</Text>
						<View style={styles.headerActions}>
							<StreakBadge count={streak?.count || 0} />
							<TouchableOpacity
								style={styles.weeklyButton}
								onPress={() => navigation.navigate('WeeklySummary')}
							>
								<Text style={styles.weeklyButtonText}>Weekly →</Text>
							</TouchableOpacity>
						</View>
					</View>

					<LinearGradient
						colors={[theme.colors.primary, theme.colors.primaryDark]}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={styles.summaryCard}
					>
						<View style={styles.summaryContent}>
							<View style={styles.summaryLeft}>
								<Text style={styles.summaryTitle}>Today's Calories</Text>
								<Text style={styles.summaryGoal}>
									Goal: {Math.round(goalCalories)} kcal
								</Text>
								{remainingCalories >= 0 ? (
									<Text style={styles.summarySub}>
										{Math.round(remainingCalories)} kcal remaining
									</Text>
								) : (
									<Text style={[styles.summarySub, styles.overText]}>
										{Math.round(Math.abs(remainingCalories))} kcal over
									</Text>
								)}
							</View>
							<View style={styles.summaryRight}>
								<Svg width={90} height={90}>
									<Circle
										cx="45"
										cy="45"
										r="36"
										stroke="rgba(255, 255, 255, 0.2)"
										strokeWidth="6"
										fill="transparent"
									/>
									<Circle
										cx="45"
										cy="45"
										r="36"
										stroke="#FFFFFF"
										strokeWidth="6"
										fill="transparent"
										strokeDasharray={`${2 * Math.PI * 36}`}
										strokeDashoffset={
											2 * Math.PI * 36 * (1 - Math.min(totals.cal / (goalCalories || 1), 1))
										}
										strokeLinecap="round"
										rotation="-90"
										originX="45"
										originY="45"
									/>
								</Svg>
								<View style={styles.summaryProgressTextContainer}>
									<Text style={styles.summaryProgressNumber}>
										{Math.round(totals.cal)}
									</Text>
									<Text style={styles.summaryProgressLabel}>kcal</Text>
								</View>
							</View>
						</View>
					</LinearGradient>

					<View style={styles.card}>
						<MacroProgressBar
							label="Calories"
							current={totals.cal}
							target={plan?.goalCalories || 0}
							unit="kcal"
							color={theme.colors.macroCalorie}
						/>
						<MacroProgressBar
							label="Protein"
							current={totals.protein}
							target={plan?.proteinG || 0}
							unit="g"
							color={theme.colors.macroProtein}
						/>
						<MacroProgressBar
							label="Carbs"
							current={totals.carb}
							target={plan?.carbG || 0}
							unit="g"
							color={theme.colors.macroCarb}
						/>
						<MacroProgressBar
							label="Fat"
							current={totals.fat}
							target={plan?.fatG || 0}
							unit="g"
							color={theme.colors.macroFat}
						/>
					</View>

					<View style={styles.chipRow}>
						{settings?.pureVegMode ? (
							<View style={[styles.chip, styles.pureVegChip]}>
								<Text style={[styles.chipText, styles.pureVegChipText]}>
									🌱 Pure Veg Mode Active
								</Text>
							</View>
						) : (
							<>
								<View style={styles.chip}>
									<Text style={styles.chipText}>
										🥚 Eggs: {weeklyBudget.eggUsed}/{weeklyBudget.eggAllowed} this week
									</Text>
								</View>
								<View style={styles.chip}>
									<Text style={styles.chipText}>
										🍗 Non-veg: {weeklyBudget.nonvegUsed}/{weeklyBudget.nonvegAllowed} this week
									</Text>
								</View>
							</>
						)}
					</View>

					{MEAL_TYPES.map((mealType) => {
						const mealItems = todayLog?.[mealType] || [];
						return (
							<View key={mealType} style={styles.mealSection}>
								<View style={styles.mealHeaderRow}>
									<Ionicons name={MEAL_ICONS[mealType]} size={20} color={theme.colors.primary} />
									<Text style={styles.mealTitle}>{mealType}</Text>
								</View>
								{mealItems.length === 0 ? (
									<Text style={styles.emptyText}>No items logged</Text>
								) : (
									mealItems.map((item) => (
										<FoodItemCard
											key={item?.id || `${mealType}-${item?.name}`}
											item={item}
											onDelete={() => removeFoodEntry(today, mealType, item?.id)}
										/>
									))
								)}
							</View>
						);
					})}
				</ScrollView>

				<TouchableOpacity
					style={styles.fab}
					onPress={() => navigation.navigate('AddFood')}
				>
					<Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: theme.spacing.xs }} />
					<Text style={styles.fabText}>Add Food</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	container: {
		flex: 1,
	},
	contentContainer: {
		padding: theme.spacing.md,
		paddingBottom: theme.spacing.xl * 3,
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: theme.spacing.md,
	},
	headerActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: theme.spacing.sm,
	},
	title: {
		...theme.typography.h1,
		color: theme.colors.textPrimary,
	},
	weeklyButton: {
		paddingVertical: theme.spacing.xs,
		paddingHorizontal: theme.spacing.xs,
	},
	weeklyButtonText: {
		...theme.typography.body,
		fontWeight: '700',
		color: theme.colors.primary,
	},
	summaryCard: {
		borderRadius: theme.radius.lg,
		padding: theme.spacing.lg,
		marginBottom: theme.spacing.md,
		...theme.shadow.card,
	},
	summaryContent: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	summaryLeft: {
		flex: 1,
		paddingRight: theme.spacing.md,
	},
	summaryTitle: {
		...theme.typography.body,
		fontWeight: '600',
		color: 'rgba(255, 255, 255, 0.8)',
		marginBottom: theme.spacing.xs,
	},
	summaryGoal: {
		...theme.typography.h2,
		color: '#FFFFFF',
		marginBottom: theme.spacing.xs,
	},
	summarySub: {
		...theme.typography.body,
		fontWeight: '700',
		color: '#FFFFFF',
	},
	overText: {
		color: '#FCA5A5',
	},
	summaryRight: {
		position: 'relative',
		width: 90,
		height: 90,
		justifyContent: 'center',
		alignItems: 'center',
	},
	summaryProgressTextContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
	},
	summaryProgressNumber: {
		color: '#FFFFFF',
		...theme.typography.body,
		fontWeight: '800',
	},
	summaryProgressLabel: {
		color: 'rgba(255, 255, 255, 0.7)',
		...theme.typography.caption,
		fontWeight: '600',
	},
	card: {
		backgroundColor: theme.colors.surface,
		borderRadius: theme.radius.lg,
		padding: theme.spacing.md,
		marginBottom: theme.spacing.md,
		...theme.shadow.card,
	},
	chipRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: theme.spacing.sm,
		marginBottom: theme.spacing.md,
	},
	chip: {
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		borderRadius: theme.radius.pill,
		backgroundColor: theme.colors.primaryLight,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	pureVegChip: {
		backgroundColor: '#ECFDF5',
		borderColor: '#A7F3D0',
	},
	chipText: {
		...theme.typography.caption,
		color: theme.colors.primaryDark,
	},
	pureVegChipText: {
		color: '#047857',
	},
	mealSection: {
		backgroundColor: theme.colors.surface,
		borderRadius: theme.radius.lg,
		padding: theme.spacing.md,
		marginBottom: theme.spacing.md,
		...theme.shadow.card,
	},
	mealHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: theme.spacing.sm,
	},
	mealTitle: {
		...theme.typography.h3,
		color: theme.colors.textPrimary,
		marginLeft: theme.spacing.sm,
	},
	emptyText: {
		marginTop: theme.spacing.xs,
		...theme.typography.body,
		color: theme.colors.textMuted,
	},
	fab: {
		position: 'absolute',
		right: theme.spacing.md,
		bottom: theme.spacing.md,
		backgroundColor: theme.colors.primary,
		borderRadius: theme.radius.pill,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.md,
		...theme.shadow.floating,
	},
	fabText: {
		...theme.typography.body,
		fontWeight: '700',
		color: '#FFFFFF',
	},
});
