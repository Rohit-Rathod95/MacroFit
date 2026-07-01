import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { Storage } from '../utils/storage';
import { computeFullPlan, todayKey } from '../utils/calculations';

export const AppContext = createContext(null);

const DEFAULT_LOG = {
	Breakfast: [],
	Lunch: [],
	Dinner: [],
	Snacks: [],
};

const DEFAULT_SETTINGS = {
	dietType: 'nonveg',
	eggDaysPerWeek: 7,
	nonvegDaysPerWeek: 3,
	pureVegMode: false,
	geminiApiKey: '',
};

const DEFAULT_STREAK = {
	count: 0,
	lastLoggedDate: null,
};

function toSafeDate(input) {
	if (!input) {
		return null;
	}
	const d = new Date(input);
	if (Number.isNaN(d.getTime())) {
		return null;
	}
	d.setHours(0, 0, 0, 0);
	return d;
}

function buildTodayLog(existingLog) {
	return {
		Breakfast: Array.isArray(existingLog?.Breakfast) ? existingLog.Breakfast : [],
		Lunch: Array.isArray(existingLog?.Lunch) ? existingLog.Lunch : [],
		Dinner: Array.isArray(existingLog?.Dinner) ? existingLog.Dinner : [],
		Snacks: Array.isArray(existingLog?.Snacks) ? existingLog.Snacks : [],
	};
}

function createEntryId() {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function AppProvider({ children }) {
	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState(null);
	const [plan, setPlan] = useState(null);
	const [logs, setLogs] = useState({});
	const [weightHistory, setWeightHistory] = useState([]);
	const [settings, setSettings] = useState(DEFAULT_SETTINGS);
	const [streak, setStreak] = useState(DEFAULT_STREAK);

	useEffect(() => {
		let isMounted = true;

		async function loadInitialData() {
			try {
				const [
					storedProfile,
					storedPlan,
					storedLogs,
					storedWeightHistory,
					storedSettings,
					storedStreak,
				] = await Promise.all([
					Storage.getProfile(),
					Storage.getPlan(),
					Storage.getLogs(),
					Storage.getWeightHistory(),
					Storage.getSettings(),
					Storage.getStreak(),
				]);

				if (!isMounted) {
					return;
				}

				setProfile(storedProfile || null);
				setPlan(storedPlan || null);
				setLogs(storedLogs || {});
				setWeightHistory(Array.isArray(storedWeightHistory) ? storedWeightHistory : []);
				setSettings({ ...DEFAULT_SETTINGS, ...(storedSettings || {}) });
				setStreak({ ...DEFAULT_STREAK, ...(storedStreak || {}) });
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		}

		loadInitialData();

		return () => {
			isMounted = false;
		};
	}, []);

	const saveProfile = useCallback(async (newProfile) => {
		const nextPlan = computeFullPlan(newProfile);
		await Promise.all([Storage.setProfile(newProfile), Storage.setPlan(nextPlan)]);
		setProfile(newProfile);
		setPlan(nextPlan);
	}, []);

	const saveSettings = useCallback(async (newSettings) => {
		await Storage.setSettings(newSettings);
		setSettings(newSettings);
	}, []);

	const updateStreakForToday = useCallback(async () => {
		const today = todayKey(new Date());
		if (streak?.lastLoggedDate === today) {
			return streak;
		}

		const lastDate = toSafeDate(streak?.lastLoggedDate);
		const yesterday = new Date();
		yesterday.setHours(0, 0, 0, 0);
		yesterday.setDate(yesterday.getDate() - 1);

		const isConsecutive =
			lastDate !== null && lastDate.getTime() === yesterday.getTime();

		const nextStreak = {
			count: isConsecutive ? (Number(streak?.count) || 0) + 1 : 1,
			lastLoggedDate: today,
		};

		await Storage.setStreak(nextStreak);
		setStreak(nextStreak);
		return nextStreak;
	}, [streak]);

	const addFoodEntry = useCallback(
		async (mealType, entry) => {
			const today = todayKey(new Date());
			const nextLogs = { ...logs };
			const todayLog = buildTodayLog(nextLogs[today] || DEFAULT_LOG);
			const validMealType = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'].includes(mealType)
				? mealType
				: 'Snacks';

			const nextEntry = {
				...entry,
				id: entry?.id || createEntryId(),
			};

			todayLog[validMealType] = [...todayLog[validMealType], nextEntry];
			nextLogs[today] = todayLog;

			await Storage.setLogs(nextLogs);
			setLogs(nextLogs);
			await updateStreakForToday();
		},
		[logs, updateStreakForToday]
	);

	const removeFoodEntry = useCallback(
		async (dateKey, mealType, entryId) => {
			const dayLog = logs[dateKey];
			if (!dayLog) {
				return;
			}

			const nextDayLog = buildTodayLog(dayLog);
			if (!Array.isArray(nextDayLog[mealType])) {
				return;
			}

			nextDayLog[mealType] = nextDayLog[mealType].filter(
				(entry) => entry?.id !== entryId
			);

			const nextLogs = {
				...logs,
				[dateKey]: nextDayLog,
			};

			await Storage.setLogs(nextLogs);
			setLogs(nextLogs);
		},
		[logs]
	);

	const logWeight = useCallback(
		async (weightKg, date) => {
			const parsedDate = date ? new Date(date) : new Date();
			const key = Number.isNaN(parsedDate.getTime())
				? todayKey(new Date())
				: todayKey(parsedDate);
			const safeWeight = Number(weightKg);
			if (!Number.isFinite(safeWeight)) {
				return;
			}

			const existing = Array.isArray(weightHistory) ? [...weightHistory] : [];
			const index = existing.findIndex((item) => item?.date === key);
			const nextEntry = { date: key, weightKg: safeWeight };

			if (index >= 0) {
				existing[index] = nextEntry;
			} else {
				existing.push(nextEntry);
			}

			existing.sort((a, b) => String(a.date).localeCompare(String(b.date)));

			await Storage.setWeightHistory(existing);
			setWeightHistory(existing);
		},
		[weightHistory]
	);

	const getDayTotals = useCallback(
		(dateKey) => {
			const dayLog = logs[dateKey];
			if (!dayLog) {
				return { cal: 0, protein: 0, carb: 0, fat: 0 };
			}

			const meals = [dayLog.Breakfast, dayLog.Lunch, dayLog.Dinner, dayLog.Snacks];
			const allEntries = meals.flatMap((meal) => (Array.isArray(meal) ? meal : []));

			return allEntries.reduce(
				(acc, item) => ({
					cal: acc.cal + (Number(item?.cal) || 0),
					protein: acc.protein + (Number(item?.protein) || 0),
					carb: acc.carb + (Number(item?.carb) || 0),
					fat: acc.fat + (Number(item?.fat) || 0),
				}),
				{ cal: 0, protein: 0, carb: 0, fat: 0 }
			);
		},
		[logs]
	);

	const resetAllData = useCallback(async () => {
		await Storage.clearAll();
		setProfile(null);
		setPlan(null);
		setLogs({});
		setWeightHistory([]);
		setSettings(DEFAULT_SETTINGS);
		setStreak(DEFAULT_STREAK);
	}, []);

	const value = useMemo(
		() => ({
			loading,
			profile,
			plan,
			logs,
			weightHistory,
			settings,
			streak,
			saveProfile,
			saveSettings,
			updateStreakForToday,
			addFoodEntry,
			removeFoodEntry,
			logWeight,
			getDayTotals,
			resetAllData,
		}),
		[
			loading,
			profile,
			plan,
			logs,
			weightHistory,
			settings,
			streak,
			saveProfile,
			saveSettings,
			updateStreakForToday,
			addFoodEntry,
			removeFoodEntry,
			logWeight,
			getDayTotals,
			resetAllData,
		]
	);

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error('useApp must be used within an AppProvider');
	}
	return context;
}
