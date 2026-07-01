import { useState } from 'react';
import {
	SafeAreaView,
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { ACTIVITY_LEVELS, GOALS } from '../utils/calculations';

const PRIMARY = '#4F46E5';

function Stepper({ label, value, min, max, onChange }) {
	const canDecrease = value > min;
	const canIncrease = value < max;

	return (
		<View style={styles.stepperRow}>
			<Text style={styles.stepperLabel}>{label}</Text>
			<View style={styles.stepperControls}>
				<TouchableOpacity
					style={[styles.stepperButton, !canDecrease && styles.stepperButtonDisabled]}
					disabled={!canDecrease}
					onPress={() => onChange(value - 1)}
				>
					<Text style={styles.stepperButtonText}>-</Text>
				</TouchableOpacity>
				<Text style={styles.stepperValue}>{value}</Text>
				<TouchableOpacity
					style={[styles.stepperButton, !canIncrease && styles.stepperButtonDisabled]}
					disabled={!canIncrease}
					onPress={() => onChange(value + 1)}
				>
					<Text style={styles.stepperButtonText}>+</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

export default function OnboardingScreen() {
	const { saveProfile, saveSettings } = useApp();
	const [step, setStep] = useState(0);
	const [gender, setGender] = useState('male');
	const [age, setAge] = useState('');
	const [weightKg, setWeightKg] = useState('');
	const [heightCm, setHeightCm] = useState('');
	const [activityKey, setActivityKey] = useState(ACTIVITY_LEVELS[0]?.key || 'sedentary');
	const [goalKey, setGoalKey] = useState(GOALS[1]?.key || 'maintain');
	const [dietType, setDietType] = useState('nonveg');
	const [eggDays, setEggDays] = useState(7);
	const [nonvegDays, setNonvegDays] = useState(3);
	const [pureVegMode, setPureVegMode] = useState(false);
	const [saving, setSaving] = useState(false);

	const canGoNextStep0 =
		gender && age.trim().length > 0 && weightKg.trim().length > 0 && heightCm.trim().length > 0;
	const canGoNextStep1 = Boolean(activityKey) && Boolean(goalKey);

	const onPressNext = async () => {
		if (step === 0 && !canGoNextStep0) {
			return;
		}
		if (step === 1 && !canGoNextStep1) {
			return;
		}

		if (step < 2) {
			setStep((prev) => prev + 1);
			return;
		}

		setSaving(true);
		try {
			await saveProfile({
				gender,
				age: Number(age),
				weightKg: Number(weightKg),
				heightCm: Number(heightCm),
				activityKey,
				goalKey,
			});

			await saveSettings({
				dietType,
				eggDaysPerWeek: dietType === 'veg' ? 0 : Number(eggDays),
				nonvegDaysPerWeek: dietType === 'nonveg' ? Number(nonvegDays) : 0,
				pureVegMode,
				geminiApiKey: '',
			});
		} finally {
			setSaving(false);
		}
	};

	const renderStep0 = () => (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>Basic Stats</Text>
			<Text style={styles.sectionSubtext}>Tell us about yourself to set your macros.</Text>

			<Text style={styles.inputLabel}>Gender</Text>
			<View style={styles.rowGap}>
				<TouchableOpacity
					style={[styles.toggleButton, gender === 'male' && styles.toggleButtonSelected]}
					onPress={() => setGender('male')}
				>
					<Text
						style={[
							styles.toggleButtonText,
							gender === 'male' && styles.toggleButtonTextSelected,
						]}
					>
						Male
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.toggleButton, gender === 'female' && styles.toggleButtonSelected]}
					onPress={() => setGender('female')}
				>
					<Text
						style={[
							styles.toggleButtonText,
							gender === 'female' && styles.toggleButtonTextSelected,
						]}
					>
						Female
					</Text>
				</TouchableOpacity>
			</View>

			<Text style={styles.inputLabel}>Age</Text>
			<TextInput
				style={styles.input}
				value={age}
				onChangeText={setAge}
				keyboardType="numeric"
				placeholder="e.g. 27"
				placeholderTextColor="#94A3B8"
			/>

			<Text style={styles.inputLabel}>Weight (kg)</Text>
			<TextInput
				style={styles.input}
				value={weightKg}
				onChangeText={setWeightKg}
				keyboardType="numeric"
				placeholder="e.g. 72"
				placeholderTextColor="#94A3B8"
			/>

			<Text style={styles.inputLabel}>Height (cm)</Text>
			<TextInput
				style={styles.input}
				value={heightCm}
				onChangeText={setHeightCm}
				keyboardType="numeric"
				placeholder="e.g. 175"
				placeholderTextColor="#94A3B8"
			/>
		</View>
	);

	const renderStep1 = () => (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>Training Preference</Text>
			<Text style={styles.sectionSubtext}>Choose activity level and goal.</Text>

			<Text style={styles.inputLabel}>Activity Level</Text>
			{ACTIVITY_LEVELS.map((item) => {
				const selected = item.key === activityKey;
				return (
					<TouchableOpacity
						key={item.key}
						style={[styles.card, selected && styles.cardSelected]}
						onPress={() => setActivityKey(item.key)}
					>
						<Text style={[styles.cardTitle, selected && styles.cardTitleSelected]}>
							{item.label}
						</Text>
					</TouchableOpacity>
				);
			})}

			<Text style={styles.inputLabel}>Goal</Text>
			{GOALS.map((item) => {
				const selected = item.key === goalKey;
				return (
					<TouchableOpacity
						key={item.key}
						style={[styles.card, selected && styles.cardSelected]}
						onPress={() => setGoalKey(item.key)}
					>
						<Text style={[styles.cardTitle, selected && styles.cardTitleSelected]}>
							{item.label}
						</Text>
					</TouchableOpacity>
				);
			})}
		</View>
	);

	const renderStep2 = () => (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>Diet Preference</Text>
			<Text style={styles.sectionSubtext}>Set your weekly diet pattern.</Text>

			<Text style={styles.inputLabel}>Diet Type</Text>
			<TouchableOpacity
				style={[styles.card, dietType === 'veg' && styles.cardSelected]}
				onPress={() => setDietType('veg')}
			>
				<Text style={[styles.cardTitle, dietType === 'veg' && styles.cardTitleSelected]}>
					Veg Only
				</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={[styles.card, dietType === 'egg' && styles.cardSelected]}
				onPress={() => setDietType('egg')}
			>
				<Text style={[styles.cardTitle, dietType === 'egg' && styles.cardTitleSelected]}>
					Eggetarian
				</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={[styles.card, dietType === 'nonveg' && styles.cardSelected]}
				onPress={() => setDietType('nonveg')}
			>
				<Text style={[styles.cardTitle, dietType === 'nonveg' && styles.cardTitleSelected]}>
					Non-Veg
				</Text>
			</TouchableOpacity>

			{dietType !== 'veg' && (
				<Stepper
					label="Egg Days Per Week"
					value={eggDays}
					min={0}
					max={7}
					onChange={setEggDays}
				/>
			)}

			{dietType === 'nonveg' && (
				<Stepper
					label="Non-Veg Days Per Week"
					value={nonvegDays}
					min={0}
					max={7}
					onChange={setNonvegDays}
				/>
			)}

			<View style={styles.switchCard}>
				<View style={styles.switchTextWrap}>
					<Text style={styles.switchLabel}>
						Pure Veg Mode (for Shravan/Navratri - overrides above)
					</Text>
				</View>
				<TouchableOpacity
					style={[styles.switchTrack, pureVegMode && styles.switchTrackOn]}
					onPress={() => setPureVegMode((prev) => !prev)}
				>
					<View
						style={[styles.switchThumb, pureVegMode && styles.switchThumbOn]}
					/>
				</TouchableOpacity>
			</View>
		</View>
	);

	const isNextDisabled =
		saving || (step === 0 && !canGoNextStep0) || (step === 1 && !canGoNextStep1);

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
					<Text style={styles.brand}>MacroFit</Text>
					<Text style={styles.header}>Let&apos;s Build Your Plan</Text>
					<Text style={styles.progress}>Step {step + 1} of 3</Text>

					{step === 0 && renderStep0()}
					{step === 1 && renderStep1()}
					{step === 2 && renderStep2()}
				</ScrollView>

				<View style={styles.footer}>
					{step > 0 && (
						<TouchableOpacity style={styles.backButton} onPress={() => setStep((s) => s - 1)}>
							<Text style={styles.backButtonText}>Back</Text>
						</TouchableOpacity>
					)}
					<TouchableOpacity
						style={[styles.nextButton, isNextDisabled && styles.nextButtonDisabled]}
						onPress={onPressNext}
						disabled={isNextDisabled}
					>
						<Text style={styles.nextButtonText}>
							{saving ? 'Saving...' : step === 2 ? 'Finish' : 'Next'}
						</Text>
					</TouchableOpacity>
				</View>
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
	content: {
		paddingHorizontal: 20,
		paddingBottom: 24,
	},
	brand: {
		marginTop: 12,
		fontSize: 18,
		fontWeight: '700',
		color: PRIMARY,
	},
	header: {
		marginTop: 6,
		fontSize: 28,
		fontWeight: '800',
		color: '#0F172A',
	},
	progress: {
		marginTop: 4,
		fontSize: 14,
		color: '#64748B',
	},
	section: {
		marginTop: 20,
		padding: 18,
		backgroundColor: '#FFFFFF',
		borderRadius: 18,
		shadowColor: '#0F172A',
		shadowOpacity: 0.08,
		shadowOffset: { width: 0, height: 8 },
		shadowRadius: 16,
		elevation: 3,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: '#0F172A',
	},
	sectionSubtext: {
		marginTop: 4,
		fontSize: 14,
		color: '#64748B',
		marginBottom: 12,
	},
	inputLabel: {
		marginTop: 10,
		marginBottom: 6,
		fontSize: 14,
		fontWeight: '600',
		color: '#334155',
	},
	rowGap: {
		flexDirection: 'row',
		gap: 10,
	},
	toggleButton: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#CBD5E1',
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
	},
	toggleButtonSelected: {
		borderColor: PRIMARY,
		backgroundColor: '#EEF2FF',
	},
	toggleButtonText: {
		fontSize: 15,
		fontWeight: '600',
		color: '#334155',
	},
	toggleButtonTextSelected: {
		color: PRIMARY,
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
	card: {
		marginTop: 8,
		padding: 14,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#CBD5E1',
		backgroundColor: '#FFFFFF',
	},
	cardSelected: {
		borderColor: PRIMARY,
		backgroundColor: '#EEF2FF',
	},
	cardTitle: {
		fontSize: 15,
		fontWeight: '600',
		color: '#334155',
	},
	cardTitleSelected: {
		color: PRIMARY,
	},
	stepperRow: {
		marginTop: 14,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	stepperLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: '#334155',
		flex: 1,
		paddingRight: 8,
	},
	stepperControls: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	stepperButton: {
		width: 34,
		height: 34,
		borderRadius: 17,
		backgroundColor: PRIMARY,
		justifyContent: 'center',
		alignItems: 'center',
	},
	stepperButtonDisabled: {
		opacity: 0.35,
	},
	stepperButtonText: {
		fontSize: 20,
		lineHeight: 20,
		color: '#FFFFFF',
		fontWeight: '700',
	},
	stepperValue: {
		width: 34,
		textAlign: 'center',
		fontSize: 16,
		fontWeight: '700',
		color: '#0F172A',
	},
	switchCard: {
		marginTop: 16,
		padding: 14,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#CBD5E1',
		backgroundColor: '#FFFFFF',
		flexDirection: 'row',
		alignItems: 'center',
	},
	switchTextWrap: {
		flex: 1,
		paddingRight: 10,
	},
	switchLabel: {
		fontSize: 13,
		fontWeight: '600',
		color: '#334155',
	},
	switchTrack: {
		width: 46,
		height: 28,
		borderRadius: 20,
		backgroundColor: '#CBD5E1',
		justifyContent: 'center',
		paddingHorizontal: 3,
	},
	switchTrackOn: {
		backgroundColor: PRIMARY,
	},
	switchThumb: {
		width: 22,
		height: 22,
		borderRadius: 11,
		backgroundColor: '#FFFFFF',
	},
	switchThumbOn: {
		alignSelf: 'flex-end',
	},
	footer: {
		paddingHorizontal: 20,
		paddingBottom: 18,
		paddingTop: 10,
		flexDirection: 'row',
		gap: 10,
	},
	backButton: {
		paddingHorizontal: 18,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#CBD5E1',
		justifyContent: 'center',
		alignItems: 'center',
	},
	backButtonText: {
		fontSize: 15,
		fontWeight: '700',
		color: '#334155',
	},
	nextButton: {
		flex: 1,
		height: 50,
		borderRadius: 12,
		backgroundColor: PRIMARY,
		justifyContent: 'center',
		alignItems: 'center',
	},
	nextButtonDisabled: {
		opacity: 0.5,
	},
	nextButtonText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF',
	},
});
