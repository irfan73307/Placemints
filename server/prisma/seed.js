const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const mockUser = {
  id: 'usr_sastra_2026_01',
  name: 'Shaik Haroon',
  email: 'shaik.haroon@sastra.ac.in',
  branch: 'CSE',
  batchYear: 2026,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  targetRole: 'Full Stack Software Engineer',
  cgpa: '8.74',
};

const mockCompanies = [
  {
    id: 'tcs-digital',
    slug: 'tcs-digital',
    name: 'TCS (Digital & Prime)',
    logoUrl: 'https://logo.clearbit.com/tcs.com',
    ctc: '₹7.0 - 11.5 LPA',
    avgCtc: 9.25,
    tier: 'Mass / Digital',
    sector: 'IT Services',
    description: 'Tata Consultancy Services visits SASTRA annually for Ninja, Digital, and Prime software roles, focusing on DSA, aptitude, and core CS fundamentals.',
    tags: 'Service-based,Mass Recruiter,National Qualifier',
    rounds: [
      { roundNumber: 1, title: 'Round 1: NQT Online Assessment', description: 'Foundation aptitude (numerical & verbal) + Advanced Quantitative & Coding (2 medium problems in C/C++/Java/Python).' },
      { roundNumber: 2, title: 'Round 2: Technical Interview', description: 'Deep dive into Data Structures, OOPs, DBMS queries, OS process scheduling, and final year project architecture.' },
      { roundNumber: 3, title: 'Round 3: HR & Management Interview', description: 'Behavioral assessment, relocation willingness, shift flexibility, and communication check.' },
    ],
    pyqs: [
      { questionText: 'Find maximum sum subarray of size K (Sliding Window)', difficulty: 'Easy', topicTags: 'Arrays,Sliding Window', year: 2024, likeCount: 14 },
      { questionText: 'Detect and remove loop in a Singly Linked List', difficulty: 'Medium', topicTags: 'Linked List,Pointers', year: 2024, likeCount: 22 },
      { questionText: 'SQL query to find 2nd highest salary using CTE and DENSE_RANK()', difficulty: 'Medium', topicTags: 'DBMS,SQL', year: 2023, likeCount: 19 },
      { questionText: 'Check if a Binary Tree is a valid Binary Search Tree (BST)', difficulty: 'Medium', topicTags: 'Trees,BST', year: 2023, likeCount: 31 },
    ],
    resources: [
      { title: 'TCS Digital NQT Syllabus & Previous Papers', url: 'https://geeksforgeeks.org', type: 'PDF Guide', tags: 'Syllabus,NQT' },
      { title: 'Top 50 TCS Coding Questions Sheet', url: 'https://leetcode.com', type: 'Problem Set', tags: 'DSA,Coding' },
      { title: 'SASTRA 2024 TCS Interview Experiences', url: 'https://geeksforgeeks.org', type: 'Experience', tags: 'SASTRA,Interview' },
    ]
  },
  {
    id: 'zoho',
    slug: 'zoho',
    name: 'Zoho Corporation',
    logoUrl: 'https://logo.clearbit.com/zoho.com',
    ctc: '₹5.5 - 8.5 LPA',
    avgCtc: 7.0,
    tier: 'Product-based',
    sector: 'SaaS / Product',
    description: 'Zoho conducts a rigorous 5-round campus selection process emphasizing raw problem-solving, matrix manipulation, and LLD / System Design.',
    tags: 'Product-based,Dream Company,Core Software',
    rounds: [
      { roundNumber: 1, title: 'Round 1: Written C / Java Aptitude', description: 'Output prediction, pointers, recursion trace, time complexity analysis, and bitwise operations.' },
      { roundNumber: 2, title: 'Round 2: Basic Programming (5 Questions)', description: 'Matrix rotation, string formatting, number theory, pattern printing without built-in libraries.' },
      { roundNumber: 3, title: 'Round 3: Advanced Programming (Design)', description: 'Low Level Design of a mini system (e.g. Railway Reservation, Snake & Ladder, Vending Machine).' },
      { roundNumber: 4, title: 'Round 4: Technical HR', description: 'Discussion on design choices in Round 3, pointers, memory management, and project code walkthrough.' },
      { roundNumber: 5, title: 'Round 5: General HR', description: 'Culture fit, career goals, team dynamics, and compensation.' },
    ],
    pyqs: [
      { questionText: 'Design a Taxi Booking Application (Console LLD)', difficulty: 'Hard', topicTags: 'System Design,LLD,OOP', year: 2024, likeCount: 45 },
      { questionText: 'Print matrix in Spiral Order without extra memory', difficulty: 'Medium', topicTags: 'Matrix,Arrays', year: 2024, likeCount: 18 },
      { questionText: 'Lookup substring matches with wildcard characters (* and ?)', difficulty: 'Medium', topicTags: 'Strings,Recursion', year: 2023, likeCount: 27 },
      { questionText: 'Evaluate Reverse Polish Notation (Stack)', difficulty: 'Medium', topicTags: 'Stack,Parsing', year: 2023, likeCount: 12 },
    ],
    resources: [
      { title: 'Zoho Round 3 LLD System Design Patterns', url: 'https://geeksforgeeks.org', type: 'Design Guide', tags: 'LLD,System Design' },
      { title: 'Zoho C Output Tracking Quiz Set', url: 'https://sanfoundry.com', type: 'Quiz', tags: 'C,Pointers' },
    ]
  },
  {
    id: 'amazon',
    slug: 'amazon',
    name: 'Amazon India',
    logoUrl: 'https://logo.clearbit.com/amazon.in',
    ctc: '₹28.0 - 44.0 LPA',
    avgCtc: 36.0,
    tier: 'Super Dream',
    sector: 'E-Commerce / Cloud',
    description: 'Amazon visits SASTRA for SDE-1 roles, evaluating Candidates on Amazon Leadership Principles, Graphs, Dynamic Programming, and System Scalability.',
    tags: 'Super Dream,MAANG,High CTC',
    rounds: [
      { roundNumber: 1, title: 'Round 1: Online Assessment (OA)', description: '2 Coding Problems (Medium/Hard) + Work Simulation & Amazon Leadership Principles survey.' },
      { roundNumber: 2, title: 'Round 2: Technical Interview 1', description: 'DSA (Trees/Graphs/DP) + 20 mins Leadership Principles behavioral scenarios.' },
      { roundNumber: 3, title: 'Round 3: Technical Interview 2', description: 'Advanced DSA (Heap, Trie, Segment Tree) + System Design fundamentals.' },
      { roundNumber: 4, title: 'Round 4: Bar Raiser Interview', description: 'Deep probe into trade-offs, scalability, and strict evaluation of Leadership Principles.' },
    ],
    pyqs: [
      { questionText: 'Course Schedule II (Topological Sort / Kahn Algorithm)', difficulty: 'Medium', topicTags: 'Graphs,Topological Sort', year: 2024, likeCount: 52 },
      { questionText: 'LRU Cache Implementation (Doubly Linked List + HashMap)', difficulty: 'Hard', topicTags: 'Data Structures,Design', year: 2024, likeCount: 68 },
      { questionText: 'Word Break Problem (Dynamic Programming)', difficulty: 'Medium', topicTags: 'DP,Strings', year: 2023, likeCount: 39 },
      { questionText: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', topicTags: 'Trees,Design', year: 2023, likeCount: 41 },
    ],
    resources: [
      { title: 'Amazon 16 Leadership Principles Sheet', url: 'https://amazon.jobs', type: 'Article', tags: 'Leadership,Behavioral' },
      { title: 'LeetCode Amazon High Frequency Questions', url: 'https://leetcode.com', type: 'Problem Set', tags: 'LeetCode,DSA' },
    ]
  },
  {
    id: 'infosys',
    slug: 'infosys',
    name: 'Infosys (Power Programmer)',
    logoUrl: 'https://logo.clearbit.com/infosys.com',
    ctc: '₹9.5 - 13.0 LPA',
    avgCtc: 11.25,
    tier: 'Digital / Specialist',
    sector: 'IT Services',
    description: 'Recruits for Specialist Programmer (SP) and Digital Specialist Engineer (DSE) through HackWithInfy and campus drives.',
    tags: 'Service-based,HackWithInfy,Specialist',
    rounds: [
      { roundNumber: 1, title: 'Round 1: HackWithInfy / OA', description: '3 competitive programming problems ranging from Greedy algorithms to Dynamic Programming.' },
      { roundNumber: 2, title: 'Round 2: Technical Interview', description: 'Discussion of OA problem solutions, Data Structures, DBMS indexing, and web technologies.' },
      { roundNumber: 3, title: 'Round 3: HR Interview', description: 'Document verification and career alignment discussion.' },
    ],
    pyqs: [
      { questionText: 'Minimum Coins to Make Change (Greedy vs DP)', difficulty: 'Medium', topicTags: 'DP,Greedy', year: 2024, likeCount: 15 },
      { questionText: 'Find Connected Components in Undirected Graph', difficulty: 'Medium', topicTags: 'Graphs,DFS', year: 2024, likeCount: 20 },
      { questionText: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', topicTags: 'Strings,Sliding Window', year: 2023, likeCount: 28 },
    ],
    resources: [
      { title: 'Infosys SP Previous HackWithInfy Archives', url: 'https://geeksforgeeks.org', type: 'PDF Archive', tags: 'HackWithInfy,SP' },
    ]
  },
  {
    id: 'paypal',
    slug: 'paypal',
    name: 'PayPal India',
    logoUrl: 'https://logo.clearbit.com/paypal.com',
    ctc: '₹24.5 LPA',
    avgCtc: 24.5,
    tier: 'Super Dream',
    sector: 'FinTech',
    description: 'PayPal selects top talent from SASTRA for Software Engineer roles focusing on backend performance, microservices, databases, and secure APIs.',
    tags: 'Super Dream,FinTech,Product-based',
    rounds: [
      { roundNumber: 1, title: 'Round 1: Online Coding Test', description: '2 DSA coding problems + SQL queries + OS & Networking MCQs.' },
      { roundNumber: 2, title: 'Round 2: Technical Interview 1', description: 'Data structures (Trees, HashMaps), Concurrency, Multithreading, and REST API design.' },
      { roundNumber: 3, title: 'Round 3: Technical Interview 2', description: 'Low level object-oriented design and deep dive into past project architectures.' },
    ],
    pyqs: [
      { questionText: 'Design a Rate Limiter Algorithm (Token Bucket)', difficulty: 'Medium', topicTags: 'System Design,Rate Limiting', year: 2024, likeCount: 34 },
      { questionText: 'Lowest Common Ancestor in Binary Tree', difficulty: 'Medium', topicTags: 'Trees,LCA', year: 2024, likeCount: 23 },
      { questionText: 'Implement Producer-Consumer using Blocking Queue', difficulty: 'Medium', topicTags: 'OS,Concurrency,Threads', year: 2023, likeCount: 19 },
    ],
    resources: [
      { title: 'PayPal Technical Interview Blueprint', url: 'https://geeksforgeeks.org', type: 'Guide', tags: 'PayPal,FinTech' },
    ]
  }
];

async function seed() {
  console.log('🌱 Starting database seed...');

  // Create default user
  const hashedPassword = await bcrypt.hash('sastra2026', 10);
  const user = await prisma.user.upsert({
    where: { email: mockUser.email },
    update: {},
    create: {
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      passwordHash: hashedPassword,
      avatarUrl: mockUser.avatarUrl,
      branch: mockUser.branch,
      batchYear: mockUser.batchYear,
      targetRole: mockUser.targetRole,
      cgpa: mockUser.cgpa,
      role: 'student',
    },
  });

  console.log(`👤 User created/verified: ${user.name} (${user.email})`);

  for (const cData of mockCompanies) {
    const { rounds, pyqs, resources, ...companyData } = cData;

    const company = await prisma.company.upsert({
      where: { id: companyData.id },
      update: companyData,
      create: companyData,
    });

    console.log(`🏢 Seeded company: ${company.name}`);

    // Create rounds
    for (const r of rounds) {
      await prisma.interviewRound.create({
        data: {
          companyId: company.id,
          roundNumber: r.roundNumber,
          title: r.title,
          description: r.description,
        },
      });
    }

    // Create PYQs
    for (const q of pyqs) {
      await prisma.question.create({
        data: {
          companyId: company.id,
          questionText: q.questionText,
          difficulty: q.difficulty,
          topicTags: q.topicTags,
          year: q.year,
          likeCount: q.likeCount,
          contributedBy: user.id,
        },
      });
    }

    // Create resources
    for (const res of resources) {
      await prisma.resource.create({
        data: {
          title: res.title,
          type: res.type,
          url: res.url,
          tags: res.tags,
          uploadedBy: user.id,
        },
      });
    }

    // Create initial saved bookmark for tcs-digital, zoho, infosys, paypal
    if (['tcs-digital', 'zoho', 'infosys', 'paypal'].includes(company.id)) {
      await prisma.savedCompany.upsert({
        where: {
          userId_companyId: {
            userId: user.id,
            companyId: company.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          companyId: company.id,
        },
      });
    }
  }

  console.log('✅ Database seeding complete!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
