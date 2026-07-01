import { useRef, useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	FlatList,
	StyleSheet,
	SafeAreaView,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { askAICoach, generateWeeklyDietPlan } from '../utils/geminiApi';
import { computeWeeklyDietBudget } from '../utils/dietBudget';
import { todayKey } from '../utils/calculations';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

function createMessage(role, text) {
	return {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
		role,
		text,
	};
}

function sumTodayTotals(dayLog) {
	const meals = [dayLog?.Breakfast, dayLog?.Lunch, dayLog?.Dinner, dayLog?.Snacks];
	const entries = meals.flatMap((meal) => (Array.isArray(meal) ? meal : []));

	return entries.reduce(
		(acc, item) => ({
			cal: acc.cal + (Number(item?.cal) || 0),
			protein: acc.protein + (Number(item?.protein) || 0),
			carb: acc.carb + (Number(item?.carb) || 0),
			fat: acc.fat + (Number(item?.fat) || 0),
		}),
		{ cal: 0, protein: 0, carb: 0, fat: 0 }
	);
}

export default function AICoachScreen() {
	const { profile, plan, logs, settings } = useApp();
	const listRef = useRef(null);
	const [messages, setMessages] = useState([
		createMessage(
			'assistant',
			"Hi! I'm your AI gym coach. Ask me anything about your diet, or tap the button below for a weekly egg/non-veg plan."
		),
	]);
	const [inputText, setInputText] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const today = todayKey();
	const todaySummary = sumTodayTotals(logs?.[today]);
	const weeklyBudget = computeWeeklyDietBudget(logs || {}, settings || {});
	const context = {
		profile,
		plan,
		todaySummary,
		weeklyBudget,
		settings,
	};

	const appendMessage = (role, text) => {
		setMessages((prev) => [...prev, createMessage(role, text)]);
	};

	const scrollToBottom = () => {
		listRef.current?.scrollToEnd?.({ animated: true });
	};

	const runCoachRequest = async (userText, requestFn) => {
		if (!settings?.geminiApiKey) {
			appendMessage(
				'assistant',
				'Please add your free Gemini API key in Settings first to use the AI coach.'
			);
			return;
		}

		appendMessage('user', userText);
		setIsLoading(true);
 
		try {
			const responseText = await requestFn();
			appendMessage('assistant', responseText);
		} catch (error) {
			appendMessage(
				'assistant',
				`Sorry, something went wrong: ${error?.message || 'Unknown error'}. Check your API key in Settings.`
			);
		} finally {
			setIsLoading(false);
		}
	};

	const sendMessage = async (text) => {
		const trimmed = String(text || '').trim();
		if (!trimmed || isLoading) {
			return;
		}

		setInputText('');
		await runCoachRequest(trimmed, () =>
			askAICoach({
				apiKey: settings.geminiApiKey,
				userMessage: trimmed,
				context,
			})
		);
	};

	const generatePlan = async () => {
		if (isLoading) {
			return;
		}

		await runCoachRequest('Generate my weekly diet plan', () =>
			generateWeeklyDietPlan({
				apiKey: settings.geminiApiKey,
				context,
			})
		);
	};

	const renderMessage = ({ item }) => {
		const isUser = item.role === 'user';
		return (
			<View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
				{!isUser && (
					<View style={styles.avatarContainer}>
						<Ionicons name="barbell-outline" size={16} color={theme.colors.primary} />
					</View>
				)}
				<View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
					<Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
						{item.text}
					</Text>
				</View>
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView
				style={styles.container}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<View style={styles.container}>
					<FlatList
						ref={listRef}
						data={messages}
						keyExtractor={(item) => item.id}
						renderItem={renderMessage}
						contentContainerStyle={styles.listContent}
						onContentSizeChange={scrollToBottom}
						keyboardShouldPersistTaps="handled"
						ListFooterComponent={
							isLoading ? (
								<View style={[styles.messageRow, styles.assistantRow]}>
									<View style={styles.avatarContainer}>
										<Ionicons name="barbell-outline" size={16} color={theme.colors.primary} />
									</View>
									<View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
										<ActivityIndicator size="small" color={theme.colors.primary} />
									</View>
								</View>
							) : null
						}
					/>

					<View style={styles.composerWrap}>
						<TouchableOpacity
							style={[styles.planButton, isLoading && styles.disabledButton]}
							onPress={generatePlan}
							disabled={isLoading}
						>
							<Ionicons name="calendar-outline" size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
							<Text style={styles.planButtonText}>Generate Weekly Plan</Text>
						</TouchableOpacity>

						<View style={styles.inputRow}>
							<TextInput
								style={styles.input}
								placeholder="Ask your coach..."
								placeholderTextColor={theme.colors.textMuted}
								value={inputText}
								onChangeText={setInputText}
								editable={!isLoading}
								returnKeyType="send"
								onSubmitEditing={() => sendMessage(inputText)}
							/>
							<TouchableOpacity
								style={[
									styles.sendButton,
									(isLoading || !inputText.trim()) && styles.disabledButton,
								]}
								disabled={isLoading || !inputText.trim()}
								onPress={() => sendMessage(inputText)}
							>
								<Text style={styles.sendButtonText}>Send</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>
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
	},
	listContent: {
		padding: theme.spacing.md,
		paddingBottom: theme.spacing.sm,
	},
	composerWrap: {
		paddingHorizontal: theme.spacing.md,
		paddingBottom: theme.spacing.md,
		paddingTop: theme.spacing.sm,
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
		backgroundColor: theme.colors.background,
	},
	planButton: {
		height: 40,
		borderRadius: theme.radius.pill,
		backgroundColor: 'transparent',
		borderWidth: 1,
		borderColor: theme.colors.primary,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: theme.spacing.sm,
	},
	planButtonText: {
		...theme.typography.caption,
		fontWeight: '800',
		color: theme.colors.primary,
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: theme.spacing.sm,
	},
	input: {
		flex: 1,
		minHeight: 48,
		maxHeight: 110,
		borderRadius: theme.radius.md,
		borderWidth: 1,
		borderColor: theme.colors.border,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		...theme.typography.body,
		color: theme.colors.textPrimary,
		backgroundColor: theme.colors.surface,
	},
	sendButton: {
		height: 48,
		paddingHorizontal: theme.spacing.md,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.primary,
		justifyContent: 'center',
		alignItems: 'center',
		...theme.shadow.card,
	},
	sendButtonText: {
		...theme.typography.body,
		fontWeight: '800',
		color: '#FFFFFF',
	},
	disabledButton: {
		opacity: 0.5,
	},
	messageRow: {
		marginBottom: theme.spacing.sm,
		flexDirection: 'row',
		alignItems: 'flex-end',
	},
	userRow: {
		justifyContent: 'flex-end',
	},
	assistantRow: {
		justifyContent: 'flex-start',
	},
	avatarContainer: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: theme.colors.primaryLight,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: theme.spacing.sm,
		alignSelf: 'flex-end',
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	bubble: {
		maxWidth: '75%',
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		borderRadius: theme.radius.lg,
		...theme.shadow.card,
	},
	userBubble: {
		backgroundColor: theme.colors.primary,
		borderBottomRightRadius: theme.radius.sm,
	},
	assistantBubble: {
		backgroundColor: theme.colors.surface,
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderBottomLeftRadius: theme.radius.sm,
	},
	loadingBubble: {
		minWidth: 56,
		alignItems: 'center',
		justifyContent: 'center',
	},
	messageText: {
		...theme.typography.body,
		lineHeight: 20,
	},
	userText: {
		color: '#FFFFFF',
	},
	assistantText: {
		color: theme.colors.textPrimary,
	},
});
