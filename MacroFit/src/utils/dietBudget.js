import { todayKey } from './calculations';

const DEFAULT_SETTINGS = {
	pureVegMode: false,
	eggDaysPerWeek: 0,
	nonvegDaysPerWeek: 0,
};

function toSafeNumber(value) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		return 0;
	}
	return parsed;
}

function toStartOfDay(dateInput) {
	const date = new Date(dateInput);
	date.setHours(0, 0, 0, 0);
	return date;
}

function getDaysLeftInWeek(weekKeys, date) {
	const key = todayKey(date);
	const index = weekKeys.indexOf(key);
	if (index < 0) {
		return 1;
	}
	return weekKeys.length - index;
}

function getMergedSettings(settings) {
	return {
		...DEFAULT_SETTINGS,
		...(settings || {}),
	};
}

export function classifyDay(dayLog) {
	const entries = Object.values(dayLog || {}).flat();

	let hasEgg = false;
	for (const item of entries) {
		const dietType = item?.dietType;
		if (dietType === 'nonveg') {
			return 'nonveg';
		}
		if (dietType === 'egg') {
			hasEgg = true;
		}
	}

	return hasEgg ? 'egg' : 'veg';
}

export function getWeekDateKeys(date = new Date()) {
	const current = toStartOfDay(date);
	const dayOfWeek = current.getDay();
	const daysFromMonday = (dayOfWeek + 6) % 7;
	const monday = new Date(current);
	monday.setDate(current.getDate() - daysFromMonday);

	const keys = [];
	for (let i = 0; i < 7; i += 1) {
		const dateInWeek = new Date(monday);
		dateInWeek.setDate(monday.getDate() + i);
		keys.push(todayKey(dateInWeek));
	}

	return keys;
}

export function computeWeeklyDietBudget(logs, settings) {
	const safeLogs = logs || {};
	const mergedSettings = getMergedSettings(settings);
	const weekKeys = getWeekDateKeys(new Date());

	const eggAllowed = mergedSettings.pureVegMode
		? 0
		: Math.max(Math.floor(toSafeNumber(mergedSettings.eggDaysPerWeek)), 0);
	const nonvegAllowed = mergedSettings.pureVegMode
		? 0
		: Math.max(Math.floor(toSafeNumber(mergedSettings.nonvegDaysPerWeek)), 0);

	let eggUsed = 0;
	let nonvegUsed = 0;

	for (const key of weekKeys) {
		const dayType = classifyDay(safeLogs[key]);
		if (dayType === 'nonveg') {
			nonvegUsed += 1;
		} else if (dayType === 'egg') {
			eggUsed += 1;
		}
	}

	return {
		weekKeys,
		eggAllowed,
		eggUsed,
		eggRemaining: Math.max(eggAllowed - eggUsed, 0),
		nonvegAllowed,
		nonvegUsed,
		nonvegRemaining: Math.max(nonvegAllowed - nonvegUsed, 0),
	};
}

export function suggestedDietTypeForToday(logs, settings) {
	const safeLogs = logs || {};
	const mergedSettings = getMergedSettings(settings);

	if (mergedSettings.pureVegMode) {
		return 'veg';
	}

	const today = todayKey(new Date());
	const todayType = classifyDay(safeLogs[today]);
	if (todayType !== 'veg') {
		return todayType;
	}

	const budget = computeWeeklyDietBudget(safeLogs, mergedSettings);
	const daysLeft = getDaysLeftInWeek(budget.weekKeys, new Date());

	if (budget.eggRemaining <= 0 && budget.nonvegRemaining <= 0) {
		return 'veg';
	}

	if (budget.nonvegRemaining >= daysLeft && budget.nonvegRemaining > 0) {
		return 'nonveg';
	}

	if (budget.eggRemaining >= daysLeft && budget.eggRemaining > 0) {
		return 'egg';
	}

	if (budget.nonvegRemaining > budget.eggRemaining && budget.nonvegRemaining > 0) {
		return 'nonveg';
	}

	if (budget.eggRemaining > 0) {
		return 'egg';
	}

	if (budget.nonvegRemaining > 0) {
		return 'nonveg';
	}

	return 'veg';
}

export function allowedDietTypesForToday(settings) {
	const mergedSettings = getMergedSettings(settings);
	const result = ['veg'];

	if (mergedSettings.pureVegMode) {
		return result;
	}

	if (toSafeNumber(mergedSettings.eggDaysPerWeek) > 0) {
		result.push('egg');
	}

	if (toSafeNumber(mergedSettings.nonvegDaysPerWeek) > 0) {
		result.push('nonveg');
	}

	return result;
}
