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

const PRIMARY = '#4F46E5';
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

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

					<View style={styles.summaryCard}>
						<Text style={styles.summaryMain}>
							{Math.round(totals.cal)} / {Math.round(goalCalories)} kcal
						</Text>
						{remainingCalories >= 0 ? (
							<Text style={styles.summarySub}>
								{Math.round(remainingCalories)} kcal remaining
							</Text>
						) : (
							<Text style={[styles.summarySub, styles.overText]}>
								{Math.round(Math.abs(remainingCalories))} over
							</Text>
						)}
					</View>

					<View style={styles.card}>
						<MacroProgressBar
							label="Calories"
							current={totals.cal}
							target={plan?.goalCalories || 0}
							unit="kcal"
						/>
						<MacroProgressBar
							label="Protein"
							current={totals.protein}
							target={plan?.proteinG || 0}
							unit="g"
						/>
						<MacroProgressBar
							label="Carbs"
							current={totals.carb}
							target={plan?.carbG || 0}
							unit="g"
						/>
						<MacroProgressBar
							label="Fat"
							current={totals.fat}
							target={plan?.fatG || 0}
							unit="g"
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
								<Text style={styles.mealTitle}>{mealType}</Text>
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
					<Text style={styles.fabText}>+ Add Food</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#F8FAFC',
	},
	container: {
		flex: 1,
	},
	contentContainer: {
		padding: 16,
		paddingBottom: 96,
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 14,
	},
	headerActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	title: {
		fontSize: 28,
		fontWeight: '800',
		color: '#0F172A',
	},
	weeklyButton: {
		paddingVertical: 4,
		paddingHorizontal: 2,
	},
	weeklyButtonText: {
		fontSize: 13,
		fontWeight: '800',
		color: '#4F46E5',
	},
	summaryCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 16,
		marginBottom: 14,
		shadowColor: '#0F172A',
		shadowOpacity: 0.08,
		shadowOffset: { width: 0, height: 6 },
		shadowRadius: 12,
		elevation: 2,
	},
	summaryMain: {
		fontSize: 28,
		fontWeight: '800',
		color: '#111827',
	},
	summarySub: {
		marginTop: 6,
		fontSize: 14,
		fontWeight: '600',
		color: '#64748B',
	},
	overText: {
		color: '#DC2626',
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
	chipRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 12,
	},
	chip: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: '#EEF2FF',
		borderWidth: 1,
		borderColor: '#C7D2FE',
	},
	pureVegChip: {
		backgroundColor: '#ECFDF5',
		borderColor: '#A7F3D0',
	},
	chipText: {
		fontSize: 12,
		fontWeight: '700',
		color: '#3730A3',
	},
	pureVegChipText: {
		color: '#047857',
	},
	mealSection: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 14,
		marginBottom: 12,
		shadowColor: '#0F172A',
		shadowOpacity: 0.05,
		shadowOffset: { width: 0, height: 5 },
		shadowRadius: 10,
		elevation: 1,
	},
	mealTitle: {
		fontSize: 16,
		fontWeight: '800',
		color: '#1E293B',
	},
	emptyText: {
		marginTop: 8,
		fontSize: 13,
		color: '#94A3B8',
	},
	fab: {
		position: 'absolute',
		right: 16,
		bottom: 16,
		backgroundColor: PRIMARY,
		borderRadius: 999,
		paddingHorizontal: 18,
		paddingVertical: 14,
		shadowColor: '#312E81',
		shadowOpacity: 0.3,
		shadowOffset: { width: 0, height: 8 },
		shadowRadius: 12,
		elevation: 5,
	},
	fabText: {
		fontSize: 15,
		fontWeight: '800',
		color: '#FFFFFF',
	},
});

