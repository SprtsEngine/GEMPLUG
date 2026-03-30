// Copyright 2026, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import * as React from "react";
import {
    americanToDecimal,
    analyzeMarket,
    expectedValue,
    kellyCriterion,
    predictScoring,
    detectOutliers,
    calculateParlay,
    detectArbitrage,
    closingLineValue,
    calculateROI,
    buildGeminiAnalysisPrompt,
    type MarketAnalysisSummary,
    type EVResult,
    type KellyResult,
    type PoissonPrediction,
    type OutlierResult,
    type CLVResult,
    type ArbitrageResult,
    type ParlayResult,
    type ROIResult,
} from "@/util/sportsbetting";
import { SportsbookViewModel } from "./sportsbook-model";

type AnalysisTab = "market" | "ev" | "kelly" | "poisson" | "outliers" | "parlay" | "arb" | "clv" | "roi" | "gemini";

function SportsbookView({ model }: { model: SportsbookViewModel }) {
    const [activeTab, setActiveTab] = React.useState<AnalysisTab>("market");
    const [oddsA, setOddsA] = React.useState("-110");
    const [oddsB, setOddsB] = React.useState("+110");
    const [fairProb, setFairProb] = React.useState("55");
    const [stake, setStake] = React.useState("100");
    const [expectedGoals, setExpectedGoals] = React.useState("2.5");
    const [outlierInput, setOutlierInput] = React.useState("10, 12, 11, 13, 10, 50");
    const [parlayLegs, setParlayLegs] = React.useState("2.0, 1.8, 2.5");
    const [openOdds, setOpenOdds] = React.useState("2.1");
    const [closeOdds, setCloseOdds] = React.useState("1.9");
    const [geminiPrompt, setGeminiPrompt] = React.useState("");
    const [sport, setSport] = React.useState("NFL");
    const [teamA, setTeamA] = React.useState("");
    const [teamB, setTeamB] = React.useState("");

    const tabs: { key: AnalysisTab; label: string; icon: string }[] = [
        { key: "market", label: "Market", icon: "📊" },
        { key: "ev", label: "EV", icon: "💰" },
        { key: "kelly", label: "Kelly", icon: "🎯" },
        { key: "poisson", label: "Poisson", icon: "⚽" },
        { key: "outliers", label: "Outliers", icon: "📈" },
        { key: "parlay", label: "Parlay", icon: "🔗" },
        { key: "arb", label: "Arbitrage", icon: "⚖️" },
        { key: "clv", label: "CLV", icon: "📉" },
        { key: "roi", label: "ROI", icon: "💵" },
        { key: "gemini", label: "Gemini AI", icon: "✨" },
    ];

    const decOddsA = americanToDecimal(parseFloat(oddsA) || -110);
    const decOddsB = americanToDecimal(parseFloat(oddsB) || 110);
    const fairProbNum = (parseFloat(fairProb) || 50) / 100;
    const stakeNum = parseFloat(stake) || 100;

    function renderMarketAnalysis() {
        const analysis: MarketAnalysisSummary = analyzeMarket(decOddsA, decOddsB);
        return (
            <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Market Analysis</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Implied Prob A:</div>
                    <div className="font-mono">{(analysis.impliedProbA * 100).toFixed(2)}%</div>
                    <div>Implied Prob B:</div>
                    <div className="font-mono">{(analysis.impliedProbB * 100).toFixed(2)}%</div>
                    <div>Vig/Juice:</div>
                    <div className="font-mono">{analysis.vigPercent.toFixed(2)}%</div>
                    <div>Overround:</div>
                    <div className="font-mono">{analysis.overround.toFixed(2)}%</div>
                    <div>Fair Prob A:</div>
                    <div className="font-mono">{(analysis.fairProbA * 100).toFixed(2)}%</div>
                    <div>Fair Prob B:</div>
                    <div className="font-mono">{(analysis.fairProbB * 100).toFixed(2)}%</div>
                    <div>No-Vig Odds A:</div>
                    <div className="font-mono">{analysis.noVigOddsA.toFixed(3)}</div>
                    <div>No-Vig Odds B:</div>
                    <div className="font-mono">{analysis.noVigOddsB.toFixed(3)}</div>
                </div>
            </div>
        );
    }

    function renderEV() {
        const result: EVResult = expectedValue(fairProbNum, decOddsA, stakeNum);
        const isPositive = result.ev > 0;
        return (
            <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Expected Value Analysis</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Expected Value:</div>
                    <div className={`font-mono ${isPositive ? "text-green-400" : "text-red-400"}`}>
                        ${result.ev.toFixed(2)}
                    </div>
                    <div>EV %:</div>
                    <div className={`font-mono ${isPositive ? "text-green-400" : "text-red-400"}`}>
                        {result.evPercent.toFixed(2)}%
                    </div>
                    <div>Implied Probability:</div>
                    <div className="font-mono">{(result.impliedProb * 100).toFixed(2)}%</div>
                    <div>Your Fair Prob:</div>
                    <div className="font-mono">{(result.fairProb * 100).toFixed(2)}%</div>
                    <div>Edge:</div>
                    <div className={`font-mono ${isPositive ? "text-green-400" : "text-red-400"}`}>
                        {isPositive ? "+EV ✓" : "-EV ✗"}
                    </div>
                </div>
            </div>
        );
    }

    function renderKelly() {
        const result: KellyResult = kellyCriterion(fairProbNum, decOddsA);
        return (
            <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Kelly Criterion</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Full Kelly:</div>
                    <div className="font-mono">{(result.fraction * 100).toFixed(2)}% of bankroll</div>
                    <div>Half Kelly:</div>
                    <div className="font-mono">{(result.halfKelly * 100).toFixed(2)}% of bankroll</div>
                    <div>Quarter Kelly:</div>
                    <div className="font-mono">{(result.quarterKelly * 100).toFixed(2)}% of bankroll</div>
                    <div>Edge:</div>
                    <div className={`font-mono ${result.edge > 0 ? "text-green-400" : "text-red-400"}`}>
                        {(result.edge * 100).toFixed(2)}%
                    </div>
                </div>
                <p className="text-xs opacity-60 mt-2">
                    Half Kelly is recommended for most bettors to reduce variance.
                </p>
            </div>
        );
    }

    function renderPoisson() {
        const lambda = parseFloat(expectedGoals) || 2.5;
        const prediction: PoissonPrediction = predictScoring(lambda);
        return (
            <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Poisson Scoring Model</h3>
                <div className="text-sm mb-2">Expected Goals: {lambda}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Over 2.5:</div>
                    <div className="font-mono">{(prediction.overProb * 100).toFixed(1)}%</div>
                    <div>Under 2.5:</div>
                    <div className="font-mono">{(prediction.underProb * 100).toFixed(1)}%</div>
                </div>
                <div className="mt-2 text-sm">
                    <div className="font-semibold mb-1">Exact Goal Probabilities:</div>
                    <div className="grid grid-cols-4 gap-1 text-xs font-mono">
                        {prediction.exactGoals.map((prob, i) => (
                            <div key={i}>
                                {i} goals: {(prob * 100).toFixed(1)}%
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    function renderOutliers() {
        const values = outlierInput
            .split(",")
            .map((v) => parseFloat(v.trim()))
            .filter((v) => !isNaN(v));
        const results: OutlierResult[] = detectOutliers(values);
        return (
            <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Outlier Detection (Z-Score)</h3>
                <div className="text-sm">
                    <div className="grid grid-cols-4 gap-1 text-xs font-mono font-semibold border-b border-white/20 pb-1 mb-1">
                        <div>Value</div>
                        <div>Z-Score</div>
                        <div>Outlier?</div>
                        <div>Direction</div>
                    </div>
                    {results.map((r, i) => (
                        <div
                            key={i}
                            className={`grid grid-cols-4 gap-1 text-xs font-mono ${r.isOutlier ? "text-yellow-400" : ""}`}
                        >
                            <div>{r.value}</div>
                            <div>{r.zScore.toFixed(2)}</div>
                            <div>{r.isOutlier ? "YES" : "No"}</div>
                            <div>{r.direction}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    function renderParlay() {
        const legs = parlayLegs
            .split(",")
            .map((v) => parseFloat(v.trim()))
            .filter((v) => !isNaN(v) && v > 1);
        const result: ParlayResult = calculateParlay(legs, stakeNum);
        return (
            <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Parlay Calculator</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Combined Odds:</div>
                    <div className="font-mono">{result.combinedOdds.toFixed(3)}</div>
                    <div>Implied Prob:</div>
                    <div className="font-mono">{(result.impliedProb * 100).toFixed(2)}%</div>
                    <div>Payout:</div>
                    <div className="font-mono text-green-400">${result.payout.toFixed(2)}</div>
                </div>
                <div className="mt-2 text-xs font-mono">
                    {result.legs.map((leg, i) => (
                        <div key={i}>
                            Leg {i + 1}: {leg.odds.toFixed(2)} ({(leg.impliedProb * 100).toFixed(1)}%)
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    function renderArbitrage() {
        const result: ArbitrageResult = detectArbitrage(
            [
                { side: "Side A", decimalOdds: decOddsA },
                { side: "Side B", decimalOdds: decOddsB },
            ],
            stakeNum
        );
        return (
            <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Arbitrage Detection</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Arbitrage Found:</div>
                    <div className={`font-mono ${result.isArbitrage ? "text-green-400" : "text-red-400"}`}>
                        {result.isArbitrage ? "YES ✓" : "NO ✗"}
                    </div>
                    <div>Total Implied Prob:</div>
                    <div className="font-mono">{(result.totalImpliedProb * 100).toFixed(2)}%</div>
                    <div>Profit Margin:</div>
                    <div className="font-mono">{result.profitMargin.toFixed(2)}%</div>
                </div>
                {result.isArbitrage && (
                    <div className="mt-2 text-xs font-mono">
                        {result.stakes.map((s, i) => (
                            <div key={i}>
                                {s.side}: Stake ${s.stake.toFixed(2)} → Payout ${s.payout.toFixed(2)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    function renderCLV() {
        const open = parseFloat(openOdds) || 2.1;
        const close = parseFloat(closeOdds) || 1.9;
        const result: CLVResult = closingLineValue(open, close);
        return (
            <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Closing Line Value</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Open Odds:</div>
                    <div className="font-mono">{result.openOdds.toFixed(3)}</div>
                    <div>Close Odds:</div>
                    <div className="font-mono">{result.closeOdds.toFixed(3)}</div>
                    <div>Open Implied:</div>
                    <div className="font-mono">{(result.openImplied * 100).toFixed(2)}%</div>
                    <div>Close Implied:</div>
                    <div className="font-mono">{(result.closeImplied * 100).toFixed(2)}%</div>
                    <div>CLV %:</div>
                    <div className={`font-mono ${result.beatsClose ? "text-green-400" : "text-red-400"}`}>
                        {result.clvPercent.toFixed(2)}%
                    </div>
                    <div>Beats Close:</div>
                    <div className={`font-mono ${result.beatsClose ? "text-green-400" : "text-red-400"}`}>
                        {result.beatsClose ? "YES ✓" : "NO ✗"}
                    </div>
                </div>
            </div>
        );
    }

    function renderROI() {
        const sampleBets = [
            { stake: 100, returned: 190, odds: 1.9 },
            { stake: 100, returned: 0, odds: 2.1 },
            { stake: 50, returned: 150, odds: 3.0 },
            { stake: 100, returned: 180, odds: 1.8 },
            { stake: 75, returned: 0, odds: 2.5 },
        ];
        const result: ROIResult = calculateROI(sampleBets);
        return (
            <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">ROI Tracker (Sample Data)</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Total Staked:</div>
                    <div className="font-mono">${result.totalStaked.toFixed(2)}</div>
                    <div>Total Returned:</div>
                    <div className="font-mono">${result.totalReturned.toFixed(2)}</div>
                    <div>Profit:</div>
                    <div className={`font-mono ${result.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                        ${result.profit.toFixed(2)}
                    </div>
                    <div>ROI:</div>
                    <div className={`font-mono ${result.roi >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {result.roi.toFixed(2)}%
                    </div>
                    <div>Win Rate:</div>
                    <div className="font-mono">{result.winRate.toFixed(1)}%</div>
                    <div>Avg Odds:</div>
                    <div className="font-mono">{result.avgOdds.toFixed(2)}</div>
                </div>
            </div>
        );
    }

    function renderGemini() {
        const prompt = buildGeminiAnalysisPrompt({
            sport: sport || undefined,
            teams: teamA && teamB ? [teamA, teamB] : undefined,
            market: "Moneyline",
            oddsA: decOddsA,
            oddsB: decOddsB,
        });

        return (
            <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Gemini AI Analysis Prompt</h3>
                <p className="text-xs opacity-60">
                    Generated prompt for Gemini AI analysis. Copy this into the WaveAI chat with a Gemini model selected.
                </p>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <input
                            className="flex-1 bg-white/10 rounded px-2 py-1 text-sm"
                            placeholder="Sport (e.g. NFL)"
                            value={sport}
                            onChange={(e) => setSport(e.target.value)}
                        />
                        <input
                            className="flex-1 bg-white/10 rounded px-2 py-1 text-sm"
                            placeholder="Team A"
                            value={teamA}
                            onChange={(e) => setTeamA(e.target.value)}
                        />
                        <input
                            className="flex-1 bg-white/10 rounded px-2 py-1 text-sm"
                            placeholder="Team B"
                            value={teamB}
                            onChange={(e) => setTeamB(e.target.value)}
                        />
                    </div>
                </div>
                <pre className="bg-white/5 rounded p-3 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-64">
                    {prompt}
                </pre>
                <button
                    className="bg-accent/80 text-primary rounded hover:bg-accent transition-colors cursor-pointer px-3 py-1 text-sm self-start"
                    onClick={() => {
                        navigator.clipboard.writeText(prompt);
                        setGeminiPrompt("Copied!");
                        setTimeout(() => setGeminiPrompt(""), 2000);
                    }}
                >
                    {geminiPrompt || "Copy Prompt to Clipboard"}
                </button>
            </div>
        );
    }

    function renderContent() {
        switch (activeTab) {
            case "market":
                return renderMarketAnalysis();
            case "ev":
                return renderEV();
            case "kelly":
                return renderKelly();
            case "poisson":
                return renderPoisson();
            case "outliers":
                return renderOutliers();
            case "parlay":
                return renderParlay();
            case "arb":
                return renderArbitrage();
            case "clv":
                return renderCLV();
            case "roi":
                return renderROI();
            case "gemini":
                return renderGemini();
            default:
                return null;
        }
    }

    return (
        <div className="flex flex-col h-full w-full p-4 gap-4 overflow-auto">
            <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold">Sports Betting Analytics</h2>
                <p className="text-xs opacity-60">
                    Comprehensive sports market analysis with Gemini AI integration
                </p>
            </div>

            <div className="flex flex-col gap-3 p-3 bg-white/5 rounded">
                <div className="text-sm font-semibold">Odds Input (American)</div>
                <div className="flex gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                        <label className="text-xs">Side A:</label>
                        <input
                            className="bg-white/10 rounded px-2 py-1 text-sm w-24 font-mono"
                            value={oddsA}
                            onChange={(e) => setOddsA(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <label className="text-xs">Side B:</label>
                        <input
                            className="bg-white/10 rounded px-2 py-1 text-sm w-24 font-mono"
                            value={oddsB}
                            onChange={(e) => setOddsB(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <label className="text-xs">Fair Prob %:</label>
                        <input
                            className="bg-white/10 rounded px-2 py-1 text-sm w-20 font-mono"
                            value={fairProb}
                            onChange={(e) => setFairProb(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <label className="text-xs">Stake $:</label>
                        <input
                            className="bg-white/10 rounded px-2 py-1 text-sm w-20 font-mono"
                            value={stake}
                            onChange={(e) => setStake(e.target.value)}
                        />
                    </div>
                </div>
                {activeTab === "poisson" && (
                    <div className="flex items-center gap-1">
                        <label className="text-xs">Expected Goals:</label>
                        <input
                            className="bg-white/10 rounded px-2 py-1 text-sm w-20 font-mono"
                            value={expectedGoals}
                            onChange={(e) => setExpectedGoals(e.target.value)}
                        />
                    </div>
                )}
                {activeTab === "outliers" && (
                    <div className="flex items-center gap-1">
                        <label className="text-xs">Values (comma-sep):</label>
                        <input
                            className="bg-white/10 rounded px-2 py-1 text-sm flex-1 font-mono"
                            value={outlierInput}
                            onChange={(e) => setOutlierInput(e.target.value)}
                        />
                    </div>
                )}
                {activeTab === "parlay" && (
                    <div className="flex items-center gap-1">
                        <label className="text-xs">Decimal Odds (comma-sep):</label>
                        <input
                            className="bg-white/10 rounded px-2 py-1 text-sm flex-1 font-mono"
                            value={parlayLegs}
                            onChange={(e) => setParlayLegs(e.target.value)}
                        />
                    </div>
                )}
                {activeTab === "clv" && (
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1">
                            <label className="text-xs">Open Odds:</label>
                            <input
                                className="bg-white/10 rounded px-2 py-1 text-sm w-20 font-mono"
                                value={openOdds}
                                onChange={(e) => setOpenOdds(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <label className="text-xs">Close Odds:</label>
                            <input
                                className="bg-white/10 rounded px-2 py-1 text-sm w-20 font-mono"
                                value={closeOdds}
                                onChange={(e) => setCloseOdds(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-1 flex-wrap">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`px-2 py-1 text-xs rounded cursor-pointer transition-colors ${
                            activeTab === tab.key ? "bg-accent/80 text-primary" : "bg-white/10 hover:bg-white/20"
                        }`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 p-3 bg-white/5 rounded overflow-auto">{renderContent()}</div>
        </div>
    );
}

export { SportsbookView };
