import { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
	Switch,
	Alert,
	Linking,
	Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { ACTIVITY_LEVELS, GOALS } from '../utils/calculations';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

function Stepper({ value, onDecrement, onIncrement }) {
	return (
		<View style={styles.stepperRow}>
			<TouchableOpacity style={styles.stepperButton} onPress={onDecrement}>
				<Ionicons name="remove" size={18} color={theme.colors.primary} />
			</TouchableOpacity>
			<Text style={styles.stepperValue}>{value}</Text>
			<TouchableOpacity style={styles.stepperButton} onPress={onIncrement}>
				<Ionicons name="add" size={18} color={theme.colors.primary} />
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

function SectionCard({ title, icon, iconColor, children }) {
	return (
		<View style={styles.card}>
			<View style={styles.cardHeaderRow}>
				{icon && (
					<Ionicons
						name={icon}
						size={20}
						color={iconColor || theme.colors.primary}
						style={styles.cardHeaderIcon}
					/>
				)}
				<Text style={styles.cardTitle}>{title}</Text>
			</View>
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

				<SectionCard title="Profile" icon="person-outline">
					<Text style={styles.label}>Age</Text>
					<TextInput
						style={styles.input}
						keyboardType="numeric"
						value={age}
						onChangeText={setAge}
						placeholder="Age"
						placeholderTextColor={theme.colors.textMuted}
					/>

					<Text style={styles.label}>Weight (kg)</Text>
					<TextInput
						style={styles.input}
						keyboardType="numeric"
						value={weightKg}
						onChangeText={setWeightKg}
						placeholder="Weight"
						placeholderTextColor={theme.colors.textMuted}
					/>

					<Text style={styles.label}>Height (cm)</Text>
					<TextInput
						style={styles.input}
						keyboardType="numeric"
						value={heightCm}
						onChangeText={setHeightCm}
						placeholder="Height"
						placeholderTextColor={theme.colors.textMuted}
					/>

					<Text style={styles.label}>Activity Level</Text>
					<PillRow items={ACTIVITY_LEVELS} selectedKey={activityKey} onSelect={setActivityKey} />

					<Text style={styles.label}>Goal</Text>
					<PillRow items={GOALS} selectedKey={goalKey} onSelect={setGoalKey} />

					<TouchableOpacity style={styles.primaryButton} onPress={updateProfile}>
						<Text style={styles.primaryButtonText}>Update Profile</Text>
					</TouchableOpacity>
				</SectionCard>

				<SectionCard title="Diet Preferences" icon="nutrition-outline">
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
							<Text style={[styles.label, { marginTop: 0, marginBottom: 4 }]}>Pure Veg Mode (Shravan/Navratri etc.)</Text>
							<Text style={styles.helperText}>
								Overrides all diet rules above - forces vegetarian only
							</Text>
						</View>
						<Switch
							value={pureVegMode}
							onValueChange={setPureVegMode}
							trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
							thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
						/>
					</View>

					<TouchableOpacity style={styles.primaryButton} onPress={saveDietPreferences}>
						<Text style={styles.primaryButtonText}>Save Diet Preferences</Text>
					</TouchableOpacity>
				</SectionCard>

				<SectionCard title="AI Coach Settings" icon="sparkles-outline">
					<Text style={styles.label}>Gemini API Key</Text>
					<TextInput
						style={styles.input}
						value={geminiApiKey}
						onChangeText={setGeminiApiKey}
						placeholder="Paste your Gemini API key"
						placeholderTextColor={theme.colors.textMuted}
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

				<SectionCard title="Danger Zone" icon="warning-outline" iconColor={theme.colors.danger}>
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
		backgroundColor: theme.colors.background,
	},
	content: {
		padding: theme.spacing.md,
		paddingBottom: theme.spacing.xl,
	},
	title: {
		...theme.typography.h1,
		color: theme.colors.textPrimary,
		marginBottom: theme.spacing.xs,
	},
	subtitle: {
		...theme.typography.caption,
		color: theme.colors.textSecondary,
		marginBottom: theme.spacing.md,
	},
	card: {
		backgroundColor: theme.colors.surface,
		borderRadius: theme.radius.lg,
		padding: theme.spacing.md,
		marginBottom: theme.spacing.md,
		...theme.shadow.card,
	},
	cardHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: theme.spacing.md,
	},
	cardHeaderIcon: {
		marginRight: theme.spacing.sm,
	},
	cardTitle: {
		...theme.typography.h2,
		color: theme.colors.textPrimary,
	},
	label: {
		...theme.typography.body,
		fontWeight: '700',
		color: theme.colors.textPrimary,
		marginBottom: theme.spacing.xs,
		marginTop: theme.spacing.sm,
	},
	input: {
		height: 46,
		borderRadius: theme.radius.md,
		borderWidth: 1,
		borderColor: theme.colors.border,
		paddingHorizontal: theme.spacing.md,
		...theme.typography.body,
		color: theme.colors.textPrimary,
		backgroundColor: theme.colors.surface,
		marginBottom: theme.spacing.sm,
	},
	pillRow: {
		gap: theme.spacing.sm,
		paddingRight: theme.spacing.xs,
	},
	pillRowWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: theme.spacing.sm,
		marginBottom: theme.spacing.sm,
	},
	pill: {
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		borderRadius: theme.radius.pill,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.surface,
	},
	pillSelected: {
		borderColor: theme.colors.primary,
		backgroundColor: theme.colors.primaryLight,
	},
	pillText: {
		...theme.typography.caption,
		color: theme.colors.textSecondary,
	},
	pillTextSelected: {
		color: theme.colors.primaryDark,
		fontWeight: '800',
	},
	primaryButton: {
		height: 48,
		borderRadius: theme.radius.pill,
		backgroundColor: theme.colors.primary,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: theme.spacing.md,
		...theme.shadow.floating,
	},
	primaryButtonText: {
		...theme.typography.body,
		fontWeight: '800',
		color: '#FFFFFF',
	},
	stepperRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: theme.spacing.md,
		marginBottom: theme.spacing.sm,
	},
	stepperButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: theme.colors.primaryLight,
		borderWidth: 1,
		borderColor: theme.colors.border,
		justifyContent: 'center',
		alignItems: 'center',
	},
	stepperValue: {
		minWidth: 40,
		textAlign: 'center',
		...theme.typography.body,
		fontWeight: '800',
		color: theme.colors.textPrimary,
	},
	switchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: theme.spacing.md,
		marginBottom: theme.spacing.sm,
		marginTop: theme.spacing.md,
	},
	switchTextWrap: {
		flex: 1,
	},
	helperText: {
		...theme.typography.caption,
		color: theme.colors.textSecondary,
		lineHeight: 18,
	},
	linkText: {
		color: theme.colors.primary,
		textDecorationLine: 'underline',
		fontWeight: '700',
	},
	dangerButton: {
		height: 48,
		borderRadius: theme.radius.pill,
		backgroundColor: '#FEE2E2',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#FCA5A5',
	},
	dangerButtonText: {
		...theme.typography.body,
		fontWeight: '800',
		color: theme.colors.danger,
	},
});
