export interface RemedyGrade {
  abbreviation: string;
  grade: 1 | 2 | 3;
}

export interface RubricRecord {
  path: string;    // e.g. "MIND > Anxiety > night"
  label: string;   // e.g. "night"
  category: string; // e.g. "MIND"
  remedies: RemedyGrade[];
}
