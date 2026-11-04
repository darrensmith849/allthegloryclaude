// The first book on the Reading page: Josh Kaufman's The Personal MBA, with
// its chapters and each chapter's headings (the "Key Ideas" lists on
// personalmba.com, checked 2026-10-27). Loaded once, when there are no books
// yet; after that everything lives in D1 and can be edited on the page.

export interface SeedChapter {
  kind: "front" | "chapter";
  title: string;
  headings: string[];
}

export const PERSONAL_MBA = {
  title: "The Personal MBA",
  author: "Josh Kaufman",
  subtitle: "A world-class business education in a single volume",
  chapters: [
    { kind: "front", title: "A Note to the Reader", headings: [] },
    { kind: "front", title: "Introduction", headings: [] },
    {
      kind: "chapter",
      title: "Value Creation",
      headings: [
        "The 5 Parts of Every Business", "Economically Valuable Skills", "The Iron Law of the Market", "Core Human Drives",
        "Social Status", "10 Ways to Evaluate a Market", "The Hidden Benefit of Competition", "The Mercenary Rule",
        "The Crusader Rule", "12 Standard Forms of Value", "Form of Value #1: Product", "Form of Value #2: Service",
        "Form of Value #3: Shared Resource", "Form of Value #4: Subscription", "Form of Value #5: Resale",
        "Form of Value #6: Lease", "Form of Value #7: Agency", "Form of Value #8: Audience Aggregation",
        "Form of Value #9: Loan", "Form of Value #10: Option", "Form of Value #11: Insurance", "Form of Value #12: Capital",
        "Hassle Premium", "Perceived Value", "Modularity", "Bundling and Unbundling", "Intermediation and Disintermediation",
        "Prototype", "Iteration Cycle", "Iteration Velocity", "Feedback", "Alternatives", "Trade-offs", "Economic Values",
        "Relative Importance Testing", "Critical Assumptions", "Shadow Testing", "Minimum Viable Offer",
        "Incremental Augmentation", "Field Testing",
      ],
    },
    {
      kind: "chapter",
      title: "Marketing",
      headings: [
        "Attention", "Receptivity", "Remarkability", "Probable Purchaser", "Preoccupation", "Levels of Awareness",
        "End Result", "Demonstration", "Qualification", "Point of Market Entry", "Addressability", "Desire",
        "Visualization", "Framing", "Free", "Permission", "Hook", "Call to Action", "Narrative", "Controversy", "Reputation",
      ],
    },
    {
      kind: "chapter",
      title: "Sales",
      headings: [
        "Transaction", "Trust", "Common Ground", "Pricing Uncertainty Principle", "Four Pricing Methods",
        "Price Transition Shock", "Value-Based Selling", "Education-Based Selling", "Next Best Alternative", "Exclusivity",
        "Three Universal Currencies", "Three Dimensions of Negotiation", "Buffer", "Persuasion Resistance", "Reciprocation",
        "Damaging Admission", "Option Fatigue", "Barriers to Purchase", "Risk Reversal", "Reactivation",
      ],
    },
    {
      kind: "chapter",
      title: "Value Delivery",
      headings: [
        "Value Stream", "Distribution Channel", "The Expectation Effect", "Predictability", "Quality", "Quality Signals",
        "Throughput", "Duplication", "Multiplication", "Scale", "Accumulation", "Amplification", "Barrier to Competition",
        "Force Multiplier", "Systemization", "Triage",
      ],
    },
    {
      kind: "chapter",
      title: "Finance",
      headings: [
        "Profit", "Profit Margin", "Value Capture", "Sufficiency", "Valuation", "Cash Flow Statement", "Income Statement",
        "Balance Sheet", "Financial Ratios", "Cost-Benefit Analysis", "Four Methods to Increase Revenue", "Pricing Power",
        "Lifetime Value", "Allowable Acquisition Cost", "Overhead", "Costs: Fixed and Variable", "Incremental Degradation",
        "Breakeven", "Amortization", "Purchasing Power", "Cash Flow Cycle", "Segregation of Duties", "Limited Authorization",
        "Opportunity Cost", "Time Value of Money", "Compounding", "Leverage", "Hierarchy of Funding", "Bootstrapping",
        "Return on Investment", "Sunk Cost", "Internal Controls",
      ],
    },
    {
      kind: "chapter",
      title: "The Human Mind",
      headings: [
        "Caveman Syndrome", "Performance Requirements", "The Onion Brain", "Perceptual Control", "Reference Level",
        "Conservation of Energy", "Guiding Structure", "Reorganization", "Conflict", "Pattern Matching", "Mental Simulation",
        "Interpretation and Reinterpretation", "Motivation", "Inhibition", "Status Signals", "Status Malfunction",
        "Loss Aversion", "Threat Lockdown", "Cognitive Scope Limitation", "Association", "Absence Blindness", "Contrast",
        "Scarcity", "Novelty",
      ],
    },
    {
      kind: "chapter",
      title: "Working With Yourself",
      headings: [
        "Akrasia", "Monoidealism", "Cognitive Switching Penalty", "Four Methods of Completion", "Most Important Tasks",
        "Goals", "States of Being", "Habits", "Priming", "Decision", "Five-Fold Why", "Five-Fold How", "Next Action",
        "Externalization", "Self-Elicitation", "Thought Experiment", "Parkinson's Law", "Doomsday Scenario",
        "Excessive Self-Regard Tendency", "Confirmation Bias", "Hindsight Bias", "Performance Load", "Energy Cycles",
        "Stress and Recovery", "Testing", "Mystique", "Hedonic Treadmill", "Comparison Fallacy", "Locus of Control",
        "Attachment", "Personal Research and Development", "Limiting Belief", "Malinvestment", "The Necessity of Choice",
        "The Arrival Fallacy",
      ],
    },
    {
      kind: "chapter",
      title: "Working With Others",
      headings: [
        "Power", "Comparative Advantage", "Communication Overhead", "Importance", "Safety", "Golden Trifecta", "Reason Why",
        "Commander's Intent", "Earned Regard", "Bystander Apathy", "Planning Fallacy", "Forcing Function", "Referrals",
        "Clanning", "Convergence and Divergence", "Social Proof", "Authority", "Commitment and Consistency",
        "Incentive-Caused Bias", "Modal Bias", "Attribution Error", "The Mind-Reading Fallacy", "Boundary Setting",
        "The Principle of Charity", "Option Orientation", "Management", "Performance-Based Hiring",
      ],
    },
    {
      kind: "chapter",
      title: "Understanding Systems",
      headings: [
        "Gall's Law", "Flow", "Stock", "Slack", "Constraint", "Feedback Loop", "Autocatalysis", "Environment",
        "Selection Test", "Entropy", "Uncertainty", "Change", "Interdependence", "Counterparty Risk", "Second-Order Effects",
        "Externality", "Normal Accidents",
      ],
    },
    {
      kind: "chapter",
      title: "Analyzing Systems",
      headings: [
        "Deconstruction", "Measurement", "Key Performance Indicator", "Garbage In, Garbage Out", "Tolerance", "Variance",
        "Analytical Honesty", "Context", "Sampling", "Margin of Error", "Ratio", "Typicality", "Correlation and Causation",
        "Norms", "Proxy", "Segmentation", "Humanization",
      ],
    },
    {
      kind: "chapter",
      title: "Improving Systems",
      headings: [
        "Intervention Bias", "Optimization", "Refactoring", "The Critical Few", "Diminishing Returns", "Progressive Load",
        "Friction", "Automation", "The Paradox of Automation", "The Irony of Automation", "Standard Operating Procedure",
        "Checklist", "Process Overhead", "Cessation", "Resilience", "Fail-safes", "Stress Testing", "Scenario Planning",
        "Exploration / Exploitation", "Sustainable Growth Cycle", "The Middle Path", "The Experimental Mindset",
      ],
    },
  ] as SeedChapter[],
};
