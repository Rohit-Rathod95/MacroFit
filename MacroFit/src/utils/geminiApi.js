const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT_BASE =
	'https://generativelanguage.googleapis.com/v1beta/models';

function toText(value, fallback = '-') {
	if (value === null || value === undefined || value === '') {
		return fallback;
	}
	return String(value);
}

function toNumber(value, fallback = 0) {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function formatOneDecimal(value) {
	const safe = toNumber(value);
	return Math.round(safe * 10) / 10;
}

function buildSystemContext({
	profile = {},
	plan = {},
	todaySummary = {},
	weeklyBudget = {},
	settings = {},
} = {}) {
	const userStatsLine = [
		`gender=${toText(profile.gender)}`,
		`age=${toText(profile.age)}`,
		`weightKg=${toText(profile.weightKg)}`,
		`heightCm=${toText(profile.heightCm)}`,
		`activity=${toText(profile.activityKey)}`,
		`goal=${toText(profile.goalKey)}`,
	].join(', ');

	const targetsLine = [
		`goalCalories=${Math.round(toNumber(plan.goalCalories))}`,
		`proteinG=${formatOneDecimal(plan.proteinG)}`,
		`carbG=${formatOneDecimal(plan.carbG)}`,
		`fatG=${formatOneDecimal(plan.fatG)}`,
	].join(', ');

	const loggedLine = [
		`calories=${Math.round(toNumber(todaySummary.cal))}`,
		`proteinG=${formatOneDecimal(todaySummary.protein)}`,
		`carbG=${formatOneDecimal(todaySummary.carb)}`,
		`fatG=${formatOneDecimal(todaySummary.fat)}`,
	].join(', ');

	let dietRulesLine = '';
	if (settings.pureVegMode) {
		dietRulesLine =
			'Pure Veg Mode is ON (for Shravan/Navratri etc). ALL suggestions must be strictly vegetarian: no eggs and no meat.';
	} else {
		dietRulesLine = [
			`Eggs allowed ~${toNumber(settings.eggDaysPerWeek)} per week`,
			`Non-veg allowed ~${toNumber(settings.nonvegDaysPerWeek)} per week`,
			`Egg days used=${toNumber(weeklyBudget.eggUsed)}, remaining=${toNumber(weeklyBudget.eggRemaining)}`,
			`Non-veg days used=${toNumber(weeklyBudget.nonvegUsed)}, remaining=${toNumber(weeklyBudget.nonvegRemaining)}`,
		].join('; ');
	}

	return [
		'You are MacroFit AI coach: an encouraging Indian gym coach.',
		'Keep replies under 100 words unless the user explicitly asks for a full plan. Get straight to the point, no preamble.',
		'Hinglish tone is fine. Be practical, positive, and specific.',
		`User stats: ${userStatsLine}`,
		`Daily targets: ${targetsLine}`,
		`Today logged totals so far: ${loggedLine}`,
		`Diet rules: ${dietRulesLine}`,
	].join('\n');
}

export async function askAICoach({ apiKey, userMessage, context = {} }) {
	if (!apiKey) {
		throw new Error('NO_API_KEY');
	}

	const systemContext = buildSystemContext(context);
	const endpoint = `${GEMINI_ENDPOINT_BASE}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			contents: [
				{
					role: 'user',
					parts: [
						{
							text: `${systemContext}\n\nUser question: ${toText(userMessage, '')}`,
						},
					],
				},
			],
			generationConfig: {
				temperature: 0.7,
				maxOutputTokens: 800,
                thinkingConfig: { thinkingBudget: 0 },
			},
		}),
	});

	if (!response.ok) {
		let details = '';
		try {
			const errorData = await response.json();
			details =
				errorData?.error?.message ||
				errorData?.message ||
				JSON.stringify(errorData);
		} catch (parseError) {
			try {
				details = await response.text();
			} catch (textError) {
				details = '';
			}
		}

		throw new Error(
			`GEMINI_API_ERROR (${response.status} ${response.statusText})${
				details ? `: ${details}` : ''
			}`
		);
	}

	const data = await response.json();
	const parts = data?.candidates?.[0]?.content?.parts || [];
	const output = parts
		.map((part) => (part?.text ? String(part.text) : ''))
		.filter(Boolean)
		.join('\n')
		.trim();

	if (!output) {
		throw new Error('EMPTY_GEMINI_RESPONSE');
	}

	return output;
}

export async function generateWeeklyDietPlan({ apiKey, context = {} }) {
	const prompt =
		'Create a Mon-Sun diet rotation plan that labels each day as veg, egg, or nonveg. Respect the weekly egg-day and nonveg-day limits exactly. Keep it short as bullet lines and add one final tip line.';

	return askAICoach({
		apiKey,
		userMessage: prompt,
		context,
	});
}
