import React, { useState, useEffect } from 'react';
import { Chart } from 'primereact/chart';
import { MoveFrequencyResult } from '../workers/frequencyAnalysisTypes';
import { useCoverageCache } from './useCoverageCache';

interface UsageSphereProps {
  moves: MoveFrequencyResult[];
  coveragePercentage: number;
  isUserTurn: boolean;
  onMoveClick?: (move: MoveFrequencyResult) => void;
}

export default function UsageSphere({ moves, coveragePercentage, isUserTurn, onMoveClick }: UsageSphereProps) {
    const [chartData, setChartData] = useState({});
    const [chartOptions, setChartOptions] = useState({});
    const coverageCache = useCoverageCache((state) => state.coverageCache);

    useEffect(() => {
        if (!moves || moves.length === 0) return;

        const timer = setTimeout(() => {
        const documentStyle = getComputedStyle(document.documentElement);
        const green = documentStyle.getPropertyValue('--green-500');
        const greenHover = documentStyle.getPropertyValue('--green-400');
        const red = documentStyle.getPropertyValue('--red-500');
        const redHover = documentStyle.getPropertyValue('--red-400');
        const blue = documentStyle.getPropertyValue('--blue-500');
        const blueHover = documentStyle.getPropertyValue('--blue-400');
        const yellow = documentStyle.getPropertyValue('--yellow-500');
        const yellowHover = documentStyle.getPropertyValue('--yellow-400');

        const dataPoints: number[] = [];
        const bgColors: string[] = [];
        const hoverColors: string[] = [];
        const labels: string[] = [];

        for (const move of moves) {
            const cached = coverageCache[move.resultingFen];
            const coverage = cached?.coverage; // 0–100

            if (coverage !== undefined && coverage < 100) {
                const coveredGames = move.totalGames * (coverage / 100);
                const uncoveredGames = move.totalGames * (1 - coverage / 100);
                dataPoints.push(coveredGames, uncoveredGames);
                bgColors.push(green, red);
                hoverColors.push(greenHover, redHover);
                labels.push(`${move.san} (covered)`, `${move.san} (gap)`);
            } else {
                // 100% covered, or coverage data not yet loaded — use original coloring
                const fullyKnown = coverage === 100 || move.inRepertoire;
                const baseColor = fullyKnown ? green : isUserTurn ? yellow : blue;
                const hoverColor = fullyKnown ? greenHover : isUserTurn ? yellowHover : blueHover;
                dataPoints.push(move.totalGames);
                bgColors.push(baseColor);
                hoverColors.push(hoverColor);
                labels.push(move.san);
            }
        }

        setChartData({
            labels,
            datasets: [
                {
                    data: dataPoints,
                    backgroundColor: bgColors,
                    hoverBackgroundColor: hoverColors,
                    borderWidth: 1,
                },
            ],
        });

        setChartOptions({
            cutout: '70%',
            onClick: (evt: any, item: any) => {
                console.log("Got click", evt, item);
                if (item.length === 0) return;
                const index = item[0].index;
                const label = labels[index];
                const moveSan = label.split(' ')[0]; // Extract SAN from label
                const move = moves.find((m) => m.san === moveSan);
                if (move) {
                    onMoveClick?.(move);
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx: any) =>
                            `${ctx.label}: ${Math.round(ctx.raw as number).toLocaleString()} games`,
                    },
                },
            },
        });
        }, 2000);

        return () => clearTimeout(timer);
    }, [moves, isUserTurn, coverageCache]);

    if (!moves || moves.length === 0) return null;

    return (
        <div style={{ position: 'relative', width: 200, height: 200 }}>
            <Chart
                type="doughnut"
                data={chartData}
                options={chartOptions}
                style={{ width: 200, height: 200 }}
            />
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    lineHeight: 1.2,
                }}
            >
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    {coveragePercentage.toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>covered</div>
            </div>
        </div>
    );
}