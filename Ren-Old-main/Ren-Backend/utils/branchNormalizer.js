/**
 * Branch Normalizer
 * Converts messy / human-entered branch names
 * into strict canonical branch codes.
 */

const BRANCH_MAP = {
  CSE: [
    "cse",
    "computer science",
    "computer science engineering"
  ],

  CSAI: [
    "csai",
    "computer science and ai",
    "computer science & ai",
    "computer science artificial intelligence",
    "computer science & artificial intelligence",
    "computer science engineering & artificial intelligence",
    "computer science engineering and artificial intelligence",
    "cse ai",
    "cse-ai"
  ],

  AIDS: [
    "aids",
    "ai&ds",
    "ai & ds",
    "artificial intelligence and data science",
    "artificial intelligence & data science",
    "ai ds"
  ],

  IT: [
    "it",
    "information technology"
  ],

  ECE: [
    "ece",
    "electronics and communication",
    "electronics & communication",
    "electronics communication engineering",
    "electronics and communication engineering",
    "electronics & communication engineering"
  ],

  EE: [
    "ee",
    "electrical",
    "electrical engineering"
  ],

  ME: [
    "me",
    "mechanical",
    "mechanical engineering"
  ],

  CE: [
    "ce",
    "civil",
    "civil engineering"
  ]
};

/**
 * Normalize branch string → canonical code
 */
export function normalizeBranch(input) {
  if (!input) return null;

  const cleaned = input
    .toString()
    .toLowerCase()
    .replace(/[^a-z& ]/g, "")
    .trim();

  for (const [canonical, variants] of Object.entries(BRANCH_MAP)) {
    if (variants.includes(cleaned)) {
      return canonical;
    }
  }

  return null; // invalid / unknown branch
}

/**
 * Used by future upgrades (admin UI, validations)
 */
export function getAllBranches() {
  return Object.keys(BRANCH_MAP);
}
