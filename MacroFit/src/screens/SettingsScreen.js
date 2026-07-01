import { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
	SafeAreaView,
	Switch,
	Alert,
	Linking,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { ACTIVITY_LEVELS, GOALS } from '../utils/calculations';

const PRIMARY = '#4F46E5';
const DANGER = '#DC2626';

function Stepper({ value, onDecrement, onIncrement }) {
	return (
		<View style={styles.stepperRow}>
			<TouchableOpacity style={styles.stepperButton} onPress={onDecrement}>
				<Text style={styles.stepperButtonText}>-</Text>
			</TouchableOpacity>
			<Text style={styles.stepperValue}>{value}</Text>
			<TouchableOpacity style={styles.stepperButton} onPress={onIncrement}>
				<Text style={styles.stepperButtonText}>+</Text>
			</TouchableOpacity>
		</View>
	);
}

function PillRow({ items, selectedKey, onSelect }) {
	return (
		<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
			{items.map((item) => {
				const selected = selectedKey === item.key;
				return (
					<TouchableOpacity
						key={item.key}
						style={[styles.pill, selected && styles.pillSelected]}
						onPress={() => onSelect(item.key)}
					>
						<Text style={[styles.pillText, selected && styles.pillTextSelected]}>
							{item.label}
						</Text>
					</TouchableOpacity>
				);
			})}
		</ScrollView>
	);
}

function SectionCard({ title, children }) {
	return (
		<View style={styles.card}>
			<Text style={styles.cardTitle}>{title}</Text>
			{children}
		</View>
	);
}

export default function SettingsScreen() {
	const { profile, plan, settings, saveProfile, saveSettings, resetAllData } = useApp();

	const [age, setAge] = useState(String(profile?.age ?? ''));
	const [weightKg, setWeightKg] = useState(String(profile?.weightKg ?? ''));
	const [heightCm, setHeightCm] = useState(String(profile?.heightCm ?? ''));
	const [activityKey, setActivityKey] = useState(profile?.activityKey || ACTIVITY_LEVELS[0]?.key || 'sedentary');
	const [goalKey, setGoalKey] = useState(profile?.goalKey || GOALS[1]?.key || 'maintain');
	const [dietType, setDietType] = useState(settings?.dietType || 'nonveg');
	const [eggDaysPerWeek, setEggDaysPerWeek] = useState(String(settings?.eggDaysPerWeek ?? 7));
	const [nonvegDaysPerWeek, setNonvegDaysPerWeek] = useState(String(settings?.nonvegDaysPerWeek ?? 3));
	const [pureVegMode, setPureVegMode] = useState(Boolean(settings?.pureVegMode));
	const [geminiApiKey, setGeminiApiKey] = useState(settings?.geminiApiKey || '');

	const updateProfile = async () => {
		await saveProfile({
			...(profile || {}),
			age: Number(age),
			weightKg: Number(weightKg),
			heightCm: Number(heightCm),
			activityKey,
			goalKey,
		});
		Alert.alert('Saved', 'Profile updated! New targets calculated.');
	};

	const saveDietPreferences = async () => {
		await saveSettings({
			...(settings || {}),
			dietType,
			eggDaysPerWeek: dietType === 'veg' ? 0 : Number(eggDaysPerWeek),
			nonvegDaysPerWeek: dietType === 'nonveg' ? Number(nonvegDaysPerWeek) : 0,
			pureVegMode,
		});
		Alert.alert('Saved', 'Diet preferences updated!');
	};

	const saveApiKey = async () => {
		await saveSettings({
			...(settings || {}),
			geminiApiKey,
		});
		Alert.alert('Saved', 'API key updated!');
	};

	const confirmReset = () => {
		Alert.alert(
			'Reset All Data',
			'This will delete your profile, logs, and history permanently. Are you sure?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{ text: 'Reset', style: 'destructive', onPress: resetAllData },
			]
		);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<Text style={styles.title}>Settings</Text>
				{plan?.goalCalories ? (
					<Text style={styles.subtitle}>
						Current target: {Math.round(plan.goalCalories)} kcal / day
					</Text>
				) : null}

				<SectionCard title="Profile">
					<Text style={styles.label}>Age</Text>
					<TextInput
						style={styles.input}
						keyboardType="numeric"
						value={age}
						onChangeText={setAge}
						placeholder="Age"
						placeholderTextColor="#94A3B8"
					/>

					<Text style={styles.label}>Weight (kg)</Text>
					<TextInput
						style={styles.input}
						keyboardType="numeric"
						value={weightKg}
						onChangeText={setWeightKg}
						placeholder="Weight"
						placeholderTextColor="#94A3B8"
					/>

					<Text style={styles.label}>Height (cm)</Text>
					<TextInput
						style={styles.input}
						keyboardType="numeric"
						value={heightCm}
						onChangeText={setHeightCm}
						placeholder="Height"
						placeholderTextColor="#94A3B8"
					/>

					<Text style={styles.label}>Activity Level</Text>
					<PillRow items={ACTIVITY_LEVELS} selectedKey={activityKey} onSelect={setActivityKey} />

					<Text style={styles.label}>Goal</Text>
					<PillRow items={GOALS} selectedKey={goalKey} onSelect={setGoalKey} />

					<TouchableOpacity style={styles.primaryButton} onPress={updateProfile}>
						<Text style={styles.primaryButtonText}>Update Profile</Text>
					</TouchableOpacity>
				</SectionCard>

				<SectionCard title="Diet Preferences">
					<Text style={styles.label}>Diet Type</Text>
					<View style={styles.pillRowWrap}>
						{[
							{ key: 'veg', label: 'Veg Only' },
							{ key: 'egg', label: 'Eggetarian' },
							{ key: 'nonveg', label: 'Non-Veg' },
						].map((item) => {
							const selected = dietType === item.key;
							return (
								<TouchableOpacity
									key={item.key}
									style={[styles.pill, selected && styles.pillSelected]}
									onPress={() => setDietType(item.key)}
								>
									<Text style={[styles.pillText, selected && styles.pillTextSelected]}>
										{item.label}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>

					{dietType !== 'veg' ? (
						<>
							<Text style={styles.label}>Egg Days Per Week</Text>
							<Stepper
								value={eggDaysPerWeek}
								onDecrement={() => setEggDaysPerWeek(String(Math.max(0, Number(eggDaysPerWeek) - 1)))}
								onIncrement={() => setEggDaysPerWeek(String(Math.min(7, Number(eggDaysPerWeek) + 1)))}
							/>
						</>
					) : null}

					{dietType === 'nonveg' ? (
						<>
							<Text style={styles.label}>Non-Veg Days Per Week</Text>
							<Stepper
								value={nonvegDaysPerWeek}
								onDecrement={() => setNonvegDaysPerWeek(String(Math.max(0, Number(nonvegDaysPerWeek) - 1)))}
								onIncrement={() => setNonvegDaysPerWeek(String(Math.min(7, Number(nonvegDaysPerWeek) + 1)))}
							/>
						</>
					) : null}

					<View style={styles.switchRow}>
						<View style={styles.switchTextWrap}>
							<Text style={styles.label}>Pure Veg Mode (Shravan/Navratri etc.)</Text>
							<Text style={styles.helperText}>
								Overrides all diet rules above - forces vegetarian only
							</Text>
						</View>
						<Switch value={pureVegMode} onValueChange={setPureVegMode} />
					</View>

					<TouchableOpacity style={styles.primaryButton} onPress={saveDietPreferences}>
						<Text style={styles.primaryButtonText}>Save Diet Preferences</Text>
					</TouchableOpacity>
				</SectionCard>

				<SectionCard title="AI Coach Settings">
					<Text style={styles.label}>Gemini API Key</Text>
					<TextInput
						style={styles.input}
						value={geminiApiKey}
						onChangeText={setGeminiApiKey}
						placeholder="Paste your Gemini API key"
						placeholderTextColor="#94A3B8"
						secureTextEntry={false}
						autoCapitalize="none"
						autoCorrect={false}
					/>

					<Text style={styles.helperText}>
						Need a key?{' '}
						<Text
							style={styles.linkText}
							onPress={() => Linking.openURL('https://aistudio.google.com/apikey')}
						>
							Get a free key at aistudio.google.com/apikey
						</Text>
					</Text>

					<TouchableOpacity style={styles.primaryButton} onPress={saveApiKey}>
						<Text style={styles.primaryButtonText}>Save API Key</Text>
					</TouchableOpacity>
				</SectionCard>

				<SectionCard title="Danger Zone">
					<TouchableOpacity style={styles.dangerButton} onPress={confirmReset}>
						<Text style={styles.dangerButtonText}>Reset All Data</Text>
					</TouchableOpacity>
				</SectionCard>
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
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 13,
		fontWeight: '600',
		color: '#64748B',
		marginBottom: 14,
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
	label: {
		fontSize: 13,
		fontWeight: '700',
		color: '#334155',
		marginBottom: 6,
	},
	input: {
		height: 46,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#CBD5E1',
		paddingHorizontal: 14,
		fontSize: 15,
		color: '#0F172A',
		backgroundColor: '#FFFFFF',
		marginBottom: 12,
	},
	pillRow: {
		gap: 8,
		paddingRight: 4,
	},
	pillRowWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 12,
	},
	pill: {
		paddingHorizontal: 12,
		paddingVertical: 9,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: '#CBD5E1',
		backgroundColor: '#FFFFFF',
	},
	pillSelected: {
		borderColor: PRIMARY,
		backgroundColor: '#EEF2FF',
	},
	pillText: {
		fontSize: 13,
		fontWeight: '700',
		color: '#334155',
	},
	pillTextSelected: {
		color: PRIMARY,
	},
	primaryButton: {
		height: 48,
		borderRadius: 12,
		backgroundColor: PRIMARY,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 4,
	},
	primaryButtonText: {
		fontSize: 15,
		fontWeight: '800',
		color: '#FFFFFF',
	},
	stepperRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		marginBottom: 12,
	},
	stepperButton: {
		width: 38,
		height: 38,
		borderRadius: 12,
		backgroundColor: '#EEF2FF',
		borderWidth: 1,
		borderColor: '#C7D2FE',
		justifyContent: 'center',
		alignItems: 'center',
	},
	stepperButtonText: {
		fontSize: 20,
		lineHeight: 20,
		fontWeight: '800',
		color: PRIMARY,
	},
	stepperValue: {
		minWidth: 40,
		textAlign: 'center',
		fontSize: 16,
		fontWeight: '800',
		color: '#0F172A',
	},
	switchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,
		marginBottom: 12,
	},
	switchTextWrap: {
		flex: 1,
	},
	helperText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#64748B',
		lineHeight: 18,
	},
	linkText: {
		color: PRIMARY,
		textDecorationLine: 'underline',
		fontWeight: '700',
	},
	dangerButton: {
		height: 48,
		borderRadius: 12,
		backgroundColor: '#FEE2E2',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#FCA5A5',
	},
	dangerButtonText: {
		fontSize: 15,
		fontWeight: '800',
		color: DANGER,
	},
});
