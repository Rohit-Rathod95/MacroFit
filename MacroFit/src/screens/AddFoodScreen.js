import { useMemo, useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	FlatList,
	StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { searchFoods, scaleFood } from '../utils/foodDatabase';
import { allowedDietTypesForToday } from '../utils/dietBudget';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const MEAL_ICONS = {
	Breakfast: 'sunny-outline',
	Lunch: 'restaurant-outline',
	Dinner: 'moon-outline',
	Snacks: 'cafe-outline',
};

const DIET_COLORS = {
	veg: theme.colors.accent,
	egg: theme.colors.warning,
	nonveg: theme.colors.danger,
};

function unitLabel(unit) {
	if (unit === 'g') {
		return 'grams';
	}
	if (unit === 'ml') {
		return 'ml';
	}
	if (unit === 'piece') {
		return 'pieces';
	}
	return unit || 'units';
}

export default function AddFoodScreen() {
	const navigation = useNavigation();
	const route = useRoute();
	const { settings, addFoodEntry } = useApp();

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedFood, setSelectedFood] = useState(null);
	const [quantity, setQuantity] = useState('');
	const [selectedMealType, setSelectedMealType] = useState(
		MEAL_TYPES.includes(route.params?.mealType) ? route.params.mealType : 'Breakfast'
	);
	const [showAllDiets, setShowAllDiets] = useState(false);

	const allowedTypes = useMemo(
		() => allowedDietTypesForToday(settings),
		[settings]
	);

	const results = useMemo(
		() => searchFoods(searchQuery, showAllDiets ? null : allowedTypes),
		[searchQuery, showAllDiets, allowedTypes]
	);

	const scaled = useMemo(
		() => (selectedFood ? scaleFood(selectedFood, Number(quantity) || 0) : null),
		[selectedFood, quantity]
	);

	const canAdd = selectedFood && Number(quantity) > 0;

	const onSelectFood = (food) => {
		setSelectedFood(food);
		setQuantity(String(food.per));
	};

	const onAddToLog = async () => {
		if (!canAdd) {
			return;
		}

		await addFoodEntry(selectedMealType, scaleFood(selectedFood, Number(quantity)));
		navigation.goBack();
	};

	if (!selectedFood) {
		return (
			<SafeAreaView style={styles.safeArea}>
				<View style={styles.container}>
					<Text style={styles.title}>Add Food</Text>

					<View style={styles.searchContainer}>
						<Ionicons name="search-outline" size={18} color={theme.colors.textMuted} style={styles.searchIcon} />
						<TextInput
							style={styles.searchInput}
							placeholder="Search food..."
							placeholderTextColor={theme.colors.textMuted}
							value={searchQuery}
							onChangeText={setSearchQuery}
						/>
					</View>

					<View style={styles.dietRuleRow}>
						<Text style={styles.dietRuleText}>
							Diet rules {showAllDiets ? 'OFF' : 'ON'} - showing {allowedTypes.join('/')} only
						</Text>
						<TouchableOpacity
							onPress={() => setShowAllDiets((prev) => !prev)}
							style={styles.dietToggleButton}
						>
							<Text style={styles.dietToggleText}>
								{showAllDiets ? 'Hide non-allowed foods' : 'Show all foods'}
							</Text>
						</TouchableOpacity>
					</View>

					<FlatList
						data={results}
						keyExtractor={(item) => item.id}
						contentContainerStyle={styles.listContent}
						renderItem={({ item }) => (
							<TouchableOpacity
								style={[
									styles.foodRow,
									{ borderLeftColor: DIET_COLORS[item.dietType] || theme.colors.accent }
								]}
								onPress={() => onSelectFood(item)}
							>
								<Text style={styles.foodTitle}>
									{item.name}
								</Text>
								<Text style={styles.foodSubtitle}>
									{item.cal} kcal per {item.per}{item.unit}
								</Text>
							</TouchableOpacity>
						)}
						ListEmptyComponent={
							<Text style={styles.emptyText}>No foods found. Try another search.</Text>
						}
					/>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => {
						setSelectedFood(null);
						setQuantity('');
					}}
				>
					<Text style={styles.backButtonText}>{'< Back to search'}</Text>
				</TouchableOpacity>

				<Text style={styles.title}>{selectedFood.name}</Text>

				<View style={styles.card}>
					<Text style={styles.label}>Quantity</Text>
					<View style={styles.quantityRow}>
						<TextInput
							style={styles.quantityInput}
							keyboardType="numeric"
							value={quantity}
							onChangeText={setQuantity}
							placeholder="Enter quantity"
							placeholderTextColor={theme.colors.textMuted}
						/>
						<Text style={styles.unitText}>{unitLabel(selectedFood.unit)}</Text>
					</View>
				</View>

				<View style={styles.card}>
					<Text style={styles.label}>Live Preview</Text>
					<View style={styles.previewRow}>
						<View style={[styles.statChip, { backgroundColor: theme.colors.macroCalorie + '15', borderColor: theme.colors.macroCalorie }]}>
							<Ionicons name="flame-outline" size={16} color={theme.colors.macroCalorie} />
							<Text style={[styles.statValue, { color: theme.colors.macroCalorie }]}>
								{Math.round(scaled?.cal || 0)}
							</Text>
							<Text style={styles.statLabel}>kcal</Text>
						</View>

						<View style={[styles.statChip, { backgroundColor: theme.colors.macroProtein + '15', borderColor: theme.colors.macroProtein }]}>
							<Ionicons name="barbell-outline" size={16} color={theme.colors.macroProtein} />
							<Text style={[styles.statValue, { color: theme.colors.macroProtein }]}>
								{Math.round(scaled?.protein || 0)}g
							</Text>
							<Text style={styles.statLabel}>protein</Text>
						</View>

						<View style={[styles.statChip, { backgroundColor: theme.colors.macroCarb + '15', borderColor: theme.colors.macroCarb }]}>
							<Ionicons name="leaf-outline" size={16} color={theme.colors.macroCarb} />
							<Text style={[styles.statValue, { color: theme.colors.macroCarb }]}>
								{Math.round(scaled?.carb || 0)}g
							</Text>
							<Text style={styles.statLabel}>carbs</Text>
						</View>

						<View style={[styles.statChip, { backgroundColor: theme.colors.macroFat + '15', borderColor: theme.colors.macroFat }]}>
							<Ionicons name="water-outline" size={16} color={theme.colors.macroFat} />
							<Text style={[styles.statValue, { color: theme.colors.macroFat }]}>
								{Math.round(scaled?.fat || 0)}g
							</Text>
							<Text style={styles.statLabel}>fat</Text>
						</View>
					</View>
				</View>

				<View style={styles.card}>
					<Text style={styles.label}>Meal Type</Text>
					<View style={styles.mealPillRow}>
						{MEAL_TYPES.map((meal) => {
							const selected = meal === selectedMealType;
							return (
								<TouchableOpacity
									key={meal}
									style={[styles.mealPill, selected && styles.mealPillSelected]}
									onPress={() => setSelectedMealType(meal)}
								>
									<Ionicons
										name={MEAL_ICONS[meal]}
										size={14}
										color={selected ? '#FFFFFF' : theme.colors.primary}
										style={{ marginRight: 6 }}
									/>
									<Text
										style={[styles.mealPillText, selected && styles.mealPillTextSelected]}
									>
										{meal}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>
				</View>

				<TouchableOpacity
					style={[styles.addButton, !canAdd && styles.addButtonDisabled]}
					disabled={!canAdd}
					onPress={onAddToLog}
				>
					<Text style={styles.addButtonText}>Add to Log</Text>
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
		padding: theme.spacing.md,
	},
	title: {
		...theme.typography.h1,
		color: theme.colors.textPrimary,
		marginBottom: theme.spacing.md,
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: theme.radius.md,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.surface,
		paddingHorizontal: theme.spacing.md,
		height: 48,
	},
	searchIcon: {
		marginRight: theme.spacing.sm,
	},
	searchInput: {
		flex: 1,
		height: '100%',
		...theme.typography.body,
		color: theme.colors.textPrimary,
	},
	dietRuleRow: {
		marginTop: theme.spacing.sm,
		marginBottom: theme.spacing.sm,
	},
	dietRuleText: {
		...theme.typography.caption,
		color: theme.colors.textSecondary,
	},
	dietToggleButton: {
		marginTop: theme.spacing.xs,
		alignSelf: 'flex-start',
		paddingVertical: theme.spacing.xs,
		paddingHorizontal: theme.spacing.sm,
		borderRadius: theme.radius.pill,
		backgroundColor: theme.colors.primaryLight,
	},
	dietToggleText: {
		...theme.typography.caption,
		fontWeight: '700',
		color: theme.colors.primary,
	},
	listContent: {
		paddingBottom: theme.spacing.lg,
	},
	foodRow: {
		backgroundColor: theme.colors.surface,
		borderRadius: theme.radius.md,
		borderLeftWidth: 4,
		padding: theme.spacing.md,
		marginTop: theme.spacing.sm,
		...theme.shadow.card,
	},
	foodTitle: {
		...theme.typography.body,
		fontWeight: '700',
		color: theme.colors.textPrimary,
	},
	foodSubtitle: {
		marginTop: theme.spacing.xs,
		...theme.typography.caption,
		color: theme.colors.textSecondary,
	},
	emptyText: {
		marginTop: theme.spacing.lg,
		...theme.typography.body,
		color: theme.colors.textMuted,
		textAlign: 'center',
	},
	backButton: {
		marginBottom: theme.spacing.sm,
	},
	backButtonText: {
		...theme.typography.body,
		fontWeight: '700',
		color: theme.colors.primary,
	},
	card: {
		backgroundColor: theme.colors.surface,
		borderRadius: theme.radius.lg,
		padding: theme.spacing.md,
		marginBottom: theme.spacing.md,
		...theme.shadow.card,
	},
	label: {
		...theme.typography.h3,
		color: theme.colors.textPrimary,
		marginBottom: theme.spacing.sm,
	},
	quantityRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	quantityInput: {
		flex: 1,
		height: 46,
		borderRadius: theme.radius.md,
		borderWidth: 1,
		borderColor: theme.colors.border,
		paddingHorizontal: theme.spacing.md,
		...theme.typography.body,
		color: theme.colors.textPrimary,
		backgroundColor: theme.colors.surface,
	},
	unitText: {
		marginLeft: theme.spacing.sm,
		...theme.typography.body,
		fontWeight: '700',
		color: theme.colors.textSecondary,
	},
	previewRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 6,
	},
	statChip: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: theme.spacing.sm,
		paddingHorizontal: theme.spacing.xs,
		borderRadius: theme.radius.md,
		borderWidth: 1,
	},
	statValue: {
		...theme.typography.caption,
		fontWeight: '800',
		marginTop: 4,
	},
	statLabel: {
		fontSize: 9,
		fontWeight: '700',
		color: theme.colors.textSecondary,
		textTransform: 'uppercase',
		marginTop: 2,
	},
	mealPillRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: theme.spacing.sm,
	},
	mealPill: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: theme.spacing.sm,
		paddingHorizontal: theme.spacing.md,
		borderRadius: theme.radius.pill,
		backgroundColor: theme.colors.primaryLight,
	},
	mealPillSelected: {
		backgroundColor: theme.colors.primary,
	},
	mealPillText: {
		...theme.typography.caption,
		fontWeight: '700',
		color: theme.colors.primaryDark,
	},
	mealPillTextSelected: {
		color: '#FFFFFF',
	},
	addButton: {
		height: 50,
		borderRadius: theme.radius.pill,
		backgroundColor: theme.colors.primary,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 'auto',
		...theme.shadow.floating,
	},
	addButtonDisabled: {
		opacity: 0.5,
	},
	addButtonText: {
		...theme.typography.body,
		fontWeight: '800',
		color: '#FFFFFF',
	},
});
