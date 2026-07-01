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

const PRIMARY = '#4F46E5';

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
									<View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
										<ActivityIndicator size="small" color={PRIMARY} />
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
							<Text style={styles.planButtonText}>📅 Generate Weekly Plan</Text>
						</TouchableOpacity>

						<View style={styles.inputRow}>
							<TextInput
								style={styles.input}
								placeholder="Ask your coach..."
								placeholderTextColor="#94A3B8"
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
		backgroundColor: '#F8FAFC',
	},
	container: {
		flex: 1,
	},
	listContent: {
		padding: 16,
		paddingBottom: 8,
	},
	composerWrap: {
		paddingHorizontal: 16,
		paddingBottom: 16,
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: '#E2E8F0',
		backgroundColor: '#F8FAFC',
	},
	planButton: {
		height: 46,
		borderRadius: 12,
		backgroundColor: '#EEF2FF',
		borderWidth: 1,
		borderColor: '#C7D2FE',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 10,
	},
	planButtonText: {
		fontSize: 14,
		fontWeight: '800',
		color: PRIMARY,
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: 10,
	},
	input: {
		flex: 1,
		minHeight: 48,
		maxHeight: 110,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#CBD5E1',
		paddingHorizontal: 14,
		paddingVertical: 12,
		fontSize: 15,
		color: '#0F172A',
		backgroundColor: '#FFFFFF',
	},
	sendButton: {
		height: 48,
		paddingHorizontal: 16,
		borderRadius: 12,
		backgroundColor: PRIMARY,
		justifyContent: 'center',
		alignItems: 'center',
	},
	sendButtonText: {
		fontSize: 14,
		fontWeight: '800',
		color: '#FFFFFF',
	},
	disabledButton: {
		opacity: 0.5,
	},
	messageRow: {
		marginBottom: 10,
		flexDirection: 'row',
	},
	userRow: {
		justifyContent: 'flex-end',
	},
	assistantRow: {
		justifyContent: 'flex-start',
	},
	bubble: {
		maxWidth: '82%',
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderRadius: 16,
	},
	userBubble: {
		backgroundColor: PRIMARY,
		borderBottomRightRadius: 6,
	},
	assistantBubble: {
		backgroundColor: '#F1F5F9',
		borderBottomLeftRadius: 6,
	},
	loadingBubble: {
		minWidth: 56,
		alignItems: 'center',
		justifyContent: 'center',
	},
	messageText: {
		fontSize: 14,
		lineHeight: 20,
		fontWeight: '600',
	},
	userText: {
		color: '#FFFFFF',
	},
	assistantText: {
		color: '#0F172A',
	},
});
