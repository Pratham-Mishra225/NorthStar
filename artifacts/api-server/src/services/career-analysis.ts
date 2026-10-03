import type {
  AtsAnalysis,
  Job,
  JobMatch,
  ResumeAnalysis,
  Role,
  Skill,
  WeightedSkill,
} from "@ai-career-advisor/api-types";
import {
  demoResume,
  findSkillDefinition,
  jobs,
  roleById,
  roles,
  skillTaxonomy,
} from "../data/career-data";

const sectionPatterns: Array<[string, RegExp]> = [
  ["Summary", /^\s*(professional\s+)?(summary|profile|objective)\s*$/im],
  ["Education", /^\s*education(?:al\s+background)?\s*$/im],
  ["Skills", /^\s*(technical\s+)?skills(?:\s*&\s*tools)?\s*$/im],
  ["Projects", /^\s*(academic\s+)?projects?\s*$/im],
  ["Experience", /^\s*(professional\s+|work\s+)?experience(?:\s*&\s*internships)?\s*$/im],
  ["Certifications", /^\s*(certifications?|licenses?)\s*$/im],
  ["Achievements", /^\s*(achievements?|awards?|honors?)\s*$/im],
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countPhraseMentions(text: string, phrase: string): number {
  const words = phrase.trim().split(/\s+/).map(escapeRegex).join("\\s+");
  return [...text.matchAll(new RegExp(`(?:^|[^a-z0-9])${words}(?=$|[^a-z0-9])`, "gi"))].length;
}

export function extractSkills(text: string): Skill[] {
  const detected: Skill[] = [];
  const hasSkillsSection = getSections(text).includes("Skills");
  for (const entry of skillTaxonomy) {
    const candidates = [entry.name, ...(entry.aliases ?? [])];
    const mentions = Math.max(...candidates.map((candidate) => countPhraseMentions(text, candidate)));
    if (mentions > 0) {
      detected.push({
        name: entry.name,
        category: entry.category,
        confidence: Math.min(0.98, 0.68 + Math.min(3, mentions - 1) * 0.08 + (hasSkillsSection ? 0.08 : 0)),
        source: "Mentioned in resume text",
      });
    }
  }
  return detected;
}

function normalizeSkill(name: string): string {
  const definition = findSkillDefinition(name);
  return (definition?.name ?? name).toLowerCase();
}

function calculateReadiness(skills: Skill[], role: Role): {
  readiness: number;
  matched: string[];
  missing: WeightedSkill[];
} {
  const resumeSkills = new Set(skills.map((skill) => normalizeSkill(skill.name)));
  const matched = role.skills.filter((skill) => resumeSkills.has(normalizeSkill(skill.name)));
  const missing = role.skills
    .filter((skill) => !resumeSkills.has(normalizeSkill(skill.name)))
    .sort((a, b) => b.weight - a.weight);
  const totalWeight = role.skills.reduce((sum, skill) => sum + skill.weight, 0);
  const matchedWeight = matched.reduce((sum, skill) => sum + skill.weight, 0);
  return {
    readiness: totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0,
    matched: matched.map((skill) => skill.name),
    missing,
  };
}

function getSections(text: string): string[] {
  return sectionPatterns
    .filter(([, pattern]) => pattern.test(text))
    .map(([name]) => name);
}

function getSectionText(text: string, sectionName: string): string {
  const content: string[] = [];
  let collecting = false;
  for (const line of text.split(/\r?\n/)) {
    const heading = sectionPatterns.find(([, pattern]) => pattern.test(line));
    if (heading) {
      if (collecting) break;
      collecting = heading[0] === sectionName;
      continue;
    }
    if (collecting) content.push(line);
  }
  return content.join("\n");
}

function scoreAts(text: string, skills: Skill[], role: Role): AtsAnalysis {
  const normalizedSkills = new Set(skills.map((skill) => normalizeSkill(skill.name)));
  const matchedKeywords = role.skills
    .filter((skill) => normalizedSkills.has(normalizeSkill(skill.name)))
    .map((skill) => skill.name);
  const missingKeywords = role.skills
    .filter((skill) => !normalizedSkills.has(normalizeSkill(skill.name)))
    .map((skill) => skill.name);

  const keywordWeight = role.skills.reduce((sum, skill) => sum + skill.weight, 0);
  const foundWeight = role.skills
    .filter((skill) => normalizedSkills.has(normalizeSkill(skill.name)))
    .reduce((sum, skill) => sum + skill.weight, 0);
  const keywords = keywordWeight ? Math.round((foundWeight / keywordWeight) * 100) : 0;
  const skillsSection = new Set(
    extractSkills(getSectionText(text, "Skills")).map((skill) => normalizeSkill(skill.name)),
  );
  const skillsBreadth = role.skills.length
    ? Math.round(
      (role.skills.filter((skill) => skillsSection.has(normalizeSkill(skill.name))).length / role.skills.length) * 100,
    )
    : 0;
  const sections = getSections(text);
  const sectionScore = Math.round((sections.length / sectionPatterns.length) * 100);
  const hasProjects = /\b(projects?|portfolio)\b/i.test(text);
  const hasExperience = /\b(experience|internship|employment)\b/i.test(text);
  const hasMetrics = /\b\d+(?:\.\d+)?\s?%|\b\d{2,}\b/.test(text);
  const projectScore = Math.round(
    (Number(hasProjects) * 45 + Number(hasExperience) * 30 + Number(hasMetrics) * 25),
  );
  const contacts = [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text),
    /(?:\+?\d[\d\s().-]{7,}\d)/.test(text),
    /linkedin\.com\//i.test(text),
    /github\.com\//i.test(text),
  ];
  const contactScore = Math.round((contacts.filter(Boolean).length / contacts.length) * 100);
  const specialChars = (text.match(/[^\w\s.,;:()/%@+&'-]/g) ?? []).length;
  const specialRatio = text.length ? specialChars / text.length : 1;
  const formattingScore = Math.round(
    (text.length >= 100 ? 50 : Math.min(50, (text.length / 100) * 50)) +
    Number(specialRatio < 0.12) * 30 +
    Number(sections.length >= 3) * 20,
  );
  const breakdown = {
    keywords,
    skills: skillsBreadth,
    sections: sectionScore,
    projects: projectScore,
    contact: contactScore,
    formatting: Math.min(100, formattingScore),
  };
  const overallScore = Math.round(
    breakdown.keywords * 0.3 +
    breakdown.skills * 0.25 +
    breakdown.sections * 0.15 +
    breakdown.projects * 0.15 +
    breakdown.contact * 0.1 +
    breakdown.formatting * 0.05,
  );

  const recommendations: string[] = [];
  if (missingKeywords.length) {
    recommendations.push(
      `If they match your real experience, include relevant role terms such as ${missingKeywords.slice(0, 3).join(", ")} in context.`,
    );
  }
  if (!hasMetrics) recommendations.push("Add measurable outcomes to project or experience bullets when you have verifiable results.");
  if (!sections.includes("Projects")) recommendations.push("Use a standard Projects heading to make project work easier to find.");
  if (!contacts[2] || !contacts[3]) recommendations.push("Add professional LinkedIn or GitHub links if you have them.");
  if (recommendations.length < 3) recommendations.push("Keep section headings conventional and use selectable text rather than image-only content.");

  return {
    overallScore,
    breakdown,
    matchedKeywords,
    missingKeywords: missingKeywords.slice(0, 8),
    sections,
    recommendations: recommendations.slice(0, 5),
  };
}

const stopWords = new Set([
  "about", "after", "also", "and", "are", "for", "from", "has", "have", "into",
  "its", "our", "that", "the", "their", "this", "through", "using", "with", "will",
  "work", "team", "role", "candidate", "opportunity", "experience", "skills",
]);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9+#.]+/g) ?? [])
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

const jobTokens = jobs.map((job) => tokenize(`${job.title} ${job.category} ${job.description} ${job.skills.map((skill) => skill.name).join(" ")}`));
const documentFrequency = new Map<string, number>();
for (const tokens of jobTokens) {
  for (const term of new Set(tokens)) documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
}
const inverseDocumentFrequency = new Map(
  [...documentFrequency].map(([term, count]) => [
    term,
    Math.log(1 + jobs.length / (1 + count)),
  ]),
);

function tfIdf(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
  const vector = new Map<string, number>();
  for (const [token, count] of counts) {
    vector.set(token, (1 + Math.log(count)) * (inverseDocumentFrequency.get(token) ?? 0.25));
  }
  return vector;
}

const precomputedJobVectors = new Map(
  jobs.map((job, index) => [job.id, tfIdf(jobTokens[index])]),
);

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const value of a.values()) normA += value * value;
  for (const value of b.values()) normB += value * value;
  for (const [term, value] of a) dot += value * (b.get(term) ?? 0);
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function recommendJobs(text: string, targetRoleId?: string): JobMatch[] {
  const resumeSkills = new Set(extractSkills(text).map((skill) => normalizeSkill(skill.name)));
  const resumeVector = tfIdf(tokenize(text));
  const targetRole = targetRoleId ? roleById(targetRoleId) : undefined;
  const candidates = targetRole
    ? jobs.filter((job) =>
      job.category === targetRole.category ||
      job.title.toLowerCase().includes(targetRole.name.toLowerCase()),
    )
    : jobs;
  return candidates
    .map((job) => {
      const totalWeight = job.skills.reduce((sum, skill) => sum + skill.weight, 0);
      const matched = job.skills.filter((skill) => resumeSkills.has(normalizeSkill(skill.name)));
      const missing = job.skills.filter((skill) => !resumeSkills.has(normalizeSkill(skill.name)));
      const matchedWeight = matched.reduce((sum, skill) => sum + skill.weight, 0);
      const skillMatch = totalWeight ? Math.round((matchedWeight / totalWeight) * 100) : 0;
      const similarity = cosineSimilarity(resumeVector, precomputedJobVectors.get(job.id) ?? new Map());
      const textSimilarity = Math.round(Math.max(0, Math.min(1, similarity)) * 100);
      const matchScore = Math.round(skillMatch * 0.7 + textSimilarity * 0.3);
      const explanation = matched.length
        ? matched.slice(0, 3).map((skill) => `Resume lists ${skill.name}, which this role requests.`)
        : ["The description has some text overlap, but no listed required skills were detected."];
      if (targetRole) explanation.unshift(`This synthetic listing fits the ${targetRole.name} path you selected.`);
      if (missing.length) explanation.push(`Still to build: ${missing.slice(0, 2).map((skill) => skill.name).join(" and ")}.`);
      return {
        ...job,
        matchScore,
        skillMatch,
        textSimilarity,
        matchedSkills: matched.map((skill) => skill.name),
        missingSkills: missing.map((skill) => skill.name),
        explanation,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore || a.title.localeCompare(b.title));
}

export function analyzeResume(filename: string, text: string, targetRoleId: string): ResumeAnalysis {
  const role = roleById(targetRoleId);
  if (!role) throw new Error("Role not found");

  const skills = extractSkills(text);
  const roleFit = calculateReadiness(skills, role);
  const topGaps = roleFit.missing.slice(0, 3);
  const improvementPlan = topGaps.map((skill, index) => {
    const action = index === 0 ? "Build a small project using" : index === 1 ? "Practice" : "Explore";
    return `${action} ${skill.name}; document the work only if you complete it.`;
  });
  if (improvementPlan.length === 0) improvementPlan.push("Your resume includes every listed role skill. Review projects for measurable outcomes and keep your examples current.");

  return {
    filename,
    targetRole: role,
    skills,
    readiness: roleFit.readiness,
    matchedRoleSkills: roleFit.matched,
    missingRoleSkills: roleFit.missing,
    ats: scoreAts(text, skills, role),
    recommendations: recommendJobs(text, targetRoleId).slice(0, 60),
    improvementPlan,
  };
}

export function getDemoDashboard(targetRoleId = "data-analyst") {
  const role = roleById(targetRoleId);
  if (!role) throw new Error("Role not found");
  const analysis = analyzeResume("Alex-Sharma-demo-resume.txt", demoResume, role.id);
  return {
    name: "Alex Sharma",
    targetRole: role,
    skills: analysis.skills,
    readiness: analysis.readiness,
    ats: analysis.ats,
    recommendations: analysis.recommendations.slice(0, 60),
    jobsFound: jobs.length,
  };
}

export function getRecommendationsForRole(roleId: string, text: string): JobMatch[] {
  if (!roleById(roleId)) throw new Error("Role not found");
  return recommendJobs(text, roleId);
}

export function skillCategoryForName(name: string): string {
  return findSkillDefinition(name)?.category ?? "Tools";
}

export function getSupportedRoles(): Role[] {
  return roles;
}

export function getRoleRequirements(id: string): Role | undefined {
  return roleById(id);
}
