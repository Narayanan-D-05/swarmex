# SwarmEx Frontend PRD

## Overview
SwarmEx is an autonomous DeFi orchestration engine. The frontend serves as a premium, minimal, and highly interactive terminal for users to interact with a swarm of AI agents executing complex DeFi strategies on-chain (starting with 0G Galileo Testnet).

## Core Design Philosophy
- **Minimalist Excellence**: Every component must serve a functional purpose. No "fluff."
- **Premium Aesthetics**: Use sleek dark modes, glassmorphism, and subtle mesh gradients to create a "next-gen" feel.
- **Micro-Interactions**: Smooth transitions between agent states and terminal logs.
- **Clarity**: Information must be presented in a "to-the-point" fashion.

## Typography
- **Hero Title**: `Instrument Sans` (Italic style). This is reserved for the landing page hero text.
- **General UI**: `Space Grotesk`. Used for all body text, labels, and terminal outputs.

## Iconography
- **Strict Rule**: No emojis allowed.
- **Library**: Use icons from `@phosphor-icons/react` or `lucide-react`.
- **Contextual Usage**: Every agent (Orchestrator, Researcher, Executor, etc.) should have a dedicated icon that remains consistent throughout the UI.

---

## Page Structures

### 1. Landing Page (Mandatory)
The entry point of the application. It must "wow" the user and explain the project's value proposition.
- **Hero Section**:
  - **Text**: Center-aligned, "Instrument Sans" Italic.
  - **Background**: Dynamic mesh gradient or blurred glassmorphism effect.
  - **Content**: A compelling headline about autonomous DeFi orchestration and a clear Call-to-Action (CTA) to "Enter Terminal."
- **Features Section**: 3-4 minimalist cards explaining the agents (Researcher, Risk Guard, Executor).
- **Network Status**: A subtle footer or floating pill showing 0G Testnet connectivity.

### 2. Control Terminal (Functional Dashboard)
A simplified, presentable workspace for executing intents.
- **Intent Input**: A prominent, minimalist text area for natural language input (e.g., "Swap 1 ETH for USDC if price drops 5%").
- **Agent Swarm Visualization**: A visual representation of the active swarm. Not complex diagrams, but clear status indicators (e.g., "Researcher Analyzing", "Risk Guard Signing").
- **Live Terminal Log**:
  - Real-time SSE stream updates.
  - Clear distinction between agent types using dedicated colors and icons.
  - **Transaction Hashes**: Displayed as clickable links (e.g., `0x123...abc`) which redirect to the 0G Galileo Explorer.
- **Payment Ledger**: A side panel or retractable section showing x402 payment claims as they happen.

---

## Technical Requirements
- **Framework**: Next.js (App Router).
- **Styling**: Vanilla CSS or CSS Modules for maximum control.
- **State Management**: React Context or lightweight hooks for managing the SSE stream.
- **Connectivity**: `viem` for on-chain interactions and hash formatting.

## Animations & Effects
- **Mesh Gradient**: Implemented via CSS `radial-gradients` or a specialized canvas library for a premium feel.
- **Smooth Scrolling**: Terminal should automatically scroll to the bottom with a smooth behavior.
- **Hover States**: Subtle glow effects on buttons and interactive cards.

---

## Implementation Checklist
- [ ] Setup `next/font` for `Instrument Sans` and `Space Grotesk`.
- [ ] Create `MeshGradient` background component.
- [ ] Implement Landing Page layout with center-aligned hero.
- [ ] Build Minimalist Terminal component.
- [ ] Format Tx Hashes as clickable links: `https://testnet.0gscan.com/tx/{hash}`.
- [ ] Replace all emojis with Phosphor icons.
- [ ] Ensure all components are responsive and "to-the-point."
