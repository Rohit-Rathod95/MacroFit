import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';

export default function SimpleLineChart({ data, width = 320, height = 180, color = '#4F46E5' }) {
	if (!Array.isArray(data) || data.length === 0) {
		return (
			<View style={[styles.emptyBox, { width, height }]}>
				<Text style={styles.emptyText}>No weight entries yet</Text>
			</View>
		);
	}

	const padding = 30;
	const chartW = width - padding * 2;
	const chartH = height - padding * 2;
	const values = data.map((item) => Number(item?.weightKg) || 0);
	const minVal = Math.min(...values) - 1;
	const maxVal = Math.max(...values) + 1;
	const range = maxVal - minVal || 1;

	const points = data.map((item, index) => {
		const x =
			padding +
			(data.length === 1 ? chartW / 2 : (index / (data.length - 1)) * chartW);
		const y =
			padding + chartH - ((Number(item?.weightKg) - minVal) / range) * chartH;
		return { x, y };
	});

	const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(' ');
	const gridYs = [padding, padding + chartH / 2, padding + chartH];

	return (
		<Svg width={width} height={height}>
			{gridYs.map((y) => (
				<Line
					key={`grid-${y}`}
					x1={padding}
					y1={y}
					x2={width - padding}
					y2={y}
					stroke="#E5E7EB"
					strokeWidth="1"
				/>
			))}

			<Polyline
				points={polylinePoints}
				fill="none"
				stroke={color}
				strokeWidth="2.5"
				strokeLinejoin="round"
				strokeLinecap="round"
			/>

			{points.map((point, index) => (
				<Circle
					key={`point-${data[index]?.date || index}`}
					cx={point.x}
					cy={point.y}
					r={4}
					fill={color}
				/>
			))}

			<SvgText
				x={8}
				y={padding + 10}
				fill="#9CA3AF"
				fontSize="11"
				fontWeight="600"
			>
				{maxVal.toFixed(1)} kg
			</SvgText>

			<SvgText
				x={8}
				y={height - 10}
				fill="#9CA3AF"
				fontSize="11"
				fontWeight="600"
			>
				{minVal.toFixed(1)} kg
			</SvgText>
		</Svg>
	);
}

const styles = StyleSheet.create({
	emptyBox: {
		borderRadius: 14,
		backgroundColor: '#F8FAFC',
		borderWidth: 1,
		borderColor: '#E5E7EB',
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyText: {
		fontSize: 14,
		color: '#9CA3AF',
		fontWeight: '600',
	},
});
