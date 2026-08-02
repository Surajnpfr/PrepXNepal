import { 
  MockTest, 
  Question, 
  AttemptReport, 
  CoinTransaction, 
  PaymentClaim, 
  FormulaSheet, 
  PricingPlan 
} from '../types';

// High-Yield Questions Bank for CEE
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
  // --- FULL MOCK TESTS ---
  {
    id: 'mock-cee-full-01',
    title: 'Nepal CEE Official Grand Mock #1 (2026 Edition)',
    examType: 'Nepal CEE',
    kind: 'Mock',
    testCategory: 'full',
    subject: 'Combined',
    chapterName: 'Full CEE Syllabus (Physics, Chemistry, Zoology, Botany, MAT)',
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
    id: 'mock-cee-full-02',
    title: 'Nepal CEE High-Yield Grand Mock #2 (Full Simulation)',
    examType: 'Nepal CEE',
    kind: 'Mock',
    testCategory: 'full',
    subject: 'Combined',
    chapterName: 'Full CEE Syllabus (Physics, Chemistry, Zoology, Botany, MAT)',
    durationSec: 10800, // 3 hours
    totalQuestions: 200,
    questionsPerPage: 20,
    correctMarks: 1,
    wrongMarks: -0.25,
    unansweredMarks: 0,
    isPublished: true,
    questions: buildFullMockQuestions(200),
  },
  {
    id: 'mock-cee-demo-free',
    title: 'CEE Free Demo Diagnostic Mock (50 Questions)',
    examType: 'Nepal CEE',
    kind: 'Mock',
    testCategory: 'full',
    subject: 'Combined',
    chapterName: 'Full Syllabus Quick Diagnostic',
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

  // --- CHAPTER-WISE MOCK TESTS ---
  {
    id: 'mock-chap-phy-01',
    title: 'Physics: Mechanics & Kinematics Chapter Mock',
    examType: 'Nepal CEE',
    kind: 'Chapter',
    testCategory: 'chapter',
    subject: 'Physics',
    chapterName: 'Mechanics & Kinematics',
    durationSec: 1800, // 30 mins
    totalQuestions: 25,
    questionsPerPage: 10,
    correctMarks: 1,
    wrongMarks: -0.25,
    unansweredMarks: 0,
    isPublished: true,
    coinPrice: 0,
    questions: buildFullMockQuestions(25),
  },
  {
    id: 'mock-chap-phy-02',
    title: 'Physics: Electrostatics & Magnetism Chapter Mock',
    examType: 'Nepal CEE',
    kind: 'Chapter',
    testCategory: 'chapter',
    subject: 'Physics',
    chapterName: 'Electrostatics & Magnetism',
    durationSec: 1800, // 30 mins
    totalQuestions: 25,
    questionsPerPage: 10,
    correctMarks: 1,
    wrongMarks: -0.25,
    unansweredMarks: 0,
    isPublished: true,
    coinPrice: 0,
    questions: buildFullMockQuestions(25),
  },
  {
    id: 'mock-chap-chem-01',
    title: 'Chemistry: Organic Reaction Mechanisms & Named Reactions',
    examType: 'Nepal CEE',
    kind: 'Chapter',
    testCategory: 'chapter',
    subject: 'Chemistry',
    chapterName: 'Organic Chemistry',
    durationSec: 2100, // 35 mins
    totalQuestions: 30,
    questionsPerPage: 10,
    correctMarks: 1,
    wrongMarks: -0.25,
    unansweredMarks: 0,
    isPublished: true,
    coinPrice: 0,
    questions: buildFullMockQuestions(30),
  },
  {
    id: 'mock-chap-chem-02',
    title: 'Chemistry: Physical Chemistry & Chemical Equilibrium',
    examType: 'Nepal CEE',
    kind: 'Chapter',
    testCategory: 'chapter',
    subject: 'Chemistry',
    chapterName: 'Physical Chemistry',
    durationSec: 1800, // 30 mins
    totalQuestions: 25,
    questionsPerPage: 10,
    correctMarks: 1,
    wrongMarks: -0.25,
    unansweredMarks: 0,
    isPublished: true,
    coinPrice: 0,
    questions: buildFullMockQuestions(25),
  },
  {
    id: 'mock-chap-zoo-01',
    title: 'Zoology: Human Physiology & Circulatory System',
    examType: 'Nepal CEE',
    kind: 'Chapter',
    testCategory: 'chapter',
    subject: 'Zoology',
    chapterName: 'Human Physiology',
    durationSec: 1800, // 30 mins
    totalQuestions: 25,
    questionsPerPage: 10,
    correctMarks: 1,
    wrongMarks: -0.25,
    unansweredMarks: 0,
    isPublished: true,
    coinPrice: 0,
    questions: buildFullMockQuestions(25),
  },
  {
    id: 'mock-chap-bot-01',
    title: 'Botany: Genetics, Cell Division & Molecular Biology',
    examType: 'Nepal CEE',
    kind: 'Chapter',
    testCategory: 'chapter',
    subject: 'Botany',
    chapterName: 'Genetics & Cell Biology',
    durationSec: 1800, // 30 mins
    totalQuestions: 25,
    questionsPerPage: 10,
    correctMarks: 1,
    wrongMarks: -0.25,
    unansweredMarks: 0,
    isPublished: true,
    coinPrice: 0,
    questions: buildFullMockQuestions(25),
  },
  {
    id: 'mock-chap-mat-01',
    title: 'MAT: Mental Agility & Logical Reasoning Speed Test',
    examType: 'Nepal CEE',
    kind: 'Chapter',
    testCategory: 'chapter',
    subject: 'MAT',
    chapterName: 'Mental Agility & Logic',
    durationSec: 1500, // 25 mins
    totalQuestions: 20,
    questionsPerPage: 10,
    correctMarks: 1,
    wrongMarks: -0.25,
    unansweredMarks: 0,
    isPublished: true,
    coinPrice: 0,
    questions: buildFullMockQuestions(20),
  }
];

export const INITIAL_PAST_REPORTS: AttemptReport[] = [];

export const INITIAL_COIN_TRANSACTIONS: CoinTransaction[] = [];

export const INITIAL_PAYMENT_CLAIMS: PaymentClaim[] = [];

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

export const INITIAL_PRICING_PLANS: PricingPlan[] = [
  {
    id: 'plan-free',
    code: 'Free',
    name: 'Free Aspirant',
    tier: 'Free',
    priceNpr: 0,
    originalPriceNpr: 0,
    mocksGranted: 3,
    coinsGranted: 20,
    description: 'Essential CEE preparation tools with free demo diagnostic mock tests.',
    features: [
      '3 Free Mock Test Credits',
      'Basic Performance Report & Score',
      'High-Yield Formula Sheet Access',
      'Bookmark & Save Questions',
      'Student Dashboard Access'
    ],
    status: 'active'
  },
  {
    id: 'plan-premium-standard',
    code: 'Premium',
    name: 'Standard Premium',
    tier: 'Premium',
    priceNpr: 149,
    originalPriceNpr: 299,
    mocksGranted: 10,
    coinsGranted: 100,
    description: '10 Premium CEE mock credits with national rank prediction & report PDF download.',
    features: [
      '10 Premium Mock Test Credits',
      'Complete Performance Analytics & Rank',
      'Chapter-wise & Subject Weakness Breakdown',
      '2x Study Coin Reward Multiplier',
      'Download & Share Performance PDF',
      'Saved Questions Review Desk'
    ],
    isPopular: true,
    badgeText: 'Most Popular',
    status: 'active'
  },
  {
    id: 'plan-unlimited-elite',
    code: 'Unlimited',
    name: 'Unlimited Elite Pass',
    tier: 'Unlimited',
    priceNpr: 999,
    originalPriceNpr: 1999,
    mocksGranted: null,
    coinsGranted: 500,
    description: 'Unlimited access to all grand mocks, chapter tests, and future model papers.',
    features: [
      'Unlimited Mock Test Attempts',
      'Unlimited Chapter-wise Speed Practice',
      'Priority Help & Support Desk',
      '500 Bonus Study Coins Instant Boost',
      'All Future 2026 Model Mocks Included',
      'AI Study Planner Customization'
    ],
    badgeText: 'Best Value',
    status: 'active'
  }
];
