# React Market Chart Benchmarker

## Overview

React Market Chart Benchmarker is a reusable benchmarking harness for evaluating the runtime performance of chart implementations that render market OHLCV data in the browser.

The goal is to help developers compare different charting approaches under the same synthetic market conditions, with a focus on:

- initial render latency
- steady-state streaming updates
- highly volatile burst events
- frame stability and responsiveness under load

This project is intentionally frontend-first. It does **not** attempt to model real backend transport or exchange infrastructure. Instead, it simulates market data locally so benchmark results reflect browser-side processing, scheduling, rendering, and UI responsiveness rather than network variability.

---

## Problem Statement

Charting implementations are often compared informally, with inconsistent datasets, different update patterns, and unclear measurement methodology. That makes it hard to answer questions like:

- Which chart library handles initial historical load best?
- Which implementation maintains responsiveness during rapid streaming updates?
- How much overhead comes from React integration versus the underlying renderer?
- How do different charting approaches behave during volatile market events?

This project provides a consistent harness for answering those questions.

---

## Goals

The benchmarker should allow developers to:

- benchmark multiple chart implementations against the same data stream
- compare built-in adapters and custom user-provided adapters
- simulate different market regimes such as trend, chop, gaps, and volatility spikes
- vary event frequency and update style
- inspect performance metrics that are meaningful for realtime charting
- run the benchmark locally with minimal setup

---

## Non-Goals

To keep results interpretable, the first version will explicitly exclude:

- real network latency
- exchange-specific matching behavior
- order book depth simulation
- backend persistence
- SSR benchmarking
- multi-user collaboration
- historical fidelity to real market feeds

The benchmark is focused on browser-side update and rendering cost.

---

## Core Product Idea

This is not just a candlestick chart app. It is a benchmarking harness made up of four independent layers:

1. **Market data simulation layer**  
   Generates deterministic OHLCV events in a worker thread.

2. **Scenario engine**  
   Controls market regime, volatility, cadence, and burst behavior.

3. **Chart adapter layer**  
   Normalizes different chart implementations behind one contract.

4. **Measurement layer**  
   Captures timing, frame health, responsiveness, and resource usage.

This separation is important because benchmark results are only fair if the same scenario and measurement logic are applied across all chart implementations.

---

## User Stories

### As a developer evaluating chart libraries

I want to run the same benchmark against multiple chart implementations so I can compare their behavior under identical conditions.

### As a developer building my own chart

I want to plug my implementation into the harness using a documented adapter contract so I can measure it alongside built-in adapters.

### As a developer focused on performance

I want to simulate trends, volatility, bursts, and different event rates so I can observe how a chart performs under realistic market-like stress.

### As a user interpreting results

I want to see metrics beyond FPS so I can understand whether problems come from slow updates, long frames, main-thread pressure, or backlog growth.

---

## Functional Requirements

### Requirement 1: Worker-Based Local Market Feed

Implement a deterministic market feed simulator in a Web Worker that emits OHLCV candle update events to the main thread at configurable rates.

The feed should:

- simulate frontend event delivery patterns similar to a live stream
- avoid real network transport concerns
- support multiple market scenarios
- be reproducible through seeding
- avoid distorting UI-thread rendering measurements

The feed should support:

- pause
- resume
- reset
- scenario switching
- configurable event rate
- configurable bar interval
- optional burst delivery mode

### Requirement 2: Adapter Contract

Define a chart adapter contract that allows different chart implementations to be benchmarked under the same harness.

Adapters must support:

- mount
- teardown
- resize
- one or more update strategies

The contract should allow both:

- full-series replacement
- incremental bar updates

This makes it possible to compare:

- naive React state-driven charts
- imperative chart instance mutation
- finance-native streaming APIs
- canvas or WebGL renderers
- third-party custom implementations

### Requirement 3: Scenario Configuration

Allow users to configure benchmark scenarios including:

- market regime
- dataset size
- bar interval
- event rate
- burst behavior
- random seed
- test duration
- warmup duration
- viewport size

Scenarios must be reproducible and easy to rerun.

### Requirement 4: Measurement and Reporting

Collect and report chart performance metrics that are actually useful for evaluating realtime charting behavior.

Metrics should include:

- first visual render time
- average update latency
- p95 and p99 update latency
- frame pacing
- long-frame count
- backlog growth
- memory usage where available
- main-thread pressure where measurable

Results should be exportable and comparable across runs.
