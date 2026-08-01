const fs = require('fs');
const { execSync } = require('child_process');

const psScript = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = 'C:\\Users\\shaik\\Desktop\\company wise quesitons.zip'
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)

$companies = @{}
foreach ($entry in $zip.Entries) {
    if ($entry.FullName.EndsWith('5. All.csv')) {
        $parts = $entry.FullName.Split('/')
        if ($parts.Length -ge 2) {
            $companyName = $parts[$parts.Length - 2]
            $companies[$companyName] = $entry
        }
    }
}

Write-Output "TOTAL_COMPANIES: $($companies.Count)"

$sampleKey = "Accenture"
if ($companies.ContainsKey($sampleKey)) {
    $entry = $companies[$sampleKey]
    $reader = [System.IO.StreamReader]::new($entry.Open())
    $content = $reader.ReadToEnd()
    Write-Output "SAMPLE_FILE_ACCENTURE:"
    Write-Output ($content.Split("\n") | Select-Object -First 10)
}
`;

fs.writeFileSync('C:\\Users\\shaik\\.gemini\\antigravity-ide\\scratch\\placemints\\server\\prisma\\inspect.ps1', psScript);

try {
  const output = execSync('powershell -File C:\\Users\\shaik\\.gemini\\antigravity-ide\\scratch\\placemints\\server\\prisma\\inspect.ps1').toString();
  console.log(output);
} catch (e) {
  console.error('Error:', e.message);
} finally {
  if (fs.existsSync('C:\\Users\\shaik\\.gemini\\antigravity-ide\\scratch\\placemints\\server\\prisma\\inspect.ps1')) {
    fs.unlinkSync('C:\\Users\\shaik\\.gemini\\antigravity-ide\\scratch\\placemints\\server\\prisma\\inspect.ps1');
  }
}
