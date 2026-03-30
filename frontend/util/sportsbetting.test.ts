// Copyright 2026, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";

import {
    americanToDecimal,
    analyzeLineMovement,
    analyzeMarket,
    calculateParlay,
    calculateROI,
    calculateVig,
    closingLineValue,
    decimalToAmerican,
    decimalToFractional,
    detectArbitrage,
    detectOutliers,
    expectedValue,
    fractionalToDecimal,
    impliedProbability,
    isPositiveEV,
    kellyCriterion,
    mean,
    noVigDecimalOdds,
    noVigProbabilities,
    poissonCDF,
    poissonPMF,
    predictScoring,
    standardDeviation,
    zScore,
    buildGeminiAnalysisPrompt,
} from "./sportsbetting";

describe("odds conversion", () => {
    it("converts positive american to decimal", () => {
        expect(americanToDecimal(200)).toBeCloseTo(3.0);
        expect(americanToDecimal(100)).toBeCloseTo(2.0);
        expect(americanToDecimal(150)).toBeCloseTo(2.5);
    });

    it("converts negative american to decimal", () => {
        expect(americanToDecimal(-150)).toBeCloseTo(1.6667, 3);
        expect(americanToDecimal(-200)).toBeCloseTo(1.5);
        expect(americanToDecimal(-110)).toBeCloseTo(1.9091, 3);
    });

    it("converts decimal to american", () => {
        expect(decimalToAmerican(3.0)).toBe(200);
        expect(decimalToAmerican(2.0)).toBe(100);
        expect(decimalToAmerican(1.5)).toBe(-200);
    });

    it("converts fractional to decimal", () => {
        expect(fractionalToDecimal(5, 2)).toBeCloseTo(3.5);
        expect(fractionalToDecimal(1, 1)).toBeCloseTo(2.0);
        expect(fractionalToDecimal(1, 4)).toBeCloseTo(1.25);
    });

    it("handles fractional with zero denominator", () => {
        expect(fractionalToDecimal(5, 0)).toBe(0);
    });

    it("converts decimal to fractional", () => {
        const [num, den] = decimalToFractional(3.0);
        expect(num / den).toBeCloseTo(2.0);
    });
});

describe("implied probability", () => {
    it("calculates implied probability from decimal odds", () => {
        expect(impliedProbability(2.0)).toBeCloseTo(0.5);
        expect(impliedProbability(1.5)).toBeCloseTo(0.6667, 3);
        expect(impliedProbability(3.0)).toBeCloseTo(0.3333, 3);
    });

    it("returns 0 for non-positive odds", () => {
        expect(impliedProbability(0)).toBe(0);
        expect(impliedProbability(-1)).toBe(0);
    });
});

describe("vig/juice calculation", () => {
    it("calculates vig for standard -110/-110 market", () => {
        const oddsA = americanToDecimal(-110);
        const oddsB = americanToDecimal(-110);
        const vig = calculateVig(oddsA, oddsB);
        expect(vig).toBeGreaterThan(0);
        expect(vig).toBeCloseTo(0.0476, 3);
    });

    it("calculates zero vig for fair market", () => {
        expect(calculateVig(2.0, 2.0)).toBeCloseTo(0);
    });
});

describe("no-vig probabilities", () => {
    it("removes vig from a standard market", () => {
        const oddsA = americanToDecimal(-110);
        const oddsB = americanToDecimal(-110);
        const [fairA, fairB] = noVigProbabilities(oddsA, oddsB);
        expect(fairA).toBeCloseTo(0.5);
        expect(fairB).toBeCloseTo(0.5);
        expect(fairA + fairB).toBeCloseTo(1.0);
    });

    it("calculates no-vig decimal odds", () => {
        const [noVigA, noVigB] = noVigDecimalOdds(1.909, 1.909);
        expect(noVigA).toBeCloseTo(2.0, 1);
        expect(noVigB).toBeCloseTo(2.0, 1);
    });
});

describe("market analysis", () => {
    it("provides full market summary", () => {
        const result = analyzeMarket(1.909, 1.909);
        expect(result.vig).toBeGreaterThan(0);
        expect(result.fairProbA + result.fairProbB).toBeCloseTo(1.0);
        expect(result.overround).toBeGreaterThan(100);
    });
});

describe("expected value", () => {
    it("calculates positive EV when fair prob exceeds implied", () => {
        const result = expectedValue(0.55, americanToDecimal(-110), 100);
        expect(result.ev).toBeGreaterThan(0);
        expect(result.evPercent).toBeGreaterThan(0);
    });

    it("calculates negative EV when implied prob exceeds fair", () => {
        const result = expectedValue(0.45, americanToDecimal(-110), 100);
        expect(result.ev).toBeLessThan(0);
    });

    it("detects positive EV correctly", () => {
        expect(isPositiveEV(0.55, americanToDecimal(-110))).toBe(true);
        expect(isPositiveEV(0.45, americanToDecimal(-110))).toBe(false);
    });
});

describe("kelly criterion", () => {
    it("calculates optimal bet fraction", () => {
        const result = kellyCriterion(0.55, 2.0);
        expect(result.fraction).toBeCloseTo(0.1);
        expect(result.halfKelly).toBeCloseTo(0.05);
        expect(result.quarterKelly).toBeCloseTo(0.025);
        expect(result.edge).toBeGreaterThan(0);
    });

    it("returns zero fraction for negative edge", () => {
        const result = kellyCriterion(0.3, 2.0);
        expect(result.fraction).toBe(0);
        expect(result.edge).toBeLessThan(0);
    });

    it("clamps fraction to maximum of 1", () => {
        const result = kellyCriterion(0.99, 10.0);
        expect(result.fraction).toBeLessThanOrEqual(1);
    });
});

describe("poisson distribution", () => {
    it("calculates PMF correctly", () => {
        const p0 = poissonPMF(0, 2.5);
        expect(p0).toBeCloseTo(Math.exp(-2.5), 4);
    });

    it("CDF sums to near 1 for large k", () => {
        expect(poissonCDF(30, 2.5)).toBeCloseTo(1.0, 6);
    });

    it("predicts scoring distribution", () => {
        const prediction = predictScoring(2.5);
        expect(prediction.exactGoals.length).toBe(11);
        expect(prediction.overProb + prediction.underProb).toBeCloseTo(1.0, 6);
        expect(prediction.expectedGoals).toBe(2.5);
    });

    it("returns 0 for negative inputs", () => {
        expect(poissonPMF(-1, 2.5)).toBe(0);
        expect(poissonPMF(2, -1)).toBe(0);
    });
});

describe("closing line value", () => {
    it("detects when bet beats the close", () => {
        const result = closingLineValue(2.1, 1.9);
        expect(result.beatsClose).toBe(true);
        expect(result.clvPercent).toBeGreaterThan(0);
    });

    it("detects when bet does not beat the close", () => {
        const result = closingLineValue(1.9, 2.1);
        expect(result.beatsClose).toBe(false);
        expect(result.clvPercent).toBeLessThan(0);
    });
});

describe("parlay calculator", () => {
    it("calculates combined odds and payout", () => {
        const result = calculateParlay([2.0, 2.0, 2.0], 100);
        expect(result.combinedOdds).toBeCloseTo(8.0);
        expect(result.payout).toBeCloseTo(800);
        expect(result.impliedProb).toBeCloseTo(0.125);
        expect(result.legs).toHaveLength(3);
    });

    it("handles empty legs", () => {
        const result = calculateParlay([], 100);
        expect(result.combinedOdds).toBe(0);
        expect(result.payout).toBe(0);
    });
});

describe("arbitrage detection", () => {
    it("detects arbitrage opportunity", () => {
        const result = detectArbitrage(
            [
                { side: "A", decimalOdds: 2.2 },
                { side: "B", decimalOdds: 2.2 },
            ],
            1000
        );
        expect(result.isArbitrage).toBe(true);
        expect(result.profitMargin).toBeGreaterThan(0);
    });

    it("detects no arbitrage in typical market", () => {
        const result = detectArbitrage(
            [
                { side: "A", decimalOdds: 1.909 },
                { side: "B", decimalOdds: 1.909 },
            ],
            1000
        );
        expect(result.isArbitrage).toBe(false);
        expect(result.profitMargin).toBe(0);
    });
});

describe("ROI tracker", () => {
    it("calculates ROI for a set of bets", () => {
        const bets = [
            { stake: 100, returned: 200, odds: 2.0 },
            { stake: 100, returned: 0, odds: 2.0 },
            { stake: 100, returned: 300, odds: 3.0 },
        ];
        const result = calculateROI(bets);
        expect(result.totalStaked).toBe(300);
        expect(result.totalReturned).toBe(500);
        expect(result.profit).toBe(200);
        expect(result.roi).toBeCloseTo(66.67, 1);
        expect(result.winRate).toBeCloseTo(66.67, 1);
    });

    it("handles empty bets", () => {
        const result = calculateROI([]);
        expect(result.roi).toBe(0);
        expect(result.profit).toBe(0);
    });
});

describe("outlier detection", () => {
    it("detects statistical outliers", () => {
        const values = [10, 12, 11, 13, 10, 11, 12, 50];
        const results = detectOutliers(values);
        const outliers = results.filter((r) => r.isOutlier);
        expect(outliers.length).toBeGreaterThan(0);
        expect(outliers[0].value).toBe(50);
        expect(outliers[0].direction).toBe("high");
    });

    it("finds no outliers in uniform data", () => {
        const values = [10, 10, 10, 10, 10];
        const results = detectOutliers(values);
        const outliers = results.filter((r) => r.isOutlier);
        expect(outliers.length).toBe(0);
    });
});

describe("statistics helpers", () => {
    it("calculates mean", () => {
        expect(mean([1, 2, 3, 4, 5])).toBe(3);
        expect(mean([])).toBe(0);
    });

    it("calculates standard deviation", () => {
        expect(standardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 2);
        expect(standardDeviation([])).toBe(0);
        expect(standardDeviation([5])).toBe(0);
    });

    it("calculates z-score", () => {
        const values = [10, 20, 30, 40, 50];
        const z = zScore(50, values);
        expect(z).toBeGreaterThan(1);
    });
});

describe("line movement analysis", () => {
    it("detects shortening line", () => {
        const history = [
            { timestamp: 1000, decimalOdds: 2.5 },
            { timestamp: 2000, decimalOdds: 2.3 },
            { timestamp: 3000, decimalOdds: 2.1 },
        ];
        const result = analyzeLineMovement(history);
        expect(result.direction).toBe("shortening");
        expect(result.totalShift).toBeLessThan(0);
    });

    it("detects drifting line", () => {
        const history = [
            { timestamp: 1000, decimalOdds: 2.0 },
            { timestamp: 2000, decimalOdds: 2.2 },
            { timestamp: 3000, decimalOdds: 2.5 },
        ];
        const result = analyzeLineMovement(history);
        expect(result.direction).toBe("drifting");
        expect(result.totalShift).toBeGreaterThan(0);
    });

    it("detects stable line", () => {
        const history = [
            { timestamp: 1000, decimalOdds: 2.0 },
            { timestamp: 2000, decimalOdds: 2.01 },
        ];
        const result = analyzeLineMovement(history);
        expect(result.direction).toBe("stable");
    });

    it("handles single data point", () => {
        const result = analyzeLineMovement([{ timestamp: 1000, decimalOdds: 2.0 }]);
        expect(result.direction).toBe("stable");
        expect(result.totalShift).toBe(0);
    });
});

describe("gemini prompt builder", () => {
    it("builds a prompt with full context", () => {
        const prompt = buildGeminiAnalysisPrompt({
            sport: "NFL",
            teams: ["Kansas City Chiefs", "San Francisco 49ers"],
            market: "Moneyline",
            oddsA: 1.8,
            oddsB: 2.1,
            metrics: { "home_win_pct": 0.65 },
            customContext: "Playoff game",
        });
        expect(prompt).toContain("NFL");
        expect(prompt).toContain("Kansas City Chiefs");
        expect(prompt).toContain("San Francisco 49ers");
        expect(prompt).toContain("Moneyline");
        expect(prompt).toContain("Implied Probability");
        expect(prompt).toContain("Vig/Juice");
        expect(prompt).toContain("Kelly Criterion");
        expect(prompt).toContain("Playoff game");
    });

    it("builds a minimal prompt", () => {
        const prompt = buildGeminiAnalysisPrompt({});
        expect(prompt).toContain("expert sports analyst");
        expect(prompt).toContain("Expected value analysis");
    });
});
