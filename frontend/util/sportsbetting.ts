// Copyright 2026, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

// Sports Betting Analytics & Market Analysis Utility Module
// Provides comprehensive metrics, probability models, and outlier detection
// for sports betting analysis integrated with Gemini AI.

// ---- Types ----

export type OddsFormat = "american" | "decimal" | "fractional";

export type OddsInput = {
    value: number;
    format: OddsFormat;
    // for fractional odds, numerator/denominator
    numerator?: number;
    denominator?: number;
};

export type MarketLine = {
    side: string;
    odds: OddsInput;
    stake?: number;
};

export type TwoWayMarket = {
    sideA: MarketLine;
    sideB: MarketLine;
};

export type PoissonPrediction = {
    exactGoals: number[];
    overProb: number;
    underProb: number;
    expectedGoals: number;
};

export type KellyResult = {
    fraction: number;
    quarterKelly: number;
    halfKelly: number;
    edge: number;
};

export type EVResult = {
    ev: number;
    evPercent: number;
    impliedProb: number;
    fairProb: number;
};

export type ArbitrageResult = {
    isArbitrage: boolean;
    totalImpliedProb: number;
    profitMargin: number;
    stakes: { side: string; stake: number; payout: number }[];
};

export type OutlierResult = {
    value: number;
    zScore: number;
    isOutlier: boolean;
    direction: "high" | "low" | "normal";
};

export type CLVResult = {
    openOdds: number;
    closeOdds: number;
    openImplied: number;
    closeImplied: number;
    clvPercent: number;
    beatsClose: boolean;
};

export type ParlayResult = {
    combinedOdds: number;
    impliedProb: number;
    payout: number;
    legs: { odds: number; impliedProb: number }[];
};

export type ROIResult = {
    roi: number;
    profit: number;
    totalStaked: number;
    totalReturned: number;
    winRate: number;
    avgOdds: number;
};

export type MarketAnalysisSummary = {
    vig: number;
    vigPercent: number;
    fairProbA: number;
    fairProbB: number;
    noVigOddsA: number;
    noVigOddsB: number;
    impliedProbA: number;
    impliedProbB: number;
    overround: number;
};

// ---- Odds Conversion ----

export function americanToDecimal(american: number): number {
    if (american > 0) {
        return american / 100 + 1;
    }
    return 100 / Math.abs(american) + 1;
}

export function decimalToAmerican(decimal: number): number {
    if (decimal >= 2) {
        return Math.round((decimal - 1) * 100);
    }
    return Math.round(-100 / (decimal - 1));
}

export function fractionalToDecimal(numerator: number, denominator: number): number {
    if (denominator === 0) {
        return 0;
    }
    return numerator / denominator + 1;
}

export function decimalToFractional(decimal: number): [number, number] {
    const fraction = decimal - 1;
    // simplify to common fractions
    const denominator = 100;
    const numerator = Math.round(fraction * denominator);
    const gcdVal = gcd(numerator, denominator);
    return [numerator / gcdVal, denominator / gcdVal];
}

export function toDecimalOdds(input: OddsInput): number {
    switch (input.format) {
        case "american":
            return americanToDecimal(input.value);
        case "decimal":
            return input.value;
        case "fractional":
            return fractionalToDecimal(input.numerator ?? 0, input.denominator ?? 1);
        default:
            return input.value;
    }
}

// ---- Implied Probability ----

export function impliedProbability(decimalOdds: number): number {
    if (decimalOdds <= 0) {
        return 0;
    }
    return 1 / decimalOdds;
}

export function impliedProbFromAmerican(american: number): number {
    return impliedProbability(americanToDecimal(american));
}

// ---- Vig / Juice / Overround ----

export function calculateVig(decimalOddsA: number, decimalOddsB: number): number {
    const totalImplied = impliedProbability(decimalOddsA) + impliedProbability(decimalOddsB);
    return totalImplied - 1;
}

export function calculateVigPercent(decimalOddsA: number, decimalOddsB: number): number {
    return calculateVig(decimalOddsA, decimalOddsB) * 100;
}

// ---- No-Vig Fair Odds ----

export function noVigProbabilities(decimalOddsA: number, decimalOddsB: number): [number, number] {
    const implA = impliedProbability(decimalOddsA);
    const implB = impliedProbability(decimalOddsB);
    const total = implA + implB;
    if (total === 0) {
        return [0, 0];
    }
    return [implA / total, implB / total];
}

export function noVigDecimalOdds(decimalOddsA: number, decimalOddsB: number): [number, number] {
    const [fairA, fairB] = noVigProbabilities(decimalOddsA, decimalOddsB);
    if (fairA === 0 || fairB === 0) {
        return [0, 0];
    }
    return [1 / fairA, 1 / fairB];
}

// ---- Full Market Analysis ----

export function analyzeMarket(decimalOddsA: number, decimalOddsB: number): MarketAnalysisSummary {
    const implA = impliedProbability(decimalOddsA);
    const implB = impliedProbability(decimalOddsB);
    const vig = calculateVig(decimalOddsA, decimalOddsB);
    const [fairA, fairB] = noVigProbabilities(decimalOddsA, decimalOddsB);
    const [noVigA, noVigB] = noVigDecimalOdds(decimalOddsA, decimalOddsB);

    return {
        vig: vig,
        vigPercent: vig * 100,
        fairProbA: fairA,
        fairProbB: fairB,
        noVigOddsA: noVigA,
        noVigOddsB: noVigB,
        impliedProbA: implA,
        impliedProbB: implB,
        overround: (implA + implB) * 100,
    };
}

// ---- Expected Value (EV) ----

export function expectedValue(fairProbability: number, decimalOdds: number, stake: number): EVResult {
    const impliedProb = impliedProbability(decimalOdds);
    const winAmount = stake * (decimalOdds - 1);
    const ev = fairProbability * winAmount - (1 - fairProbability) * stake;

    return {
        ev: ev,
        evPercent: (ev / stake) * 100,
        impliedProb: impliedProb,
        fairProb: fairProbability,
    };
}

export function isPositiveEV(fairProbability: number, decimalOdds: number): boolean {
    const result = expectedValue(fairProbability, decimalOdds, 1);
    return result.ev > 0;
}

// ---- Kelly Criterion ----

export function kellyCriterion(fairProbability: number, decimalOdds: number): KellyResult {
    const b = decimalOdds - 1;
    const p = fairProbability;
    const q = 1 - p;

    // Kelly formula: f* = (bp - q) / b
    const edge = b * p - q;
    let fraction = 0;
    if (b > 0) {
        fraction = edge / b;
    }

    // clamp to [0, 1]
    fraction = Math.max(0, Math.min(1, fraction));

    return {
        fraction: fraction,
        quarterKelly: fraction * 0.25,
        halfKelly: fraction * 0.5,
        edge: edge,
    };
}

// ---- Poisson Distribution ----

export function poissonPMF(k: number, lambda: number): number {
    if (lambda < 0 || k < 0) {
        return 0;
    }
    // P(X=k) = (lambda^k * e^(-lambda)) / k!
    let logP = -lambda + k * Math.log(lambda);
    for (let i = 2; i <= k; i++) {
        logP -= Math.log(i);
    }
    return Math.exp(logP);
}

export function poissonCDF(k: number, lambda: number): number {
    let sum = 0;
    for (let i = 0; i <= k; i++) {
        sum += poissonPMF(i, lambda);
    }
    return sum;
}

export function predictScoring(expectedGoals: number, maxGoals: number = 10): PoissonPrediction {
    const exactGoals: number[] = [];
    for (let k = 0; k <= maxGoals; k++) {
        exactGoals.push(poissonPMF(k, expectedGoals));
    }

    // over/under 2.5 goals as a common example
    const under25 = poissonCDF(2, expectedGoals);
    const over25 = 1 - under25;

    return {
        exactGoals: exactGoals,
        overProb: over25,
        underProb: under25,
        expectedGoals: expectedGoals,
    };
}

// ---- Closing Line Value (CLV) ----

export function closingLineValue(openDecimalOdds: number, closeDecimalOdds: number): CLVResult {
    const openImplied = impliedProbability(openDecimalOdds);
    const closeImplied = impliedProbability(closeDecimalOdds);

    // CLV = (closeImplied - openImplied) / openImplied * 100
    const clvPercent = ((closeImplied - openImplied) / openImplied) * 100;

    return {
        openOdds: openDecimalOdds,
        closeOdds: closeDecimalOdds,
        openImplied: openImplied,
        closeImplied: closeImplied,
        clvPercent: clvPercent,
        beatsClose: openDecimalOdds > closeDecimalOdds,
    };
}

// ---- Parlay / Accumulator Calculator ----

export function calculateParlay(decimalOddsList: number[], stake: number): ParlayResult {
    if (decimalOddsList.length === 0) {
        return { combinedOdds: 0, impliedProb: 0, payout: 0, legs: [] };
    }

    let combinedOdds = 1;
    let combinedProb = 1;
    const legs: { odds: number; impliedProb: number }[] = [];

    for (const odds of decimalOddsList) {
        combinedOdds *= odds;
        const prob = impliedProbability(odds);
        combinedProb *= prob;
        legs.push({ odds: odds, impliedProb: prob });
    }

    return {
        combinedOdds: combinedOdds,
        impliedProb: combinedProb,
        payout: stake * combinedOdds,
        legs: legs,
    };
}

// ---- Arbitrage Detection ----

export function detectArbitrage(
    markets: { side: string; decimalOdds: number }[],
    totalStake: number
): ArbitrageResult {
    const totalImplied = markets.reduce((sum, m) => sum + impliedProbability(m.decimalOdds), 0);
    const isArbitrage = totalImplied < 1;
    const profitMargin = isArbitrage ? (1 - totalImplied) * 100 : 0;

    const stakes = markets.map((m) => {
        const implied = impliedProbability(m.decimalOdds);
        const stake = (totalStake * implied) / totalImplied;
        return {
            side: m.side,
            stake: stake,
            payout: stake * m.decimalOdds,
        };
    });

    return {
        isArbitrage: isArbitrage,
        totalImpliedProb: totalImplied,
        profitMargin: profitMargin,
        stakes: stakes,
    };
}

// ---- ROI Tracker ----

export function calculateROI(bets: { stake: number; returned: number; odds: number }[]): ROIResult {
    if (bets.length === 0) {
        return { roi: 0, profit: 0, totalStaked: 0, totalReturned: 0, winRate: 0, avgOdds: 0 };
    }

    const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0);
    const totalReturned = bets.reduce((sum, b) => sum + b.returned, 0);
    const profit = totalReturned - totalStaked;
    const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0;
    const wins = bets.filter((b) => b.returned > 0).length;
    const winRate = (wins / bets.length) * 100;
    const avgOdds = bets.reduce((sum, b) => sum + b.odds, 0) / bets.length;

    return {
        roi: roi,
        profit: profit,
        totalStaked: totalStaked,
        totalReturned: totalReturned,
        winRate: winRate,
        avgOdds: avgOdds,
    };
}

// ---- Outlier Detection (Z-Score) ----

export function mean(values: number[]): number {
    if (values.length === 0) {
        return 0;
    }
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function standardDeviation(values: number[]): number {
    if (values.length < 2) {
        return 0;
    }
    const avg = mean(values);
    const squareDiffs = values.map((v) => (v - avg) ** 2);
    return Math.sqrt(squareDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1));
}

export function zScore(value: number, values: number[]): number {
    const avg = mean(values);
    const sd = standardDeviation(values);
    if (sd === 0) {
        return 0;
    }
    return (value - avg) / sd;
}

export function detectOutliers(values: number[], threshold: number = 2): OutlierResult[] {
    return values.map((v) => {
        const z = zScore(v, values);
        const absZ = Math.abs(z);
        return {
            value: v,
            zScore: z,
            isOutlier: absZ > threshold,
            direction: absZ > threshold ? (z > 0 ? "high" : "low") : "normal",
        };
    });
}

// ---- Line Movement Analysis ----

export type LineMovement = {
    timestamp: number;
    decimalOdds: number;
    impliedProb: number;
};

export type LineMovementAnalysis = {
    movements: LineMovement[];
    totalShift: number;
    direction: "shortening" | "drifting" | "stable";
    sharpMoney: boolean;
    averageOdds: number;
};

export function analyzeLineMovement(
    history: { timestamp: number; decimalOdds: number }[]
): LineMovementAnalysis {
    if (history.length < 2) {
        return {
            movements: history.map((h) => ({
                timestamp: h.timestamp,
                decimalOdds: h.decimalOdds,
                impliedProb: impliedProbability(h.decimalOdds),
            })),
            totalShift: 0,
            direction: "stable",
            sharpMoney: false,
            averageOdds: history.length > 0 ? history[0].decimalOdds : 0,
        };
    }

    const movements: LineMovement[] = history.map((h) => ({
        timestamp: h.timestamp,
        decimalOdds: h.decimalOdds,
        impliedProb: impliedProbability(h.decimalOdds),
    }));

    const first = history[0].decimalOdds;
    const last = history[history.length - 1].decimalOdds;
    const totalShift = last - first;
    const avgOdds = mean(history.map((h) => h.decimalOdds));

    // shortening = odds getting lower (more likely), drifting = odds getting higher
    let direction: "shortening" | "drifting" | "stable" = "stable";
    if (totalShift < -0.05) {
        direction = "shortening";
    } else if (totalShift > 0.05) {
        direction = "drifting";
    }

    // detect sharp money: significant shortening with reverse public sentiment
    const sharpMoney = direction === "shortening" && Math.abs(totalShift) > 0.1;

    return {
        movements: movements,
        totalShift: totalShift,
        direction: direction,
        sharpMoney: sharpMoney,
        averageOdds: avgOdds,
    };
}

// ---- Gemini AI Prompt Builder ----

export type SportsBettingPromptContext = {
    sport?: string;
    teams?: [string, string];
    market?: string;
    oddsA?: number;
    oddsB?: number;
    historicalData?: string;
    metrics?: Record<string, number>;
    customContext?: string;
};

export function buildGeminiAnalysisPrompt(context: SportsBettingPromptContext): string {
    const parts: string[] = [];

    parts.push(
        "You are an expert sports analyst and quantitative betting researcher. " +
            "Analyze the following sports betting scenario using advanced statistical methods. " +
            "Provide detailed insights covering probability assessment, value identification, " +
            "and risk analysis."
    );

    if (context.sport) {
        parts.push(`\nSport: ${context.sport}`);
    }

    if (context.teams) {
        parts.push(`Matchup: ${context.teams[0]} vs ${context.teams[1]}`);
    }

    if (context.market) {
        parts.push(`Market: ${context.market}`);
    }

    if (context.oddsA != null && context.oddsB != null) {
        const analysis = analyzeMarket(context.oddsA, context.oddsB);
        parts.push(`\nMarket Analysis:`);
        parts.push(`  Odds A (decimal): ${context.oddsA.toFixed(3)}`);
        parts.push(`  Odds B (decimal): ${context.oddsB.toFixed(3)}`);
        parts.push(`  Implied Probability A: ${(analysis.impliedProbA * 100).toFixed(1)}%`);
        parts.push(`  Implied Probability B: ${(analysis.impliedProbB * 100).toFixed(1)}%`);
        parts.push(`  Vig/Juice: ${analysis.vigPercent.toFixed(2)}%`);
        parts.push(`  Fair Probability A: ${(analysis.fairProbA * 100).toFixed(1)}%`);
        parts.push(`  Fair Probability B: ${(analysis.fairProbB * 100).toFixed(1)}%`);
        parts.push(`  No-Vig Odds A: ${analysis.noVigOddsA.toFixed(3)}`);
        parts.push(`  No-Vig Odds B: ${analysis.noVigOddsB.toFixed(3)}`);
    }

    if (context.metrics) {
        parts.push(`\nAdditional Metrics:`);
        for (const [key, value] of Object.entries(context.metrics)) {
            parts.push(`  ${key}: ${value}`);
        }
    }

    if (context.historicalData) {
        parts.push(`\nHistorical Context:\n${context.historicalData}`);
    }

    if (context.customContext) {
        parts.push(`\nAdditional Context:\n${context.customContext}`);
    }

    parts.push(
        "\nPlease analyze this scenario and provide:" +
            "\n1. Probability assessment and fair odds estimation" +
            "\n2. Expected value analysis" +
            "\n3. Key statistical factors and potential outliers" +
            "\n4. Risk assessment and bankroll management recommendation (Kelly Criterion)" +
            "\n5. Line value assessment and market efficiency analysis" +
            "\n6. Any edges or inefficiencies identified"
    );

    return parts.join("\n");
}

// ---- Helper: Greatest Common Divisor ----

function gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b > 0) {
        [a, b] = [b, a % b];
    }
    return a;
}
