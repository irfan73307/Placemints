const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

const lucideExports = new Set([
  'Building2', 'Bookmark', 'ExternalLink', 'BookOpen', 'CheckCircle2', 'HelpCircle',
  'FileText', 'Layers', 'Sparkles', 'ArrowLeft', 'Star', 'Award', 'LayoutGrid',
  'Hash', 'GitFork', 'Code2', 'Database', 'Link2', 'Tag', 'Cpu', 'Briefcase',
  'Boxes', 'Users', 'UserCheck', 'DollarSign', 'TrendingUp', 'Wallet', 'Landmark',
  'MapPin', 'Users2', 'Shield', 'GitBranch', 'Globe', 'Lock', 'Moon', 'Sun', 'Bell',
  'ShieldCheck', 'LogOut', 'User', 'ChevronRight', 'Info', 'Edit2', 'AlertTriangle',
  'GraduationCap', 'X', 'Search', 'Filter', 'PlusCircle', 'Trash2', 'RefreshCw',
  'AlertCircle', 'Check', 'CheckCircle', 'ArrowRight', 'Eye', 'EyeOff', 'LayoutDashboard',
  'ShieldAlert', 'ChevronDown', 'Calendar', 'Clock', 'ChevronLeft', 'Share2', 'Copy',
  'Download', 'Upload', 'Menu', 'MoreHorizontal', 'MoreVertical', 'SlidersHorizontal',
  'Compass', 'Activity', 'Award', 'Zap', 'Flame', 'ThumbsUp', 'MessageSquare'
]);

function auditImports() {
  const srcDir = path.resolve(__dirname, '../src');
  const files = getAllFiles(srcDir);
  console.log(`Auditing ${files.length} frontend files for missing Lucide & Component imports...`);

  let totalIssues = 0;

  files.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(srcDir, filePath);

    // Extract all JSX tags like <Building2 or <SomeComponent
    const tagMatches = content.match(/<([A-Z][A-Za-z0-9_]*)/g) || [];
    const usedTags = new Set(tagMatches.map((t) => t.substring(1)));

    // Ignore native/standard/local components defined in this file
    usedTags.forEach((tag) => {
      // Check if tag is imported or defined
      const importRegex = new RegExp(`\\b${tag}\\b`);
      
      // Look for import or function/const definition
      const isImported =
        content.includes(`import `) &&
        (new RegExp(`import\\s+.*\\b${tag}\\b.*from`).test(content) ||
         new RegExp(`import\\s*\\{[^}]*\\b${tag}\\b[^}]*\\}\\s*from`).test(content) ||
         new RegExp(`import\\s+${tag}\\s+from`).test(content));

      const isDefined =
        new RegExp(`(?:function|class|const|let|var)\\s+${tag}\\b`).test(content);

      if (!isImported && !isDefined) {
        console.error(`❌ MISSING IMPORT in [${relativePath}]: Tag <${tag} /> is used but neither imported nor defined!`);
        totalIssues++;
      }
    });
  });

  if (totalIssues === 0) {
    console.log('🎉 ALL frontend components and icons are properly imported and defined!');
  } else {
    console.log(`⚠️ Found ${totalIssues} missing import issues!`);
  }
}

auditImports();
