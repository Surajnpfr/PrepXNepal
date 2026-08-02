import type { MockAllocation, SubjectName } from '../types';

/** Mirrors server CEE_UNIT_BLUEPRINT — keep in sync with server/mocksDomain.ts */
export const CEE_UNIT_BLUEPRINT: ReadonlyArray<{
  subject: SubjectName;
  chapter: string;
  count: number;
}> = [
  { subject: 'Zoology', chapter: 'Human Biology & Physiology', count: 15 },
  { subject: 'Zoology', chapter: 'Study of Selected Animals', count: 6 },
  { subject: 'Zoology', chapter: 'Animal Diversity & Classification', count: 4 },
  { subject: 'Zoology', chapter: 'Microbial Diseases & Immunology', count: 4 },
  { subject: 'Zoology', chapter: 'Animal Tissues & Histology', count: 4 },
  { subject: 'Zoology', chapter: 'Evolutionary Biology', count: 3 },
  { subject: 'Zoology', chapter: 'Medical Technology & Applied Biology', count: 2 },
  { subject: 'Zoology', chapter: 'Biota, Environment & Conservation', count: 2 },
  { subject: 'Botany', chapter: 'Biodiversity', count: 9 },
  { subject: 'Botany', chapter: 'Genetics', count: 6 },
  { subject: 'Botany', chapter: 'Plant Physiology', count: 6 },
  { subject: 'Botany', chapter: 'Cell Biology', count: 5 },
  { subject: 'Botany', chapter: 'Ecology & Vegetation', count: 4 },
  { subject: 'Botany', chapter: 'Plant Anatomy', count: 3 },
  { subject: 'Botany', chapter: 'Applied Botany', count: 3 },
  { subject: 'Botany', chapter: 'Developmental Botany', count: 2 },
  { subject: 'Botany', chapter: 'Basic Components of Life', count: 2 },
  { subject: 'Chemistry', chapter: 'Physical Chemistry', count: 17 },
  { subject: 'Chemistry', chapter: 'Organic Chemistry', count: 17 },
  { subject: 'Chemistry', chapter: 'Inorganic Chemistry', count: 10 },
  { subject: 'Chemistry', chapter: 'Applied Chemistry', count: 3 },
  { subject: 'Chemistry', chapter: 'Analytical Chemistry', count: 3 },
  { subject: 'Physics', chapter: 'Modern Physics', count: 12 },
  { subject: 'Physics', chapter: 'Mechanics', count: 10 },
  { subject: 'Physics', chapter: 'Current Electricity & Magnetism', count: 9 },
  { subject: 'Physics', chapter: 'Wave and Optics', count: 8 },
  { subject: 'Physics', chapter: 'Heat & Thermodynamics', count: 7 },
  { subject: 'Physics', chapter: 'Electrostatics & Capacitors', count: 4 },
  { subject: 'MAT', chapter: 'All Subsections', count: 20 },
];

export function subjectQuota(subject: SubjectName): number {
  return CEE_UNIT_BLUEPRINT.filter((u) => u.subject === subject).reduce((s, u) => s + u.count, 0);
}

export function unitsForSubject(subject: SubjectName) {
  return CEE_UNIT_BLUEPRINT.filter((u) => u.subject === subject);
}

export function fullCeeAllocation(): MockAllocation {
  const subjects: Partial<Record<SubjectName, number>> = {};
  for (const u of CEE_UNIT_BLUEPRINT) {
    subjects[u.subject] = (subjects[u.subject] || 0) + u.count;
  }
  return {
    subjects,
    chapters: CEE_UNIT_BLUEPRINT.map((u) => ({
      subject: u.subject,
      chapter: u.chapter,
      count: u.count,
    })),
  };
}
