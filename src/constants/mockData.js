/**
 * Mock Data for Placemints
 * 
 * Purpose:
 * Realistic dataset representing SASTRA University campus placement recruiters, past year questions (PYQs),
 * interview selection rounds, preparation resources, and student profiles.
 * 
 * Future Backend Integration:
 * This data will be replaced by backend API endpoints:
 * - GET /api/companies
 * - GET /api/companies/:id
 * - GET /api/profile
 * - GET /api/library
 */

export const mockUser = {
  id: 'usr_sastra_2026_01',
  name: 'Shaik Haroon',
  email: 'shaik.haroon@sastra.ac.in',
  branch: 'CSE',
  batch: '2026',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  targetRole: 'Full Stack Software Engineer',
  cgpa: '8.74',
  savedCount: 0,
  practicedCount: 18,
};

export const mockCompanies = [
  {
    id: 'tcs-digital',
    name: 'TCS (Digital & Prime)',
    logo: 'https://logo.clearbit.com/tcs.com',
    ctc: '₹7.0 - 11.5 LPA',
    tier: 'Mass / Digital',
    description: 'Tata Consultancy Services visits SASTRA annually for Ninja, Digital, and Prime software roles, focusing on DSA, aptitude, and core CS fundamentals.',
    tags: ['Service-based', 'Mass Recruiter', 'National Qualifier'],
    isSaved: false,
    rounds: [
      { id: 1, title: 'Round 1: NQT Online Assessment', description: 'Foundation aptitude (numerical & verbal) + Advanced Quantitative & Coding (2 medium problems in C/C++/Java/Python).' },
      { id: 2, title: 'Round 2: Technical Interview', description: 'Deep dive into Data Structures, OOPs, DBMS queries, OS process scheduling, and final year project architecture.' },
      { id: 3, title: 'Round 3: HR & Management Interview', description: 'Behavioral assessment, relocation willingness, shift flexibility, and communication check.' },
    ],
    pyqs: [
      { id: 'q1', question: 'Maximum Number of Pairs in Array', difficulty: 'Easy', topic: 'Arrays', topicTags: ['Arrays', 'HashMap'], year: '2024', frequency: '100%', starRating: '★★★★★', importanceLabel: 'Very Frequently Asked', expectedRound: 'Round 2: Technical Interview (DSA & Core CS)' },
      { id: 'q2', question: 'Detect and remove loop in a Singly Linked List', difficulty: 'Medium', topic: 'Linked List', topicTags: ['Linked List', 'Two Pointers'], year: '2024', frequency: '92%', starRating: '★★★★★', importanceLabel: 'Frequently Asked', expectedRound: 'Round 2: Technical Interview (DSA & Core CS)' },
      { id: 'q3', question: 'SQL query to find 2nd highest salary using CTE and DENSE_RANK()', difficulty: 'Medium', topic: 'DBMS', topicTags: ['DBMS', 'SQL'], year: '2023', frequency: '85%', starRating: '★★★★☆', importanceLabel: 'Important', expectedRound: 'Round 2: Technical Interview (DSA & Core CS)' },
      { id: 'q4', question: 'Check if a Binary Tree is a valid Binary Search Tree (BST)', difficulty: 'Medium', topic: 'Trees', topicTags: ['Trees', 'Binary Search Tree'], year: '2023', frequency: '80%', starRating: '★★★★☆', importanceLabel: 'Important', expectedRound: 'Round 2: Technical Interview (DSA & Core CS)' },
    ],
    resources: [
      { title: 'TCS Digital NQT Syllabus & Previous Papers', url: 'https://geeksforgeeks.org', type: 'PDF Guide' },
      { title: 'Top 50 TCS Coding Questions Sheet', url: 'https://leetcode.com', type: 'Problem Set' },
      { title: 'SASTRA 2024 TCS Interview Experiences', url: 'https://geeksforgeeks.org', type: 'Experience' },
    ]
  },
  {
    id: 'zoho',
    name: 'Zoho Corporation',
    logo: 'https://logo.clearbit.com/zoho.com',
    ctc: '₹5.5 - 8.5 LPA',
    tier: 'Product-based',
    description: 'Zoho conducts a rigorous 5-round campus selection process emphasizing raw problem-solving, matrix manipulation, and LLD / System Design.',
    tags: ['Product-based', 'Dream Company', 'Core Software'],
    isSaved: true,
    rounds: [
      { id: 1, title: 'Round 1: Written C / Java Aptitude', description: 'Output prediction, pointers, recursion trace, time complexity analysis, and bitwise operations.' },
      { id: 2, title: 'Round 2: Basic Programming (5 Questions)', description: 'Matrix rotation, string formatting, number theory, pattern printing without built-in libraries.' },
      { id: 3, title: 'Round 3: Advanced Programming (Design)', description: 'Low Level Design of a mini system (e.g. Railway Reservation, Snake & Ladder, Vending Machine).' },
      { id: 4, title: 'Round 4: Technical HR', description: 'Discussion on design choices in Round 3, pointers, memory management, and project code walkthrough.' },
      { id: 5, title: 'Round 5: General HR', description: 'Culture fit, career goals, team dynamics, and compensation.' },
    ],
    pyqs: [
      { id: 'zq1', question: 'Design a Taxi Booking Application (Console LLD)', difficulty: 'Hard', topic: 'System Design', topicTags: ['System Design', 'LLD', 'OOP'], year: '2024' },
      { id: 'zq2', question: 'Print matrix in Spiral Order without extra memory', difficulty: 'Medium', topic: 'Matrix', topicTags: ['Matrix', 'Arrays'], year: '2024' },
      { id: 'zq3', question: 'Lookup substring matches with wildcard characters (* and ?)', difficulty: 'Medium', topic: 'Strings', topicTags: ['Strings', 'Recursion'], year: '2023' },
      { id: 'zq4', question: 'Evaluate Reverse Polish Notation (Stack)', difficulty: 'Medium', topic: 'Stack', topicTags: ['Stack', 'Parsing'], year: '2023' },
    ],
    resources: [
      { title: 'Zoho Round 3 LLD System Design Patterns', url: 'https://geeksforgeeks.org', type: 'Design Guide' },
      { title: 'Zoho C Output Tracking Quiz Set', url: 'https://sanfoundry.com', type: 'Quiz' },
    ]
  },
  {
    id: 'amazon',
    name: 'Amazon India',
    logo: 'https://logo.clearbit.com/amazon.in',
    ctc: '₹28.0 - 44.0 LPA',
    tier: 'Super Dream',
    description: 'Amazon visits SASTRA for SDE-1 roles, evaluating Candidates on Amazon Leadership Principles, Graphs, Dynamic Programming, and System Scalability.',
    tags: ['Super Dream', 'MAANG', 'High CTC'],
    isSaved: false,
    rounds: [
      { id: 1, title: 'Round 1: Online Assessment (OA)', description: '2 Coding Problems (Medium/Hard) + Work Simulation & Amazon Leadership Principles survey.' },
      { id: 2, title: 'Round 2: Technical Interview 1', description: 'DSA (Trees/Graphs/DP) + 20 mins Leadership Principles behavioral scenarios.' },
      { id: 3, title: 'Round 3: Technical Interview 2', description: 'Advanced DSA (Heap, Trie, Segment Tree) + System Design fundamentals.' },
      { id: 4, title: 'Round 4: Bar Raiser Interview', description: 'Deep probe into trade-offs, scalability, and strict evaluation of Leadership Principles.' },
    ],
    pyqs: [
      { id: 'aq1', question: 'Course Schedule II (Topological Sort / Kahn Algorithm)', difficulty: 'Medium', topic: 'Graphs', topicTags: ['Graphs', 'Topological Sort'], year: '2024' },
      { id: 'aq2', question: 'LRU Cache Implementation (Doubly Linked List + HashMap)', difficulty: 'Hard', topic: 'Data Structures', topicTags: ['Data Structures', 'HashMap', 'Design'], year: '2024' },
      { id: 'aq3', question: 'Word Break Problem (Dynamic Programming)', difficulty: 'Medium', topic: 'DP', topicTags: ['Dynamic Programming', 'Strings'], year: '2023' },
      { id: 'aq4', question: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', topic: 'Trees', topicTags: ['Trees', 'Design'], year: '2023' },
    ],
    resources: [
      { title: 'Amazon 16 Leadership Principles Sheet', url: 'https://amazon.jobs', type: 'Article' },
      { title: 'LeetCode Amazon High Frequency Questions', url: 'https://leetcode.com', type: 'Problem Set' },
    ]
  },
  {
    id: 'infosys',
    name: 'Infosys (Power Programmer)',
    logo: 'https://logo.clearbit.com/infosys.com',
    ctc: '₹9.5 - 13.0 LPA',
    tier: 'Digital / Specialist',
    description: 'Recruits for Specialist Programmer (SP) and Digital Specialist Engineer (DSE) through HackWithInfy and campus drives.',
    tags: ['Service-based', 'HackWithInfy', 'Specialist'],
    isSaved: true,
    rounds: [
      { id: 1, title: 'Round 1: HackWithInfy / OA', description: '3 competitive programming problems ranging from Greedy algorithms to Dynamic Programming.' },
      { id: 2, title: 'Round 2: Technical Interview', description: 'Discussion of OA problem solutions, Data Structures, DBMS indexing, and web technologies.' },
      { id: 3, title: 'Round 3: HR Interview', description: 'Document verification and career alignment discussion.' },
    ],
    pyqs: [
      { id: 'iq1', question: 'Minimum Coins to Make Change (Greedy vs DP)', difficulty: 'Medium', topic: 'DP', topicTags: ['Dynamic Programming', 'Greedy'], year: '2024' },
      { id: 'iq2', question: 'Find Connected Components in Undirected Graph', difficulty: 'Medium', topic: 'Graphs', topicTags: ['Graphs', 'DFS'], year: '2024' },
      { id: 'iq3', question: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', topic: 'Strings', topicTags: ['Strings', 'Sliding Window', 'HashMap'], year: '2023' },
    ],
    resources: [
      { title: 'Infosys SP Previous HackWithInfy Archives', url: 'https://geeksforgeeks.org', type: 'PDF Archive' },
    ]
  },
  {
    id: 'paypal',
    name: 'PayPal India',
    logo: 'https://logo.clearbit.com/paypal.com',
    ctc: '₹24.5 LPA',
    tier: 'Super Dream',
    description: 'PayPal selects top talent from SASTRA for Software Engineer roles focusing on backend performance, microservices, databases, and secure APIs.',
    tags: ['Super Dream', 'FinTech', 'Product-based'],
    isSaved: true,
    rounds: [
      { id: 1, title: 'Round 1: Online Coding Test', description: '2 DSA coding problems + SQL queries + OS & Networking MCQs.' },
      { id: 2, title: 'Round 2: Technical Interview 1', description: 'Data structures (Trees, HashMaps), Concurrency, Multithreading, and REST API design.' },
      { id: 3, title: 'Round 3: Technical Interview 2', description: 'Low level object-oriented design and deep dive into past project architectures.' },
    ],
    pyqs: [
      { id: 'pq1', question: 'Design a Rate Limiter Algorithm (Token Bucket)', difficulty: 'Medium', topic: 'System Design', topicTags: ['System Design', 'Rate Limiting'], year: '2024' },
      { id: 'pq2', question: 'Lowest Common Ancestor in Binary Tree', difficulty: 'Medium', topic: 'Trees', topicTags: ['Trees', 'Binary Tree'], year: '2024' },
      { id: 'pq3', question: 'Implement Producer-Consumer using Blocking Queue', difficulty: 'Medium', topic: 'OS / Threads', topicTags: ['OS', 'Concurrency', 'Threads'], year: '2023' },
    ],
    resources: [
      { title: 'PayPal Technical Interview Roadmap', url: 'https://paypal.com', type: 'Guide' },
    ]
  },
  {
    id: 'cognizant',
    name: 'Cognizant (GenC Next)',
    logo: 'https://logo.clearbit.com/cognizant.com',
    ctc: '₹6.75 LPA',
    tier: 'Digital',
    description: 'Cognizant GenC Next role offers digital transformation projects requiring solid knowledge in Full Stack, Cloud, and Algorithm optimization.',
    tags: ['Service-based', 'GenC Next', 'Mass Recruiter'],
    isSaved: false,
    rounds: [
      { id: 1, title: 'Round 1: Skill Based OA', description: 'Coding assessment in chosen domain (Java/Python/Fullstack) + Quantitative reasoning.' },
      { id: 2, title: 'Round 2: Technical Discussion', description: 'Project defense, SQL joins, normalization, and basic coding on pen and paper.' },
    ],
    pyqs: [
      { id: 'cq1', question: 'Check string anagrams using Hash frequency', difficulty: 'Easy', topic: 'Strings', year: '2024' },
      { id: 'cq2', question: 'SQL Query: Find duplicate records in a table', difficulty: 'Easy', topic: 'DBMS', year: '2024' },
    ],
    resources: [
      { title: 'Cognizant GenC Next Question Bank', url: 'https://geeksforgeeks.org', type: 'Question Bank' },
    ]
  },
  {
    id: 'wipro',
    name: 'Wipro (Turbo)',
    logo: 'https://logo.clearbit.com/wipro.com',
    ctc: '₹6.5 LPA',
    tier: 'Digital',
    description: 'Wipro Turbo drive focuses on digital technology candidates with aptitude, coding, and verbal assessments.',
    tags: ['Service-based', 'Mass Recruiter'],
    isSaved: false,
    rounds: [
      { id: 1, title: 'Round 1: NLTH Online Test', description: 'Aptitude, Logical, Essay Writing, and 2 Coding Questions.' },
      { id: 2, title: 'Round 2: TR & HR Interview', description: 'Technical background, basic programming, and communication check.' },
    ],
    pyqs: [
      { id: 'wq1', question: 'Reverse words in a sentence keeping spaces intact', difficulty: 'Easy', topic: 'Strings', year: '2024' },
    ],
    resources: []
  },
  {
    id: 'walmart',
    name: 'Walmart Global Tech',
    logo: 'https://logo.clearbit.com/walmart.com',
    ctc: '₹23.5 LPA',
    tier: 'Super Dream',
    description: 'Walmart recruits through CodeHers and campus drives for high-performance retail tech platforms.',
    tags: ['Super Dream', 'Product-based', 'E-Commerce'],
    isSaved: false,
    rounds: [
      { id: 1, title: 'Round 1: CodeHers OA', description: '2 DSA problems (Medium/Hard) + CS Fundamentals.' },
      { id: 2, title: 'Round 2: Technical Interview', description: 'Data structures, Graph algorithms, and Database design.' },
    ],
    pyqs: [
      { id: 'wm1', question: 'Trapping Rain Water (Two Pointers)', difficulty: 'Hard', topic: 'Arrays', year: '2024' },
    ],
    resources: []
  }
];
