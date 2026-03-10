export const ROLE_GROUPS = {
    "Core Team": ["SAA", "President", "TMOD", "TTM"],
    "GE Team": ["General Evaluator", "Timer", "Ah-Counter", "Grammarian", "Listener"],
    "Prepared Speeches": ["Speaker 1", "Speaker 2", "Speaker 3", "Speaker 4", "Speaker 5", "Speaker 6", "Speaker Backup1", "Speaker Backup2"],
    "Evaluators": ["Evaluator 1", "Evaluator 2", "Evaluator 3", "Evaluator 4", "Evaluator 5", "Evaluator 6"]
};

export const ALL_ROLES = Object.values(ROLE_GROUPS).flat();

export const ROLE_CATEGORIES: Record<string, string> = {
    "SAA": "Core",
    "President": "Core",
    "TMOD": "Core",
    "TTM": "Core",
    "General Evaluator": "Core",
    "Speaker 1": "Prepared",
    "Speaker 2": "Prepared",
    "Speaker 3": "Prepared",
    "Speaker 4": "Prepared",
    "Speaker 5": "Prepared",
    "Speaker 6": "Prepared",
    "Speaker Backup1": "Prepared",
    "Speaker Backup2": "Prepared",
    "Evaluator 1": "Evaluation",
    "Evaluator 2": "Evaluation",
    "Evaluator 3": "Evaluation",
    "Evaluator 4": "Evaluation",
    "Evaluator 5": "Evaluation",
    "Evaluator 6": "Evaluation",
    "Timer": "Support",
    "Ah-Counter": "Support",
    "Grammarian": "Support",
    "Listener": "Support"
};

export const CATEGORY_STYLES: Record<string, string> = {
    "Core": "border-l-4 border-l-purple-500",
    "Prepared": "border-l-4 border-l-blue-500",
    "Evaluation": "border-l-4 border-l-emerald-500",
    "Support": "border-l-4 border-l-amber-500"
};

export const ROLE_THEMES: Record<string, { bg: string, text: string, border: string, dot: string }> = {
    "Core": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100", dot: "bg-purple-500" },
    "Prepared": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100", dot: "bg-blue-500" },
    "Evaluation": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", dot: "bg-emerald-500" },
    "Support": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", dot: "bg-amber-500" },
    "Other": { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-100", dot: "bg-slate-500" }
};
