# Sports Betting & Market Analysis — Gemini AI Integration

## Overview

This document describes the sports betting analytics and market analysis system integrated into Wave Terminal. The system provides comprehensive quantitative tools for sports market analysis, designed to feed structured data into Gemini AI for advanced insights.

## Architecture

### Utility Module (`frontend/util/sportsbetting.ts`)

Pure TypeScript analytics engine with zero external dependencies. Provides:

#### Odds Conversion
- American ↔ Decimal ↔ Fractional odds conversion
- Handles positive and negative American odds
- Simplifies fractional representation via GCD

#### Probability & Market Analysis
- **Implied Probability**: Converts odds to win probability
- **Vig/Juice Calculation**: Measures bookmaker margin (overround)
- **No-Vig Fair Odds**: Removes bookmaker margin to find true probabilities
- **Full Market Summary**: Combines all market metrics in one analysis

#### Expected Value (EV)
- Compares your assessed probability vs market-implied probability
- Calculates dollar EV and percentage EV
- Positive EV detection for edge identification

#### Kelly Criterion
- Optimal bankroll fraction sizing (full, half, quarter Kelly)
- Edge calculation: `edge = b*p - q` where b = net odds, p = win prob, q = loss prob
- Clamped to [0, 1] range for safety

#### Poisson Distribution
- PMF and CDF for scoring prediction
- Over/Under probability estimation (e.g., Over/Under 2.5 goals)
- Full goal distribution from 0 to N

#### Closing Line Value (CLV)
- Compares opening vs closing odds
- Measures if your bet "beat the close" — the gold standard of betting skill
- Percentage CLV calculation

#### Parlay / Accumulator Calculator
- Combined odds multiplication
- True implied probability of parlay hitting
- Per-leg breakdown with individual probabilities

#### Arbitrage Detection
- Identifies markets where total implied probability < 100%
- Calculates guaranteed profit margin
- Optimal stake distribution across outcomes

#### ROI Tracking
- Total staked, returned, profit
- Win rate percentage
- Average odds analysis

#### Outlier Detection (Z-Score)
- Statistical mean and standard deviation
- Z-score computation for each data point
- Configurable threshold (default: 2σ)
- Direction classification: high, low, or normal

#### Line Movement Analysis
- Tracks odds changes over time
- Classifies movement: shortening, drifting, or stable
- Sharp money detection based on significant shortening

### Gemini AI Prompt Builder

Generates structured analysis prompts for Google Gemini that include:
1. Sport, teams, and market context
2. Pre-computed market analysis (implied probabilities, vig, fair odds)
3. Custom metrics and historical data
4. Requested analysis dimensions:
   - Probability assessment
   - Expected value analysis
   - Key statistical factors and outliers
   - Kelly Criterion recommendation
   - Line value and market efficiency
   - Edge identification

### View Component (`frontend/app/view/sportsbook/`)

Registered as `"sportsbook"` in the BlockRegistry with:
- Icon: `chart-line`
- Display name: "Sportsbook"

Provides a tabbed dashboard interface:
- **Market**: Full market analysis with vig, fair odds, overround
- **EV**: Expected value calculator with edge detection
- **Kelly**: Kelly Criterion bankroll management
- **Poisson**: Scoring distribution model
- **Outliers**: Z-score outlier detection on custom datasets
- **Parlay**: Multi-leg parlay calculator
- **Arbitrage**: Cross-market arbitrage detection
- **CLV**: Closing line value tracker
- **ROI**: Return on investment tracking
- **Gemini AI**: Prompt generator for Gemini analysis

## Usage

1. Open the Sportsbook view in Wave Terminal (view type: `sportsbook`)
2. Enter odds in American format for Side A and Side B
3. Set your estimated fair probability and stake amount
4. Navigate between analysis tabs to view different metrics
5. Use the Gemini AI tab to generate analysis prompts
6. Copy the generated prompt into WaveAI chat with a Gemini model selected

## Metrics Covered

| Metric | Description | Use Case |
|--------|-------------|----------|
| Implied Probability | Win likelihood from odds | Market pricing assessment |
| Vig/Juice | Bookmaker margin | Cost of betting measurement |
| No-Vig Odds | True fair odds | Edge comparison |
| Expected Value | Profit expectation per bet | Bet selection |
| Kelly Criterion | Optimal bet sizing | Bankroll management |
| Poisson Model | Score probability distribution | Total/goal markets |
| CLV | Closing line value | Bettor skill measurement |
| Parlay Math | Combined multi-bet odds | Accumulator analysis |
| Arbitrage | Risk-free profit detection | Cross-book opportunities |
| Z-Score Outliers | Statistical anomaly detection | Data-driven insights |
| Line Movement | Odds change tracking | Sharp money detection |
| ROI | Return on investment | Performance tracking |
