import type { Job, Role, Skill, WeightedSkill } from "@ai-career-advisor/api-types";

interface SkillDefinition {
  name: string;
  category: string;
  aliases?: string[];
}

export const skillTaxonomy: SkillDefinition[] = [
  { name: "Python", category: "Programming", aliases: ["py"] },
  { name: "Java", category: "Programming" },
  { name: "C++", category: "Programming", aliases: ["cpp"] },
  { name: "JavaScript", category: "Programming", aliases: ["JS"] },
  { name: "TypeScript", category: "Programming", aliases: ["TS"] },
  { name: "R", category: "Programming" },
  { name: "Bash", category: "Programming", aliases: ["shell scripting"] },
  { name: "Go", category: "Programming", aliases: ["golang"] },
  { name: "HTML", category: "Programming" },
  { name: "CSS", category: "Programming" },
  { name: "React", category: "Programming", aliases: ["React.js"] },
  { name: "Node.js", category: "Programming", aliases: ["NodeJS"] },
  { name: "REST APIs", category: "Programming", aliases: ["REST API"] },
  { name: "Git", category: "Tools" },
  { name: "GitHub", category: "Tools" },
  { name: "SQL", category: "Databases", aliases: ["structured query language"] },
  { name: "MySQL", category: "Databases" },
  { name: "PostgreSQL", category: "Databases", aliases: ["Postgres"] },
  { name: "MongoDB", category: "Databases" },
  { name: "SQLite", category: "Databases" },
  { name: "Redis", category: "Databases" },
  { name: "Snowflake", category: "Databases" },
  { name: "BigQuery", category: "Databases", aliases: ["Google BigQuery"] },
  { name: "Data Modeling", category: "Databases" },
  { name: "Database Design", category: "Databases" },
  { name: "ETL", category: "Data & Analytics", aliases: ["extract transform load"] },
  { name: "dbt", category: "Tools" },
  { name: "Excel", category: "Data & Analytics", aliases: ["Microsoft Excel", "spreadsheets"] },
  { name: "Statistics", category: "Data & Analytics", aliases: ["statistical analysis"] },
  { name: "Pandas", category: "Data & Analytics" },
  { name: "NumPy", category: "Data & Analytics", aliases: ["numpy"] },
  { name: "Data Analysis", category: "Data & Analytics", aliases: ["data analytics"] },
  { name: "Data Cleaning", category: "Data & Analytics", aliases: ["data cleansing"] },
  { name: "Exploratory Data Analysis", category: "Data & Analytics", aliases: ["EDA"] },
  { name: "A/B Testing", category: "Data & Analytics", aliases: ["AB testing", "split testing"] },
  { name: "Hypothesis Testing", category: "Data & Analytics" },
  { name: "Forecasting", category: "Data & Analytics", aliases: ["time series forecasting"] },
  { name: "KPI Reporting", category: "Business", aliases: ["key performance indicators"] },
  { name: "Business Analysis", category: "Business" },
  { name: "Market Research", category: "Business" },
  { name: "Descriptive Analytics", category: "Data & Analytics" },
  { name: "Data Storytelling", category: "Visualization" },
  { name: "Spreadsheet Modeling", category: "Data & Analytics" },
  { name: "Power BI", category: "Visualization", aliases: ["Microsoft Power BI"] },
  { name: "Tableau", category: "Visualization" },
  { name: "Matplotlib", category: "Visualization" },
  { name: "Seaborn", category: "Visualization" },
  { name: "Looker", category: "Visualization" },
  { name: "Looker Studio", category: "Visualization", aliases: ["Google Data Studio"] },
  { name: "D3.js", category: "Visualization", aliases: ["D3"] },
  { name: "ggplot2", category: "Visualization" },
  { name: "Dashboard Development", category: "Visualization", aliases: ["dashboarding"] },
  { name: "Data Visualization", category: "Visualization" },
  { name: "Machine Learning", category: "Machine Learning", aliases: ["ML"] },
  { name: "Scikit-learn", category: "Machine Learning", aliases: ["sklearn", "scikit learn"] },
  { name: "TensorFlow", category: "Machine Learning" },
  { name: "PyTorch", category: "Machine Learning" },
  { name: "Deep Learning", category: "Machine Learning" },
  { name: "Natural Language Processing", category: "Machine Learning", aliases: ["NLP"] },
  { name: "Generative AI", category: "Machine Learning", aliases: ["GenAI"] },
  { name: "Large Language Models", category: "Machine Learning", aliases: ["LLM", "LLMs"] },
  { name: "Prompt Engineering", category: "Machine Learning" },
  { name: "OpenAI API", category: "Machine Learning" },
  { name: "Feature Engineering", category: "Machine Learning" },
  { name: "Model Evaluation", category: "Machine Learning" },
  { name: "Computer Vision", category: "Machine Learning" },
  { name: "MLOps", category: "Machine Learning" },
  { name: "Classification", category: "Machine Learning" },
  { name: "Regression", category: "Machine Learning" },
  { name: "Clustering", category: "Machine Learning" },
  { name: "Recommendation Systems", category: "Machine Learning" },
  { name: "Hugging Face", category: "Machine Learning" },
  { name: "LangChain", category: "Machine Learning" },
  { name: "AWS", category: "Cloud", aliases: ["Amazon Web Services"] },
  { name: "Microsoft Azure", category: "Cloud", aliases: ["Azure"] },
  { name: "Google Cloud", category: "Cloud", aliases: ["GCP"] },
  { name: "Docker", category: "Cloud" },
  { name: "Kubernetes", category: "Cloud", aliases: ["K8s"] },
  { name: "Vertex AI", category: "Cloud" },
  { name: "Amazon S3", category: "Cloud", aliases: ["S3"] },
  { name: "Cloud Computing", category: "Cloud" },
  { name: "Communication", category: "Business", aliases: ["written communication", "verbal communication"] },
  { name: "Presentation", category: "Business", aliases: ["presentation skills"] },
  { name: "Stakeholder Management", category: "Business" },
  { name: "Problem Solving", category: "Business" },
  { name: "Requirements Analysis", category: "Business", aliases: ["requirement analysis"] },
  { name: "Product Thinking", category: "Business" },
  { name: "Product Management", category: "Business" },
  { name: "Financial Modeling", category: "Business" },
  { name: "Accounting", category: "Business" },
  { name: "Corporate Finance", category: "Business" },
  { name: "Marketing Analytics", category: "Business" },
  { name: "Search Engine Optimization", category: "Business", aliases: ["SEO"] },
  { name: "Paid Media", category: "Business", aliases: ["paid advertising"] },
  { name: "Customer Research", category: "Business", aliases: ["user research"] },
  { name: "Operations Research", category: "Business" },
  { name: "Supply Chain", category: "Business", aliases: ["supply chain management"] },
  { name: "Process Improvement", category: "Business" },
  { name: "Project Management", category: "Business" },
  { name: "Agile", category: "Tools", aliases: ["agile methodology"] },
  { name: "Consulting", category: "Business" },
  { name: "Research Methods", category: "Business" },
  { name: "Technical Writing", category: "Business" },
  { name: "Figma", category: "Tools" },
  { name: "Jira", category: "Tools" },
  { name: "Google Analytics", category: "Tools", aliases: ["GA4"] },
  { name: "Microsoft PowerPoint", category: "Tools", aliases: ["PowerPoint"] },
  { name: "Google Sheets", category: "Tools" },
  { name: "Econometrics", category: "Data & Analytics" },
  { name: "Data Governance", category: "Data & Analytics" },
  { name: "Data Warehousing", category: "Data & Analytics" },
  { name: "Experiment Design", category: "Data & Analytics" },
  { name: "Causal Inference", category: "Data & Analytics" },
  { name: "Customer Segmentation", category: "Marketing" },
  { name: "Brand Strategy", category: "Marketing" },
  { name: "Content Marketing", category: "Marketing" },
  { name: "Conversion Rate Optimization", category: "Marketing", aliases: ["CRO"] },
  { name: "Product Analytics", category: "Data & Analytics" },
  { name: "User Stories", category: "Business" },
  { name: "Wireframing", category: "Business" },
  { name: "Salesforce", category: "Tools" },
  { name: "Power Query", category: "Data & Analytics" },
  { name: "VLOOKUP", category: "Data & Analytics" },
];

type SkillSeed = readonly [name: string, weight: number];

function makeRole(
  id: string,
  name: string,
  category: string,
  description: string,
  core: SkillSeed[],
  important: SkillSeed[],
  additional: SkillSeed[],
): Role {
  const skills: WeightedSkill[] = [
    ...core.map(([skillName, weight]) => ({ name: skillName, weight, priority: "core" as const })),
    ...important.map(([skillName, weight]) => ({ name: skillName, weight, priority: "important" as const })),
    ...additional.map(([skillName, weight]) => ({ name: skillName, weight, priority: "additional" as const })),
  ];
  return { id, name, category, description, skills };
}

export const roles: Role[] = [
  makeRole("data-analyst", "Data Analyst", "Data & Analytics", "Turn business questions into clear analysis, useful dashboards, and evidence-based recommendations.", [["SQL", 5], ["Excel", 4], ["Statistics", 4], ["Python", 3]], [["Power BI", 3], ["Tableau", 3], ["Pandas", 2], ["Data Cleaning", 2]], [["A/B Testing", 1], ["Data Storytelling", 1], ["Communication", 1]]),
  makeRole("business-analyst", "Business Analyst", "Business", "Translate stakeholder needs into requirements, process insights, and measurable solutions.", [["Requirements Analysis", 5], ["Business Analysis", 5], ["Communication", 4]], [["SQL", 3], ["Excel", 3], ["Stakeholder Management", 3], ["Data Analysis", 2]], [["Agile", 2], ["Jira", 1], ["Presentation", 1]]),
  makeRole("product-analyst", "Product Analyst", "Product & Data", "Help product teams understand user behavior, test ideas, and prioritize product improvements.", [["SQL", 5], ["Product Analytics", 4], ["Statistics", 4]], [["Python", 3], ["A/B Testing", 3], ["Data Visualization", 2], ["Customer Research", 2]], [["Product Thinking", 2], ["Communication", 1], ["Looker", 1]]),
  makeRole("data-scientist", "Data Scientist", "Data & AI", "Build and evaluate statistical and machine-learning approaches to answer complex questions.", [["Python", 5], ["Statistics", 5], ["Machine Learning", 5]], [["Pandas", 3], ["Scikit-learn", 3], ["SQL", 2], ["Model Evaluation", 2]], [["Feature Engineering", 2], ["Data Storytelling", 1], ["Git", 1]]),
  makeRole("ml-analyst", "ML Analyst", "Data & AI", "Evaluate machine-learning systems and translate model performance into operational insights.", [["Python", 5], ["Machine Learning", 4], ["Statistics", 4]], [["Scikit-learn", 3], ["Model Evaluation", 3], ["SQL", 2], ["Pandas", 2]], [["Feature Engineering", 2], ["MLOps", 1], ["Communication", 1]]),
  makeRole("ai-engineer", "AI Engineer", "Data & AI", "Prototype and integrate practical AI capabilities with an emphasis on evaluation and reliable delivery.", [["Python", 5], ["Generative AI", 4], ["Large Language Models", 4]], [["REST APIs", 3], ["Prompt Engineering", 3], ["Machine Learning", 3], ["Git", 2]], [["LangChain", 2], ["Hugging Face", 1], ["Cloud Computing", 1]]),
  makeRole("financial-analyst", "Financial Analyst", "Finance", "Support planning and investment decisions through financial models, reporting, and market analysis.", [["Excel", 5], ["Financial Modeling", 5], ["Accounting", 4]], [["Corporate Finance", 3], ["Statistics", 2], ["PowerPoint", 2], ["Data Analysis", 2]], [["SQL", 1], ["Communication", 1], ["Presentation", 1]]),
  makeRole("marketing-analyst", "Marketing Analyst", "Marketing", "Measure campaign performance and customer behavior to improve marketing decisions.", [["Marketing Analytics", 5], ["Excel", 4], ["Data Analysis", 4]], [["Google Analytics", 3], ["SQL", 3], ["Customer Segmentation", 2], ["A/B Testing", 2]], [["SEO", 2], ["Paid Media", 1], ["Presentation", 1]]),
  makeRole("operations-analyst", "Operations Analyst", "Operations", "Find process bottlenecks and use data to make day-to-day operations more effective.", [["Excel", 5], ["Data Analysis", 4], ["Problem Solving", 4]], [["SQL", 3], ["Statistics", 3], ["Process Improvement", 3], ["Operations Research", 2]], [["Supply Chain", 2], ["Communication", 1], ["Power BI", 1]]),
  makeRole("research-intern", "Research Intern", "Research", "Support structured research through careful data collection, analysis, and clear written findings.", [["Research Methods", 5], ["Statistics", 4], ["Technical Writing", 3]], [["Python", 3], ["Data Cleaning", 2], ["Excel", 2], ["Market Research", 2]], [["Presentation", 1], ["Communication", 1], ["SQL", 1]]),
  makeRole("consulting-intern", "Consulting Intern", "Consulting", "Help teams frame business problems, analyze evidence, and communicate practical recommendations.", [["Problem Solving", 5], ["Communication", 5], ["Business Analysis", 4]], [["Excel", 3], ["Market Research", 3], ["Presentation", 3], ["Consulting", 2]], [["Stakeholder Management", 2], ["Data Analysis", 2], ["PowerPoint", 1]]),
  makeRole("bi-analyst", "Business Intelligence Analyst", "Data & Analytics", "Build trusted reporting and data models that help teams monitor performance and act quickly.", [["SQL", 5], ["Data Warehousing", 4], ["Data Modeling", 4]], [["Power BI", 4], ["Tableau", 3], ["ETL", 3], ["Excel", 2]], [["dbt", 2], ["Data Governance", 1], ["Communication", 1]]),
];

const companyNames = [
  "Northstar Analytics", "Monsoon Labs", "Cedarfield Research", "Brightpath Systems",
  "Juniper Markets", "Bluepeak Insights", "Harborlight Finance", "Meridian Digital",
  "Kite & Key Consulting", "Redwood Commerce", "Fieldnote Technologies", "LatticeWorks",
  "Aster Mobility", "Copperleaf Health", "Openline Ventures", "Saffron Cloud",
  "Foundry Data Co.", "Common Ground Products", "Orbit Financial", "Cobalt Retail",
  "Tandem Strategy", "Acorn Learning", "Mosaic Operations", "Signal House Media",
];

const cities = ["Bengaluru", "Mumbai", "Hyderabad", "Pune", "Delhi NCR", "Chennai", "Kolkata", "Remote"];
const modes = ["Hybrid", "On-site", "Remote", "Hybrid", "On-site", "Remote", "Hybrid", "Remote"];
const titleSuffixes = ["Intern", "Graduate Trainee", "Junior Associate", "Research Associate", "Co-op Analyst", "Early Careers Analyst", "Summer Intern"];
const jobTypes = ["Internship", "Graduate programme", "Full-time", "Internship", "Full-time", "Contract"];

function makeJob(role: Role, index: number): Job {
  const company = companyNames[(index * 5 + roles.indexOf(role) * 3) % companyNames.length];
  const city = cities[(index + roles.indexOf(role) * 2) % cities.length];
  const suffix = titleSuffixes[index % titleSuffixes.length];
  const mode = city === "Remote" ? "Remote" : modes[(index + roles.indexOf(role)) % modes.length];
  const jobType = jobTypes[index % jobTypes.length];
  const requirements = role.skills.slice(0, index % 3 === 0 ? 6 : 5);
  const projectFocus = role.skills.slice(index % 2, (index % 2) + 3).map((skill) => skill.name.toLowerCase()).join(", ");
  const payBase = jobType === "Internship" ? 240000 : 550000;
  const salaryMin = payBase + (index % 5) * 50000;
  const createdAt = new Date(Date.now() - index * 86400000).toISOString();

  return {
    id: `${role.id}-${String(index + 1).padStart(2, "0")}`,
    title: `${role.name} ${suffix}`,
    company,
    city,
    workMode: mode,
    category: role.category,
    jobType,
    experienceLevel: jobType === "Internship" ? "Student / internship" : "Entry level",
    description: `${company} is inviting applications for an early-career ${role.name.toLowerCase()} opportunity. The selected candidate will work with a small team on ${projectFocus}, prepare clear findings, and collaborate with colleagues to turn analysis into practical recommendations. This synthetic listing is provided for product demonstration and is not an open vacancy.`,
    salary: { min: salaryMin, max: salaryMin + 350000, currency: "INR" },
    skills: requirements,
    source: "Demo Dataset",
    createdAt,
    active: true,
  };
}

export const jobs: Job[] = roles.flatMap((role) =>
  Array.from({ length: 14 }, (_, index) => makeJob(role, index)),
);

export const demoResume = `Alex Sharma
alex.sharma@example.com | +91 98765 43210 | linkedin.com/in/alex-sharma | github.com/alexsharma

SUMMARY
Computer science student focused on practical data analysis and clear reporting. Interested in turning messy datasets into useful decisions.

EDUCATION
B.Tech in Computer Science, North City Institute of Technology | 2022–2026

SKILLS
Python, SQL, Excel, Power BI, Pandas, NumPy, Statistics, Data Cleaning, Tableau, Git, Machine Learning, Scikit-learn, Data Visualization, Communication

PROJECTS
Retail Sales Dashboard — Built a Power BI dashboard with SQL and Excel to review weekly sales across 12 product categories. Reduced manual reporting time by 30%.
Customer Churn Study — Used Python, Pandas and Scikit-learn to clean a customer dataset, compare classification models and summarize churn patterns.

EXPERIENCE
Data Intern, Campus Insights Lab | May 2025 – Aug 2025
Prepared weekly SQL reports, validated source data, and presented findings to a student project team.

CERTIFICATIONS
Applied Data Analytics Foundations

ACHIEVEMENTS
Presented a project showcase to 40 attendees.`;

export const demoSkills: Skill[] = [
  "Python", "SQL", "Excel", "Power BI", "Pandas", "NumPy", "Statistics",
  "Data Cleaning", "Tableau", "Git", "Machine Learning", "Scikit-learn",
  "Data Visualization", "Communication",
].map((name) => {
  const definition = skillTaxonomy.find((skill) => skill.name === name);
  return { name, category: definition?.category ?? "Tools", confidence: 0.92, source: "Detected from demo resume" };
});

export const findSkillDefinition = (name: string): SkillDefinition | undefined =>
  skillTaxonomy.find((skill) => skill.name.toLowerCase() === name.toLowerCase());

export const roleById = (id: string): Role | undefined => roles.find((role) => role.id === id);
export const jobById = (id: string): Job | undefined => jobs.find((job) => job.id === id);

export type { SkillDefinition };
