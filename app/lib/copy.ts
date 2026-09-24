// UI copy reused verbatim from the original Boxer AI app
// (extracted from the APK string table). New flows use new copy;
// mirrored screens keep the original labels.

export const copy = {
  stepIntoTheRing: 'Step Into the Ring',
  welcomeBack: 'Welcome back',
  recentSessions: 'Recent Sessions',
  analyzeWithAI: 'Analyze with AI',
  analyzeMatch: 'Analyze Match',
  analyzeFirstMatch: 'Analyze First Match',
  addPhotosOrVideos: 'Add Photos or Videos',
  attachHint: 'Attach photos or videos so your AI coach can analyze your visual technique',
  analyzingYourMatch: 'Analyzing Your Match',
  analysisComplete: 'Analysis Complete',
  analysisReady: 'Your performance analysis and personalized drills are ready.',
  analysisFailed: 'Analysis failed',
  limitReached: 'Limit Reached',
  tryAgain: 'Try Again',
  analyzeAnother: 'Analyze Another',
  offenseAnalysis: 'Offense Analysis',
  defenseTechnique: 'Defense Technique',
  stanceFeedback: 'Stance Feedback',
  tacticalSummary: 'Tactical Summary',
  performanceBreakdown: 'Performance Breakdown',
  avgScore: 'Avg Score',
  scoreTrend: 'Score Trend',
  trainingDrills: 'Training Drills',
  recommendedDrills: 'Recommended Drills',
  activeDrills: 'Active Drills',
  noDrillsYet: 'No Drills Yet',
  drillsEmptyHint: 'Analyze a match to get personalized drill recommendations',
  fighters: 'Fighters',
  gyms: 'Gyms',
  tournaments: 'Tournaments',
  tapToFindOpponents: 'Tap to find opponents',
  noFightersFound: 'No fighters found',
  noGymsFound: 'No gyms found',
  noUpcomingTournaments: 'No upcoming tournaments',
  boxerProfile: 'Boxer Profile',
  personalInfo: 'Personal Info',
  yourName: 'Your name',
  pleaseEnterName: 'Please enter your name',
  saveProfile: 'Save Profile',
  logInjury: 'Log Injury',
  recentInjuries: 'Recent Injuries',
  pleaseDescribeInjury: 'Please describe the injury',
  removeInjury: 'Remove Injury',
  pleaseEnterSessionTitle: 'Please enter a session title',
  sessionTitlePlaceholder: 'e.g. Sparring with Coach Martinez',
  briefContext: 'Brief context about the session',
  notesPrompt:
    'What happened? What went well? What challenges did you face? Be specific about techniques used...',
  statsImproveAccuracy: 'Your stats improve AI coaching accuracy',
} as const;

export const BOXING_STYLES = [
  'Orthodox',
  'Southpaw',
  'Brawler',
  'Counter-Puncher',
  'Aggressive',
  'Defensive',
  'Balanced',
] as const;

// Simplified 10-class ladder, as in the original app.
export const WEIGHT_CLASSES = [
  'Mini Flyweight',
  'Flyweight',
  'Bantamweight',
  'Featherweight',
  'Lightweight',
  'Welterweight',
  'Middleweight',
  'Light Heavyweight',
  'Cruiserweight',
  'Heavyweight',
] as const;

export const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Amateur', 'Pro'] as const;

export const BODY_PARTS = ['Head', 'Neck', 'Shoulder', 'Elbow', 'Ribs', 'Hip', 'Knee'] as const;

export type AnalysisType = 'shadowboxing' | 'bag_work' | 'sparring';

export const ANALYSIS_TYPES: { id: AnalysisType; title: string; hint: string }[] = [
  { id: 'shadowboxing', title: 'Shadowboxing', hint: 'Form check on your shadow work' },
  { id: 'bag_work', title: 'Bag Work', hint: 'Review your heavy-bag rounds' },
  { id: 'sparring', title: 'Sparring', hint: 'Break down live sparring footage' },
];
