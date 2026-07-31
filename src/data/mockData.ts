import { 
  UserProfile, 
  MockTest, 
  Question, 
  AttemptReport, 
  CoinTransaction, 
  PaymentClaim, 
  FormulaSheet, 
  RecommendationTask 
} from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'usr-ce-101',
  name: 'Krrish Nyoupane',
  email: 'krrish.nyoupane@gmail.com',
  role: 'Student',
  targetScore: 165,
  targetExam: 'Nepal CEE',
  examDate: '2026-09-15', // ~45 days away
  plan: 'Premium',
  mocksRemaining: 8,
  studyCoinBalance: 245,
  preferredLanguage: 'en',
  darkTheme: false,
  avatarUrl: '',
};

// High-Yield Questions Bank for CEE & IOE
const SAMPLE_QUESTIONS: Question[] = [
  // PHYSICS
  {
    id: 'q-phy-01',
    subject: 'Physics',
    chapter: 'Dimensional Analysis & Errors',
    stem: 'The dimension of Planck’s constant (h) is identical to the dimension of which physical quantity?',
    options: {
      A: 'Linear Momentum',
      B: 'Angular Momentum',
      C: 'Energy per unit area',
      D: 'Power'
    },
    correctOptionKey: 'B',
    explanation: 'Planck’s constant [h] = J·s = [M L² T⁻¹], which is equal to Angular Momentum [L] = m·v·r = [M L² T⁻¹].',
    tags: ['Dimensions', 'Units & Measurements', 'CEE 2080'],
    language: 'en',
    status: 'published',
    source: 'CEE 2080 Paper Q12'
  },
  {
    id: 'q-phy-02',
    subject: 'Physics',
    chapter: 'Simple Harmonic Motion',
    stem: 'A particle executes SHM with amplitude A. At what displacement from the mean position is its kinetic energy equal to its potential energy?',
    options: {
      A: 'x = A / 2',
      B: 'x = A / √2',
      C: 'x = A / √3',
      D: 'x = A / 4'
    },
    correctOptionKey: 'B',
    explanation: 'KE = 1/2 k (A² - x²), PE = 1/2 k x². Equating KE = PE gives A² - x² = x² => 2x² = A² => x = A / √2.',
    tags: ['SHM', 'Oscillations', 'High Yield'],
    language: 'en',
    status: 'published',
    source: 'CEE Practice Bank'
  },
  {
    id: 'q-phy-03',
    subject: 'Physics',
    chapter: 'Electrostatics',
    stem: 'Two point charges +4q and +q are placed at a distance r apart. Where should a third point charge Q be placed so that the entire system is in equilibrium?',
    options: {
      A: 'r / 3 from +q',
      B: 'r / 2 from +q',
      C: '2r / 3 from +q',
      D: 'r / 4 from +q'
    },
    correctOptionKey: 'A',
    explanation: 'For equilibrium, F1 = F2 => k (4q)(Q) / (r-x)² = k (q)(Q) / x² => 2/ (r-x) = 1/x => 2x = r - x => x = r/3 from +q.',
    tags: ['Electrostatics', 'Coulomb Law'],
    language: 'en',
    status: 'published'
  },
  {
    id: 'q-phy-04',
    subject: 'Physics',
    chapter: 'Optics & Wave Motion',
    stem: 'In Young’s double slit experiment, if the bandwidth is β, what is the new bandwidth if the entire setup is immersed in water of refractive index 4/3?',
    options: {
      A: '3 β / 4',
      B: '4 β / 3',
      C: '9 β / 16',
      D: 'β'
    },
    correctOptionKey: 'A',
    explanation: 'Fringe width β = λ D / d. When immersed in liquid, λ’ = λ / μ. Thus β’ = β / μ = β / (4/3) = 3 β / 4.',
    tags: ['Wave Optics', 'YDSE'],
    language: 'en',
    status: 'published'
  },

  // CHEMISTRY
  {
    id: 'q-chem-01',
    subject: 'Chemistry',
    chapter: 'Chemical Kinetics',
    stem: 'For a first-order reaction, the time required for 99.9% completion is approximately how many times its half-life (t1/2)?',
    options: {
      A: '3 times',
      B: '5 times',
      C: '10 times',
      D: '20 times'
    },
    correctOptionKey: 'C',
    explanation: 't_99.9% = (2.303 / k) log(100 / 0.1) = (2.303 / k) × 3 = 6.909 / k. Since t1/2 = 0.693 / k, t_99.9% ≈ 10 × t1/2.',
    tags: ['Chemical Kinetics', 'First Order'],
    language: 'en',
    status: 'published'
  },
  {
    id: 'q-chem-02',
    subject: 'Chemistry',
    chapter: 'Organic - Reaction Mechanisms',
    stem: 'Which of the following carbocations is the most stable due to resonance and hyperconjugation?',
    options: {
      A: 'Primary Allyl Carbocation',
      B: 'Tertiary Butyl Carbocation',
      C: 'Tropylium Cation',
      D: 'Secondary Isopropyl Carbocation'
    },
    correctOptionKey: 'C',
    explanation: 'The Tropylium cation (C7H7+) is aromatic with 6 π electrons in a 7-membered ring, exhibiting extreme resonance stability.',
    tags: ['Organic Chemistry', 'Aromaticity'],
    language: 'en',
    status: 'published'
  },
  {
    id: 'q-chem-03',
    subject: 'Chemistry',
    chapter: 'Electrochemistry',
    stem: 'During the electrolysis of aqueous CuSO4 solution using inert platinum electrodes, what gas is evolved at the anode?',
    options: {
      A: 'Hydrogen gas (H2)',
      B: 'Oxygen gas (O2)',
      C: 'SO2 gas',
      D: 'Cu vapor'
    },
    correctOptionKey: 'B',
    explanation: 'At the anode, oxidation of water occurs in preference to SO4²⁻ due to lower discharge potential: 2H2O -> O2 + 4H+ + 4e-.',
    tags: ['Electrochemistry', 'Electrolysis'],
    language: 'en',
    status: 'published'
  },

  // ZOOLOGY
  {
    id: 'q-zoo-01',
    subject: 'Zoology',
    chapter: 'Human Physiology - Circulation',
    stem: 'Which pacemaker node initiates the electrical cardiac impulse in the human heart?',
    options: {
      A: 'Atrioventricular (AV) Node',
      B: 'Sinoatrial (SA) Node',
      C: 'Bundle of His',
      D: 'Purkinje Fibres'
    },
    correctOptionKey: 'B',
    explanation: 'The SA node (Sinoatrial node) situated in the right atrium is the primary natural pacemaker generating 70-80 action potentials per minute.',
    tags: ['Human Physiology', 'Circulatory System'],
    language: 'en',
    status: 'published'
  },
  {
    id: 'q-zoo-02',
    subject: 'Zoology',
    chapter: 'Animal Diversity',
    stem: 'Flame cells (Protonephridia) are the characteristic excretory organs found in which animal phylum?',
    options: {
      A: 'Annelida',
      B: 'Platyhelminthes',
      C: 'Aschelminthes',
      D: 'Echinodermata'
    },
    correctOptionKey: 'B',
    explanation: 'Platyhelminthes (Flatworms like Taenia and Planaria) possess specialized flame cells for osmoregulation and excretion.',
    tags: ['Phylum', 'Animal Classification'],
    language: 'en',
    status: 'published'
  },

  // BOTANY
  {
    id: 'q-bot-01',
    subject: 'Botany',
    chapter: 'Photosynthesis in Plants',
    stem: 'In C4 plants, the primary CO2 acceptor enzyme present in mesophyll cells is:',
    options: {
      A: 'RuBisCO',
      B: 'PEP Carboxylase (PEPcase)',
      C: 'ATP Synthase',
      D: 'Carbonic Anhydrase'
    },
    correctOptionKey: 'B',
    explanation: 'In C4 mesophyll cells, PEPcase fixes CO2 into oxaloacetic acid (4C). RuBisCO is localized inside bundle sheath cells.',
    tags: ['C4 Pathway', 'Plant Physiology'],
    language: 'en',
    status: 'published'
  },
  {
    id: 'q-bot-02',
    subject: 'Botany',
    chapter: 'Genetics & Molecular Biology',
    stem: 'Which RNA codon acts as the universal initiation codon for protein translation in both prokaryotes and eukaryotes?',
    options: {
      A: 'UAA',
      B: 'AUG',
      C: 'UAG',
      D: 'UGA'
    },
    correctOptionKey: 'B',
    explanation: 'AUG codes for Methionine (or Formyl-methionine in bacteria) and serves as the universal start codon.',
    tags: ['Genetics', 'Translation'],
    language: 'en',
    status: 'published'
  },

  // MAT (Mental Aptitude Test)
  {
    id: 'q-mat-01',
    subject: 'MAT',
    chapter: 'Logical Reasoning & Series',
    stem: 'Complete the sequence: 3, 7, 15, 31, 63, ?',
    options: {
      A: '125',
      B: '127',
      C: '128',
      D: '131'
    },
    correctOptionKey: 'B',
    explanation: 'Pattern is (x × 2 + 1): 3×2+1=7, 7×2+1=15, 15×2+1=31, 31×2+1=63, 63×2+1=127.',
    tags: ['MAT', 'Number Series'],
    language: 'en',
    status: 'published'
  },
  {
    id: 'q-mat-02',
    subject: 'MAT',
    chapter: 'Verbal Reasoning',
    stem: 'If "NEPAL" is coded as "OFQBM", how is "SMART" coded in the same pattern?',
    options: {
      A: 'TNBSI',
      B: 'TNBSU',
      C: 'TLASU',
      D: 'ROZQS'
    },
    correctOptionKey: 'B',
    explanation: 'Each letter is shifted by +1 in the alphabet: S+1=T, M+1=N, A+1=B, R+1=S, T+1=U => TNBSU.',
    tags: ['MAT', 'Coding Decoding'],
    language: 'en',
    status: 'published'
  }
];

// Generate Full 200 Questions Set by duplicating with variations for realistic test experience
export function buildFullMockQuestions(count = 200): Question[] {
  const result: Question[] = [];
  const baseLen = SAMPLE_QUESTIONS.length;
  
  for (let i = 0; i < count; i++) {
    const base = SAMPLE_QUESTIONS[i % baseLen];
    result.push({
      ...base,
      id: `q-full-${i + 1}`,
      stem: count > baseLen ? `[Q${i + 1}] ${base.stem}` : base.stem
    });
  }
  return result;
}

export const INITIAL_MOCK_TESTS: MockTest[] = [
  {
    id: 'mock-cee-full-01',
    title: 'Nepal CEE Official Grand Mock #1 (2026 Edition)',
    examType: 'Nepal CEE',
    kind: 'Mock',
    durationSec: 10800, // 3 hours (180 mins)
    totalQuestions: 200,
    questionsPerPage: 20,
    correctMarks: 1,
    wrongMarks: -0.25,
    unansweredMarks: 0,
    isPublished: true,
    questions: buildFullMockQuestions(200),
  },
  {
    id: 'pyp-cee-2081',
    title: 'CEE 2081 Past Official Exam Paper',
    examType: 'Nepal CEE',
    kind: 'PYP',
    durationSec: 10800,
    totalQuestions: 200,
    questionsPerPage: 20,
    correctMarks: 1,
    wrongMarks: -0.25,
    unansweredMarks: 0,
    isPublished: true,
    year: '2081 BS',
    questions: buildFullMockQuestions(200),
  },
  {
    id: 'pyp-cee-2080',
    title: 'CEE 2080 Past Official Exam Paper',
    examType: 'Nepal CEE',
    kind: 'PYP',
    durationSec: 10800,
    totalQuestions: 200,
    questionsPerPage: 20,
    correctMarks: 1,
    wrongMarks: -0.25,
    unansweredMarks: 0,
    isPublished: true,
    year: '2080 BS',
    questions: buildFullMockQuestions(200),
  },
  {
    id: 'mock-cee-demo-free',
    title: 'CEE Free Demo Diagnostic Mock (50 Questions)',
    examType: 'Nepal CEE',
    kind: 'Mock',
    durationSec: 3600, // 60 mins
    totalQuestions: 50,
    questionsPerPage: 10,
    correctMarks: 1,
    wrongMarks: -0.25,
    unansweredMarks: 0,
    isPublished: true,
    coinPrice: 0,
    questions: buildFullMockQuestions(50),
  },
  {
    id: 'mock-ioe-model-01',
    title: 'IOE Entrance Model Test #1 (Maths & Physics Heavy)',
    examType: 'IOE Entrance',
    kind: 'Mock',
    durationSec: 7200, // 2 hours
    totalQuestions: 100,
    questionsPerPage: 20,
    correctMarks: 1,
    wrongMarks: -0.25,
    unansweredMarks: 0,
    isPublished: true,
    questions: buildFullMockQuestions(100),
  }
];

export const INITIAL_PAST_REPORTS: AttemptReport[] = [
  {
    id: 'rep-cee-801',
    attemptId: 'att-801',
    mockId: 'mock-cee-full-01',
    mockTitle: 'Nepal CEE Official Grand Mock #1 (2026 Edition)',
    examType: 'Nepal CEE',
    completedAt: '2026-07-28 14:30',
    overallScore: 142.5,
    maxScore: 200,
    accuracyPercentage: 78.4,
    totalAttempted: 175,
    correctCount: 151,
    wrongCount: 24,
    skippedCount: 25,
    timeSpentSec: 9840, // 2h 44m
    predictedRank: 148,
    rankBand: [125, 170],
    percentile: 96.8,
    subjectScores: [
      { subject: 'Physics', total: 50, score: 38.25, accuracy: 81.2 },
      { subject: 'Chemistry', total: 50, score: 36.5, accuracy: 77.0 },
      { subject: 'Zoology', total: 40, score: 31.0, accuracy: 82.5 },
      { subject: 'Botany', total: 40, score: 26.75, accuracy: 71.0 },
      { subject: 'MAT', total: 20, score: 10.0, accuracy: 58.0 }
    ],
    chapterScores: [
      { subject: 'Physics', chapter: 'Electrostatics', total: 10, correct: 9, wrong: 1, skipped: 0, accuracy: 90, status: 'Strong' },
      { subject: 'Physics', chapter: 'Simple Harmonic Motion', total: 8, correct: 6, wrong: 2, skipped: 0, accuracy: 75, status: 'Average' },
      { subject: 'Chemistry', chapter: 'Chemical Kinetics', total: 10, correct: 4, wrong: 5, skipped: 1, accuracy: 40, status: 'Weak' },
      { subject: 'Botany', chapter: 'Genetics & Molecular Biology', total: 12, correct: 5, wrong: 6, skipped: 1, accuracy: 41.6, status: 'Weak' },
      { subject: 'MAT', chapter: 'Verbal Reasoning', total: 10, correct: 4, wrong: 4, skipped: 2, accuracy: 40, status: 'Weak' },
      { subject: 'Zoology', chapter: 'Human Physiology - Circulation', total: 10, correct: 9, wrong: 1, skipped: 0, accuracy: 90, status: 'Strong' }
    ],
    mistakeAnalysis: {
      wrongVsSkippedRatio: '24 Wrong / 25 Skipped',
      slowCorrectCount: 12,
      speedSecPerQuestion: 56
    },
    targetScore: 165,
    targetGap: 22.5,
    recommendations: [
      {
        id: 'rec-01',
        title: 'Chemical Kinetics Formula & Problem Mastery',
        subject: 'Chemistry',
        chapter: 'Chemical Kinetics',
        type: 'Revision Pack',
        coinCost: 15,
        estimatedMinutes: 25,
        questionCount: 30,
        completed: false
      },
      {
        id: 'rec-02',
        title: 'Genetics & Translation High-Yield Speed Drill',
        subject: 'Botany',
        chapter: 'Genetics & Molecular Biology',
        type: 'Practice Quiz',
        coinCost: 15,
        estimatedMinutes: 20,
        questionCount: 25,
        completed: false
      }
    ],
    shareToken: 'px-token-9988221'
  }
];

export const INITIAL_COIN_TRANSACTIONS: CoinTransaction[] = [
  {
    id: 'ctx-101',
    delta: +20,
    reason: 'Completed CEE Full Mock #1',
    refType: 'attempt',
    refId: 'att-801',
    createdAt: '2026-07-28 14:31'
  },
  {
    id: 'ctx-100',
    delta: +15,
    reason: 'Profile setup & target score configured',
    refType: 'profile',
    refId: 'usr-ce-101',
    createdAt: '2026-07-20 10:00'
  },
  {
    id: 'ctx-099',
    delta: +50,
    reason: 'Weekly CEE Challenge Rank #12 Finisher',
    refType: 'challenge',
    refId: 'chal-082026',
    createdAt: '2026-07-25 18:00'
  },
  {
    id: 'ctx-098',
    delta: +160,
    reason: 'Welcome bonus for joining PrepX Nepal',
    refType: 'signup',
    refId: 'usr-ce-101',
    createdAt: '2026-07-20 09:00'
  }
];

export const INITIAL_PAYMENT_CLAIMS: PaymentClaim[] = [
  {
    id: 'pay-claim-901',
    userId: 'usr-ce-101',
    userName: 'Krrish Nyoupane',
    userEmail: 'krrish.nyoupane@gmail.com',
    planCode: 'Premium',
    amountNpr: 149,
    paymentMethod: 'eSewa',
    transactionRef: 'ESWA-20260728-99481',
    screenshotUrl: 'https://images.unsplash.com/photo-1556742049-0a67d512a95e?auto=format&fit=crop&w=600&q=80',
    status: 'approved',
    userNotes: 'Paid via eSewa app for 10 CEE Premium Mocks',
    submittedAt: '2026-07-20 11:20',
    verifiedAt: '2026-07-20 11:45',
    verifiedBy: 'Moderator Sandesh'
  },
  {
    id: 'pay-claim-902',
    userId: 'usr-ce-202',
    userName: 'Bikash Adhikari',
    userEmail: 'bikash.gapyear@gmail.com',
    planCode: 'Unlimited',
    amountNpr: 999,
    paymentMethod: 'Khalti',
    transactionRef: 'KHLT-88274109',
    screenshotUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
    status: 'pending',
    userNotes: 'Upgrading to Unlimited Plan for full season access',
    submittedAt: '2026-07-30 04:15'
  }
];

export const FORMULA_SHEETS: FormulaSheet[] = [
  {
    id: 'fs-phy-01',
    subject: 'Physics',
    title: 'Mechanics & SHM High-Yield Formula Sheet',
    chapter: 'Mechanics',
    formulas: [
      { name: 'Centripetal Acceleration', formula: 'a_c = v² / r = ω² r', note: 'Directed towards center of circle' },
      { name: 'Time Period of Simple Pendulum', formula: 'T = 2π √(L / g)', note: 'Independent of mass of bob' },
      { name: 'Velocity in SHM', formula: 'v = ω √(A² - x²)', note: 'Maximum at x=0 (mean position)' },
      { name: 'Escape Velocity', formula: 'v_e = √(2 g R) ≈ 11.2 km/s', note: 'Earth surface value' }
    ]
  },
  {
    id: 'fs-chem-01',
    subject: 'Chemistry',
    title: 'Physical Chemistry & Thermodynamics Formulas',
    chapter: 'Physical Chemistry',
    formulas: [
      { name: 'Ideal Gas Equation', formula: 'P V = n R T', note: 'R = 8.314 J/(mol·K)' },
      { name: 'First Law of Thermodynamics', formula: 'ΔU = q + w', note: 'w = -P ΔV for expansion' },
      { name: 'Nernst Equation', formula: 'E_cell = E°_cell - (0.0591 / n) log Q', note: 'At 298 K temperature' }
    ]
  },
  {
    id: 'fs-bot-01',
    subject: 'Botany',
    title: 'Photosynthesis & Plant Physiology Key Summary',
    chapter: 'Plant Physiology',
    formulas: [
      { name: 'Overall Photosynthesis', formula: '6CO₂ + 12H₂O + Light -> C₆H₁₂O₆ + 6O₂ + 6H₂O', note: 'Occurs in Chloroplasts' },
      { name: 'ATP Yield per Glucose (Aerobic)', formula: '38 ATP (or 36 ATP depending on shuttle system)', note: 'Glycolysis + Krebs Cycle' }
    ]
  }
];
