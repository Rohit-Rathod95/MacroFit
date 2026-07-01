import { useMemo, useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	FlatList,
	StyleSheet,
	SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { searchFoods, scaleFood } from '../utils/foodDatabase';
import { allowedDietTypesForToday } from '../utils/dietBudget';

const PRIMARY = '#4F46E5';
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

function dietEmoji(dietType) {
	if (dietType === 'egg') {
		return '🥚';
	}
	if (dietType === 'nonveg') {
		return '🔴';
	}
	return '🟢';
}

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

					<TextInput
						style={styles.searchInput}
						placeholder="Search food..."
						placeholderTextColor="#94A3B8"
						value={searchQuery}
						onChangeText={setSearchQuery}
					/>

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
								style={styles.foodRow}
								onPress={() => onSelectFood(item)}
							>
								<Text style={styles.foodTitle}>
									{dietEmoji(item.dietType)} {item.name}
								</Text>
								<Text style={styles.foodSubtitle}>
									{item.cal} kcal per {item.per}
									{item.unit}
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
							placeholderTextColor="#94A3B8"
						/>
						<Text style={styles.unitText}>{unitLabel(selectedFood.unit)}</Text>
					</View>
				</View>

				<View style={styles.card}>
					<Text style={styles.label}>Live Preview</Text>
					<View style={styles.previewGrid}>
						<Text style={styles.previewItem}>Calories: {Math.round(scaled?.cal || 0)} kcal</Text>
						<Text style={styles.previewItem}>Protein: {Math.round(scaled?.protein || 0)} g</Text>
						<Text style={styles.previewItem}>Carbs: {Math.round(scaled?.carb || 0)} g</Text>
						<Text style={styles.previewItem}>Fat: {Math.round(scaled?.fat || 0)} g</Text>
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
		backgroundColor: '#F8FAFC',
	},
	container: {
		flex: 1,
		padding: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: '800',
		color: '#0F172A',
		marginBottom: 12,
	},
	searchInput: {
		height: 48,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#CBD5E1',
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 14,
		fontSize: 15,
		color: '#0F172A',
	},
	dietRuleRow: {
		marginTop: 10,
		marginBottom: 8,
	},
	dietRuleText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#64748B',
	},
	dietToggleButton: {
		marginTop: 6,
		alignSelf: 'flex-start',
		paddingVertical: 6,
		paddingHorizontal: 10,
		borderRadius: 999,
		backgroundColor: '#EEF2FF',
	},
	dietToggleText: {
		fontSize: 12,
		fontWeight: '700',
		color: PRIMARY,
	},
	listContent: {
		paddingBottom: 20,
	},
	foodRow: {
		backgroundColor: '#FFFFFF',
		borderRadius: 14,
		padding: 14,
		marginTop: 8,
		shadowColor: '#0F172A',
		shadowOpacity: 0.05,
		shadowOffset: { width: 0, height: 4 },
		shadowRadius: 8,
		elevation: 1,
	},
	foodTitle: {
		fontSize: 15,
		fontWeight: '700',
		color: '#0F172A',
	},
	foodSubtitle: {
		marginTop: 4,
		fontSize: 13,
		color: '#64748B',
	},
	emptyText: {
		marginTop: 20,
		fontSize: 14,
		color: '#94A3B8',
		textAlign: 'center',
	},
	backButton: {
		marginBottom: 10,
	},
	backButtonText: {
		fontSize: 14,
		fontWeight: '700',
		color: PRIMARY,
	},
	card: {
		backgroundColor: '#FFFFFF',
		borderRadius: 14,
		padding: 14,
		marginBottom: 12,
		shadowColor: '#0F172A',
		shadowOpacity: 0.05,
		shadowOffset: { width: 0, height: 4 },
		shadowRadius: 8,
		elevation: 1,
	},
	label: {
		fontSize: 14,
		fontWeight: '700',
		color: '#334155',
		marginBottom: 8,
	},
	quantityRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	quantityInput: {
		flex: 1,
		height: 46,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#CBD5E1',
		paddingHorizontal: 12,
		fontSize: 15,
		color: '#0F172A',
		backgroundColor: '#FFFFFF',
	},
	unitText: {
		marginLeft: 10,
		fontSize: 14,
		fontWeight: '600',
		color: '#475569',
	},
	previewGrid: {
		gap: 6,
	},
	previewItem: {
		fontSize: 14,
		fontWeight: '600',
		color: '#1E293B',
	},
	mealPillRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	mealPill: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 999,
		backgroundColor: '#EEF2FF',
	},
	mealPillSelected: {
		backgroundColor: PRIMARY,
	},
	mealPillText: {
		fontSize: 13,
		fontWeight: '700',
		color: '#3730A3',
	},
	mealPillTextSelected: {
		color: '#FFFFFF',
	},
	addButton: {
		height: 50,
		borderRadius: 12,
		backgroundColor: PRIMARY,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 'auto',
	},
	addButtonDisabled: {
		opacity: 0.5,
	},
	addButtonText: {
		fontSize: 16,
		fontWeight: '800',
		color: '#FFFFFF',
	},
});

