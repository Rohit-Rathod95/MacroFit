import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
	PROFILE: '@macrofit/profile',
	PLAN: '@macrofit/plan',
	LOGS: '@macrofit/logs',
	WEIGHT_HISTORY: '@macrofit/weight_history',
	SETTINGS: '@macrofit/settings',
	STREAK: '@macrofit/streak',
};

const DEFAULT_PROFILE = null;
const DEFAULT_PLAN = null;
const DEFAULT_LOGS = {};
const DEFAULT_WEIGHT_HISTORY = [];
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

async function getJson(key, fallback) {
	try {
		const rawValue = await AsyncStorage.getItem(key);
		if (!rawValue) {
			return fallback;
		}
		return JSON.parse(rawValue);
	} catch (error) {
		return fallback;
	}
}

async function setJson(key, value) {
	try {
		await AsyncStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch (error) {
		return false;
	}
}

export const Storage = {
	async getProfile() {
		return getJson(KEYS.PROFILE, DEFAULT_PROFILE);
	},

	async setProfile(profile) {
		return setJson(KEYS.PROFILE, profile);
	},

	async getPlan() {
		return getJson(KEYS.PLAN, DEFAULT_PLAN);
	},

	async setPlan(plan) {
		return setJson(KEYS.PLAN, plan);
	},

	async getLogs() {
		return getJson(KEYS.LOGS, DEFAULT_LOGS);
	},

	async setLogs(logs) {
		return setJson(KEYS.LOGS, logs);
	},

	async getWeightHistory() {
		return getJson(KEYS.WEIGHT_HISTORY, DEFAULT_WEIGHT_HISTORY);
	},

	async setWeightHistory(weightHistory) {
		return setJson(KEYS.WEIGHT_HISTORY, weightHistory);
	},

	async getSettings() {
		return getJson(KEYS.SETTINGS, DEFAULT_SETTINGS);
	},

	async setSettings(settings) {
		return setJson(KEYS.SETTINGS, settings);
	},

	async getStreak() {
		return getJson(KEYS.STREAK, DEFAULT_STREAK);
	},

	async setStreak(streak) {
		return setJson(KEYS.STREAK, streak);
	},

	async clearAll() {
		try {
			await AsyncStorage.multiRemove(Object.values(KEYS));
			return true;
		} catch (error) {
			return false;
		}
	},
};
