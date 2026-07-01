export const ACTIVITY_LEVELS = [
	{ key: 'sedentary', label: 'Sedentary', multiplier: 1.2 },
	{ key: 'light', label: 'Lightly Active', multiplier: 1.375 },
	{ key: 'moderate', label: 'Moderately Active', multiplier: 1.55 },
	{ key: 'active', label: 'Very Active', multiplier: 1.725 },
	{ key: 'athlete', label: 'Athlete', multiplier: 1.9 },
];

export const GOALS = [
	{ key: 'cut', label: 'Cut', calorieAdjustPct: -20 },
	{ key: 'maintain', label: 'Maintain', calorieAdjustPct: 0 },
	{ key: 'lean_bulk', label: 'Lean Bulk', calorieAdjustPct: 12 },
	{ key: 'bulk', label: 'Bulk', calorieAdjustPct: 18 },
];

const PROTEIN_G_PER_KG = {
	cut: 2.2,
	maintain: 2.0,
	lean_bulk: 1.9,
	bulk: 1.8,
};

const FAT_CALORIE_PCT = {
	cut: 25,
	maintain: 28,
	lean_bulk: 29,
	bulk: 30,
};

const CALORIES_PER_GRAM_PROTEIN = 4;
const CALORIES_PER_GRAM_CARB = 4;
const CALORIES_PER_GRAM_FAT = 9;

const toNumber = (value, fallback = 0) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

export function calculateBMR({ gender, weightKg, heightCm, age }) {
	const safeWeightKg = toNumber(weightKg);
	const safeHeightCm = toNumber(heightCm);
	const safeAge = toNumber(age);
	const normalizedGender = String(gender || '').toLowerCase();

	const base = 10 * safeWeightKg + 6.25 * safeHeightCm - 5 * safeAge;

	if (normalizedGender === 'male') {
		return base + 5;
	}

	if (normalizedGender === 'female') {
		return base - 161;
	}

	return base;
}

export function calculateTDEE(bmr, activityKey) {
	const safeBmr = toNumber(bmr);
	const activity =
		ACTIVITY_LEVELS.find((item) => item.key === activityKey) || ACTIVITY_LEVELS[0];

	return safeBmr * activity.multiplier;
}

export function calculateGoalCalories(tdee, goalKey) {
	const safeTdee = toNumber(tdee);
	const goal = GOALS.find((item) => item.key === goalKey) || GOALS[1];
	const multiplier = 1 + goal.calorieAdjustPct / 100;

	return safeTdee * multiplier;
}

export function calculateMacros({ weightKg, goalCalories, goalKey }) {
	const safeWeightKg = toNumber(weightKg);
	const safeGoalCalories = toNumber(goalCalories);
	const proteinPerKg = PROTEIN_G_PER_KG[goalKey] ?? PROTEIN_G_PER_KG.maintain;
	const fatPct = FAT_CALORIE_PCT[goalKey] ?? FAT_CALORIE_PCT.maintain;

	const proteinG = safeWeightKg * proteinPerKg;
	const proteinCalories = proteinG * CALORIES_PER_GRAM_PROTEIN;

	const fatCalories = safeGoalCalories * (fatPct / 100);
	const fatG = fatCalories / CALORIES_PER_GRAM_FAT;

	const carbCalories = safeGoalCalories - proteinCalories - fatCalories;
	const carbG = Math.max(carbCalories / CALORIES_PER_GRAM_CARB, 0);

	return {
		proteinG,
		carbG,
		fatG,
	};
}

export function computeFullPlan(profile) {
	const bmr = calculateBMR(profile);
	const tdee = calculateTDEE(bmr, profile.activityKey);
	const goalCalories = calculateGoalCalories(tdee, profile.goalKey);
	const { proteinG, carbG, fatG } = calculateMacros({
		weightKg: profile.weightKg,
		goalCalories,
		goalKey: profile.goalKey,
	});

	return {
		bmr,
		tdee,
		goalCalories,
		proteinG,
		carbG,
		fatG,
	};
}

export function todayKey(date = new Date()) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function addDays(date, days) {
	const nextDate = new Date(date);
	nextDate.setDate(nextDate.getDate() + toNumber(days));
	return nextDate;
}
