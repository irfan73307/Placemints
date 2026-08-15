const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const coreCompanies = [
  {
    id: 'microchip',
    slug: 'microchip',
    name: 'Microchip',
    ctc: '10 LPA + 5 Lakh RSUs',
    avgCtc: 10.0,
    tier: 'Core / Premium',
    sector: 'Semiconductors & Embedded',
    description: 'Microchip Technology campus recruitment for embedded software and hardware design. CGPA Cutoff: 7.5. Eligible Depts: All SEEE & Core engineering branches.',
    tags: 'Core,Semiconductors,CGPA: 7.5,Embedded,RSUs'
  },
  {
    id: 'caterpillar',
    slug: 'caterpillar',
    name: 'Caterpillar',
    ctc: '14.56 LPA (UG)',
    avgCtc: 14.56,
    tier: 'Super Dream / Core',
    sector: 'Heavy Machinery & Systems',
    description: 'Caterpillar UG campus recruitment drive. CGPA Cutoff: 7.5. Eligible Depts: Mechanical, EEE, ECE and allied core branches.',
    tags: 'Core,Super Dream,CGPA: 7.5,Heavy Machinery,UG'
  },
  {
    id: 'collins-aerospace',
    slug: 'collins-aerospace',
    name: 'Collins Aerospace',
    ctc: '8 LPA',
    avgCtc: 8.0,
    tier: 'Dream / Core',
    sector: 'Aerospace & Avionics',
    description: 'Collins Aerospace campus recruitment for avionics and flight control systems. Eligible Depts: All Engineering branches.',
    tags: 'Core,Aerospace,Avionics,All Branches'
  },
  {
    id: 'e-con-systems',
    slug: 'e-con-systems',
    name: 'E-Con Systems',
    ctc: '8 LPA / 5 LPA',
    avgCtc: 6.5,
    tier: 'Core Product',
    sector: 'Embedded Vision & IoT',
    description: 'E-Con Systems embedded vision & camera solutions recruitment. CGPA Cutoff: 7.5. Eligible Depts: EEE, ECE, EIE & CSE.',
    tags: 'Core,Embedded,CGPA: 7.5,EEE,ECE,EIE,CSE'
  },
  {
    id: 'ashok-leyland',
    slug: 'ashok-leyland',
    name: 'Ashok Leyland',
    ctc: '7.5 LPA (after training); 5 LPA (GET period)',
    avgCtc: 6.25,
    tier: 'Core Automotive',
    sector: 'Automobile & Commercial Vehicles',
    description: 'Ashok Leyland Graduate Engineer Trainee (GET) recruitment. CGPA Cutoff: 7.0. Eligible Depts: Mechanical, Mechanical (Digital Manufacturing), Mechatronics, and All B.Tech branches from SEEE.',
    tags: 'Core,Automotive,CGPA: 7.0,Mech,SEEE'
  },
  {
    id: 'syrma-sgs',
    slug: 'syrma-sgs',
    name: 'Syrma SGS',
    ctc: '6 LPA (GET); 20k/month stipend',
    avgCtc: 6.0,
    tier: 'Core Electronics',
    sector: 'Electronics Manufacturing Services (EMS)',
    description: 'Syrma SGS GET & intern recruitment. CGPA Cutoff: 8.0. Eligible Depts: ECE / EEE / E&I / Mechatronics / Mechanical / Mechanical (DM) / IT / CSE.',
    tags: 'Core,Electronics,CGPA: 8.0,GET'
  },
  {
    id: 'american-megatrends',
    slug: 'american-megatrends',
    name: 'American Megatrends (AMI)',
    ctc: '6 LPA',
    avgCtc: 6.0,
    tier: 'Core Firmware',
    sector: 'BIOS & Firmware Engineering',
    description: 'American Megatrends (AMI) campus recruitment for UEFI, BIOS, and core systems. Eligible Depts: All branches.',
    tags: 'Core,Firmware,BIOS,Systems'
  },
  {
    id: 'coreel-technologies',
    slug: 'coreel-technologies',
    name: 'CoreEL Technologies',
    ctc: '5.22 LPA',
    avgCtc: 5.22,
    tier: 'Core Defense',
    sector: 'Defense Electronics & VLSI',
    description: 'CoreEL Technologies recruitment for digital signal processing and FPGA design. CGPA Cutoff: 7.0. Eligible Depts: School of Electrical & Electronics Engineering (SEEE).',
    tags: 'Core,VLSI,Defense,CGPA: 7.0,SEEE'
  },
  {
    id: 'aethrone-aerospace',
    slug: 'aethrone-aerospace',
    name: 'Aethrone Aerospace',
    ctc: '3 LPA – 7 LPA',
    avgCtc: 5.0,
    tier: 'Core Aerospace',
    sector: 'Aerospace & UAV Technologies',
    description: 'Aethrone Aerospace recruitment drive for drone systems and flight dynamics. Eligible Depts: All Engineering branches.',
    tags: 'Core,Aerospace,Drones,UAV'
  },
  {
    id: 'brakes-india',
    slug: 'brakes-india',
    name: 'Brakes India',
    ctc: '3.79 LPA; 15k/month stipend',
    avgCtc: 3.79,
    tier: 'Core Automotive',
    sector: 'Braking Systems & Automotive Parts',
    description: 'Brakes India recruitment for automotive design and manufacturing. CGPA Cutoff: 7.5. Eligible Depts: SEEE and Mechanical Engineering.',
    tags: 'Core,Automotive,CGPA: 7.5,SEEE,Mech'
  },
  {
    id: 'versa-drive',
    slug: 'versa-drive',
    name: 'Versa Drive',
    ctc: 'Min 3 LPA (performance-based)',
    avgCtc: 3.5,
    tier: 'Core Drives',
    sector: 'Power Electronics & Motor Controllers',
    description: 'Versa Drive recruitment for BLDC motor controllers & energy-efficient drive systems. Eligible Depts: All Engineering branches.',
    tags: 'Core,Power Electronics,BLDC Motors'
  },
  {
    id: 'delta-electronics',
    slug: 'delta-electronics',
    name: 'Delta Electronics',
    ctc: '6 LPA',
    avgCtc: 6.0,
    tier: 'Core Automation',
    sector: 'Power Management & Industrial Automation',
    description: 'Delta Electronics industrial automation recruitment. CGPA Cutoff: 6.0. Eligible Depts: EEE, ECE, EIE, AI & Robotics, Mech, Mech (Dig.Mfg), Mechatronics.',
    tags: 'Core,Automation,Power,CGPA: 6.0,EEE,ECE,Mech'
  },
  {
    id: 'data-patterns',
    slug: 'data-patterns',
    name: 'Data Patterns',
    ctc: '4.2 LPA',
    avgCtc: 4.2,
    tier: 'Core Defense',
    sector: 'Defense & Aerospace Electronics',
    description: 'Data Patterns India campus recruitment. CGPA Cutoff: 6.5. Eligible Depts: School of Electrical & Electronics Engineering (SEEE).',
    tags: 'Core,Defense,CGPA: 6.5,SEEE'
  },
  {
    id: 'tata-power',
    slug: 'tata-power',
    name: 'Tata Power',
    ctc: 'Not specified',
    avgCtc: 6.0,
    tier: 'Core Energy',
    sector: 'Energy & Power Utilities',
    description: 'Tata Power campus drive for electrical power grid and renewable generation engineering. Eligible Depts: EEE.',
    tags: 'Core,Power,Utilities,EEE'
  },
  {
    id: 'tata-steel',
    slug: 'tata-steel',
    name: 'Tata Steel',
    ctc: 'Not specified',
    avgCtc: 7.0,
    tier: 'Core Heavy Industry',
    sector: 'Steel & Metallurgy',
    description: 'Tata Steel campus recruitment for electrical and automation engineers. Eligible Depts: SEEE.',
    tags: 'Core,Steel,Heavy Industry,SEEE'
  },
  {
    id: 'jsw-group',
    slug: 'jsw-group',
    name: 'JSW Group',
    ctc: '8 LPA',
    avgCtc: 8.0,
    tier: 'Dream / Core',
    sector: 'Infrastructure & Materials',
    description: 'JSW Group campus recruitment. CGPA Cutoff: 7.0. Eligible Depts: EEE, EIE.',
    tags: 'Core,Infrastructure,CGPA: 7.0,EEE,EIE'
  },
  {
    id: 'hyundai',
    slug: 'hyundai',
    name: 'Hyundai Motor India',
    ctc: '8 LPA',
    avgCtc: 8.0,
    tier: 'Dream / Core',
    sector: 'Automobile Manufacturing',
    description: 'Hyundai Motor India campus recruitment for vehicle power systems. CGPA Cutoff: 7.0. Eligible Depts: EEE.',
    tags: 'Core,Automotive,CGPA: 7.0,EEE'
  },
  {
    id: 'quest-global',
    slug: 'quest-global',
    name: 'Quest Global',
    ctc: '5.5 LPA (EIE) / 4.5 LPA (MECH)',
    avgCtc: 5.0,
    tier: 'Core Engineering Services',
    sector: 'Engineering R&D Services',
    description: 'Quest Global engineering R&D services recruitment. CGPA Cutoff: 6.0. Eligible Depts: EIE, EEE, Mechanical.',
    tags: 'Core,R&D Services,CGPA: 6.0,EIE,EEE,Mech'
  },
  {
    id: 'visteon',
    slug: 'visteon',
    name: 'Visteon Corporation',
    ctc: '7 LPA',
    avgCtc: 7.0,
    tier: 'Core Electronics',
    sector: 'Cockpit Electronics & Connected Vehicles',
    description: 'Visteon automotive cockpit electronics & cluster software recruitment. CGPA Cutoff: 7.0. Eligible Depts: School of Electrical Engineering (SEE).',
    tags: 'Core,Cockpit Electronics,CGPA: 7.0,SEE'
  },
  {
    id: 'spectra-medicals',
    slug: 'spectra-medicals',
    name: 'Spectra Medicals',
    ctc: '3.5 LPA',
    avgCtc: 3.5,
    tier: 'Core MedTech',
    sector: 'Medical Devices & Healthcare Instrumentation',
    description: 'Spectra Medicals medical instrumentation recruitment. CGPA Cutoff: 6.0. Eligible Depts: SEEE.',
    tags: 'Core,MedTech,CGPA: 6.0,SEEE'
  },
  {
    id: 'tata-technologies',
    slug: 'tata-technologies',
    name: 'Tata Technologies',
    ctc: '4.5 LPA',
    avgCtc: 4.5,
    tier: 'Core Product Engineering',
    sector: 'Automotive & Product Engineering Services',
    description: 'Tata Technologies product engineering services drive. Eligible Depts: SEEE.',
    tags: 'Core,Product Engineering,SEEE'
  },
  {
    id: 'ge-vernova',
    slug: 'ge-vernova',
    name: 'GE Vernova',
    ctc: '6 LPA',
    avgCtc: 6.0,
    tier: 'Core Energy',
    sector: 'Electrification & Energy Transitions',
    description: 'GE Vernova electrification & grid solutions recruitment. CGPA Cutoff: 7.0. Eligible Depts: EEE.',
    tags: 'Core,Energy,Grid,CGPA: 7.0,EEE'
  },
  {
    id: 'schneider',
    slug: 'schneider',
    name: 'Schneider Electric',
    ctc: '12 LPA',
    avgCtc: 12.0,
    tier: 'Super Dream / Core',
    sector: 'Energy Management & Automation',
    description: 'Schneider Electric GET & software engineer drive. CGPA Cutoff: 7.0. Eligible Depts: SEEE.',
    tags: 'Core,Super Dream,Automation,CGPA: 7.0,SEEE'
  },
  {
    id: 'elgi',
    slug: 'elgi',
    name: 'Elgi Equipments',
    ctc: '8.5 LPA',
    avgCtc: 8.5,
    tier: 'Core Manufacturing',
    sector: 'Compressors & Industrial Solutions',
    description: 'Elgi Equipments GET campus recruitment. CGPA Cutoff: 7.0. Eligible Depts: Mechanical, EEE, ECE.',
    tags: 'Core,Machinery,CGPA: 7.0,Mech,EEE,ECE'
  },
  {
    id: 'l-and-t',
    slug: 'l-and-t',
    name: 'L&T (Larsen & Toubro)',
    ctc: '6 LPA',
    avgCtc: 6.0,
    tier: 'Core Infrastructure',
    sector: 'Engineering & Heavy Construction',
    description: 'L&T Graduate Engineer Trainee (GET) campus recruitment. CGPA Cutoff: 6.0. Eligible Depts: SEEE.',
    tags: 'Core,Infrastructure,CGPA: 6.0,SEEE'
  },
  {
    id: 'digital-connxion',
    slug: 'digital-connxion',
    name: 'Digital Connxion',
    ctc: '10 LPA',
    avgCtc: 10.0,
    tier: 'Core Infrastructure',
    sector: 'Data Center Infrastructure & Networks',
    description: 'Digital Connxion data center infrastructure engineering. CGPA Cutoff: 6.5. Eligible Depts: EEE.',
    tags: 'Core,Data Centers,CGPA: 6.5,EEE'
  },
  {
    id: 'ace-micomatic',
    slug: 'ace-micomatic',
    name: 'Ace Micromatic',
    ctc: '6.5 LPA',
    avgCtc: 6.5,
    tier: 'Core Manufacturing',
    sector: 'CNC Machine Tools & Automation',
    description: 'Ace Micromatic Group CNC machine tools recruitment. CGPA Cutoff: 8.0. Eligible Depts: All Core engineering.',
    tags: 'Core,CNC,CGPA: 8.0,Manufacturing'
  },
  {
    id: 'rane',
    slug: 'rane',
    name: 'Rane Group',
    ctc: '4 LPA',
    avgCtc: 4.0,
    tier: 'Core Automotive',
    sector: 'Automotive Steering & Friction Tech',
    description: 'Rane Group campus recruitment. CGPA Cutoff: 6.0. Eligible Depts: Mechanical, Mechanical Digital Manufacturing, Mechatronics and Electrical. Seats: 11 (3 reserved for EE).',
    tags: 'Core,Automotive,CGPA: 6.0,Seats: 11,Mech,EE'
  },
  {
    id: 'silicon-labs',
    slug: 'silicon-labs',
    name: 'Silicon Labs',
    ctc: '50k / month (Internship)',
    avgCtc: 6.0,
    tier: 'Core Semiconductor',
    sector: 'Wireless Semiconductors & IoT',
    description: 'Silicon Labs internship drive for wireless SOCs and IoT microcontrollers. CGPA Cutoff: 7.5. Eligible Depts: SEEE and SOC (School of Computing).',
    tags: 'Core,Internship,CGPA: 7.5,Semiconductor,SEEE,SOC'
  },
  {
    id: 'turbo-energy',
    slug: 'turbo-energy',
    name: 'Turbo Energy',
    ctc: '3.69 LPA',
    avgCtc: 3.69,
    tier: 'Core Automotive',
    sector: 'Turbochargers & Engine Components',
    description: 'Turbo Energy campus recruitment. CGPA Cutoff: 7.0. Eligible Depts: Mechanical, Mechanical (DM), Mechatronics, ECE, ECE(CPS), EEE & EEE(SGEV).',
    tags: 'Core,Automotive,CGPA: 7.0,Mech,ECE,EEE'
  },
  {
    id: 'hcl-tech',
    slug: 'hcl-tech',
    name: 'HCL Tech',
    ctc: '4.5 LPA',
    avgCtc: 4.5,
    tier: 'Core / IT Services',
    sector: 'IT Services & Embedded Systems',
    description: 'HCL Tech embedded systems and software drive. CGPA Cutoff: 7.0. Eligible Depts: SEEE.',
    tags: 'Core,IT Services,CGPA: 7.0,SEEE'
  },
  {
    id: 'astrome',
    slug: 'astrome',
    name: 'Astrome Technologies',
    ctc: '10 LPA',
    avgCtc: 10.0,
    tier: 'Core Telecom',
    sector: 'Wireless Telecom & SpaceTech',
    description: 'Astrome Technologies mmWave satellite communication recruitment. CGPA Cutoff: 7.0. Eligible Depts: SEEE.',
    tags: 'Core,Telecom,SpaceTech,CGPA: 7.0,SEEE'
  },
  {
    id: 'pioneer-wincon',
    slug: 'pioneer-wincon',
    name: 'Pioneer Wincon',
    ctc: '4 to 5 LPA',
    avgCtc: 4.5,
    tier: 'Core Renewable',
    sector: 'Wind Energy Generators',
    description: 'Pioneer Wincon wind energy equipment drive. Eligible Depts: All branches.',
    tags: 'Core,Wind Energy,Renewable,All Branches'
  },
  {
    id: 'proleed',
    slug: 'proleed',
    name: 'Proleed',
    ctc: '3 LPA',
    avgCtc: 3.0,
    tier: 'Core Electrical',
    sector: 'Electrical Controls & Drives',
    description: 'Proleed electrical controls drive. CGPA Cutoff: 6.5. Eligible Depts: EEE, ECE, SGEV.',
    tags: 'Core,Electrical,CGPA: 6.5,EEE,ECE,SGEV'
  },
  {
    id: 'hl-mando',
    slug: 'hl-mando',
    name: 'HL Mando',
    ctc: '5 LPA',
    avgCtc: 5.0,
    tier: 'Core Automotive',
    sector: 'Smart Mobility & Brake Systems',
    description: 'HL Mando vehicle safety systems drive. CGPA Cutoff: 7.0. Eligible Depts: Mechanical / Mechanical(DM) / Electrical / Electronics / Mechatronics.',
    tags: 'Core,Automotive,CGPA: 7.0,Mech,Electrical'
  },
  {
    id: 'amway',
    slug: 'amway',
    name: 'Amway India',
    ctc: '4.65 LPA',
    avgCtc: 4.65,
    tier: 'Core Operations',
    sector: 'Chemical & Plant Operations',
    description: 'Amway India plant operations drive. CGPA Cutoff: 8.0. Eligible Depts: Mech, Chem, EEE. Seats Available: 3.',
    tags: 'Core,Operations,CGPA: 8.0,Seats: 3,Mech,Chem,EEE'
  },
  {
    id: 'dalmia-cements',
    slug: 'dalmia-cements',
    name: 'Dalmia Cements',
    ctc: '5 LPA',
    avgCtc: 5.0,
    tier: 'Core Heavy Industry',
    sector: 'Building Materials & Heavy Industry',
    description: 'Dalmia Cements plant maintenance and electrical systems drive. CGPA Cutoff: 6.0. Eligible Depts: Mechanical, Mechanical DM, EEE, EIE, ECE, Chemical. Seats Available: 2.',
    tags: 'Core,Heavy Industry,CGPA: 6.0,Seats: 2,Mech,EEE,ECE'
  },
  {
    id: 'rosenberg',
    slug: 'rosenberg',
    name: 'Rosenberg',
    ctc: '4 LPA',
    avgCtc: 4.0,
    tier: 'Core HVAC',
    sector: 'Industrial Ventilation & Air Movement',
    description: 'Rosenberg industrial fan systems recruitment. CGPA Cutoff: 6.0. Eligible Depts: SEEE and Mech.',
    tags: 'Core,HVAC,CGPA: 6.0,SEEE,Mech'
  },
  {
    id: 'bosch-global-software',
    slug: 'bosch-global-software',
    name: 'Bosch Global Software (BGST)',
    ctc: '30K pm (Internship)',
    avgCtc: 5.5,
    tier: 'Core Mobility Software',
    sector: 'Automotive Software & Smart Mobility',
    description: 'Bosch Global Software Technologies (BGST) internship & full-time drive. CGPA Cutoff: 7.0. Eligible Depts: Circuit Branches and Mech.',
    tags: 'Core,Automotive Software,CGPA: 7.0,Circuit,Mech'
  },
  {
    id: 'kcp-ltd',
    slug: 'kcp-ltd',
    name: 'KCP Ltd',
    ctc: '18k pm (Stipend)',
    avgCtc: 3.2,
    tier: 'Core Heavy Engineering',
    sector: 'Heavy Industrial Machinery',
    description: 'KCP Ltd industrial machinery drive. CGPA Cutoff: 6.0. Eligible Depts: EIE Males.',
    tags: 'Core,Heavy Engineering,CGPA: 6.0,EIE'
  },
  {
    id: 'sv-tech',
    slug: 'sv-tech',
    name: 'SV Tech',
    ctc: '5 LPA',
    avgCtc: 5.0,
    tier: 'Core RTL Design',
    sector: 'VLSI & Digital Logic Design',
    description: 'SV Tech RTL design and digital verification drive. CGPA Cutoff: 8.0. Eligible Depts: SEEE (RTL oriented).',
    tags: 'Core,VLSI,RTL,CGPA: 8.0,SEEE'
  },
  {
    id: 'ip-rings',
    slug: 'ip-rings',
    name: 'IP Rings',
    ctc: '3.5 - 4.5 LPA',
    avgCtc: 4.0,
    tier: 'Core Automotive',
    sector: 'Automotive Components & Engine Metallurgy',
    description: 'IP Rings engine component manufacturing recruitment. CGPA Cutoff: 6.0. Eligible Depts: Mechanical, Mechanical DM, Mechatronics and All branches from School of EEE.',
    tags: 'Core,Automotive,CGPA: 6.0,Mech,SEEE'
  },
  {
    id: 'ascent-circuits',
    slug: 'ascent-circuits',
    name: 'Ascent Circuits',
    ctc: '5 LPA',
    avgCtc: 5.0,
    tier: 'Core PCB Tech',
    sector: 'PCB Manufacturing & Hardware Assembly',
    description: 'Ascent Circuits PCB fabrication recruitment. CGPA Cutoff: 7.0. Eligible Depts: Mechanical (only males), ECE, EEE, Chemical Engineering.',
    tags: 'Core,PCB Tech,CGPA: 7.0,ECE,EEE,Mech'
  },
  {
    id: 'jean-mueller',
    slug: 'jean-mueller',
    name: 'Jean Mueller',
    ctc: '5.8 LPA',
    avgCtc: 5.8,
    tier: 'Core Switchgear',
    sector: 'Fusegear & Electrical Safety Systems',
    description: 'Jean Mueller electrical distribution and protection systems. CGPA Cutoff: 8.0. Eligible Depts: EEE & SGEV.',
    tags: 'Core,Electrical Protection,CGPA: 8.0,EEE,SGEV'
  },
  {
    id: 'bpl-medical-tech',
    slug: 'bpl-medical-tech',
    name: 'BPL Medical Tech',
    ctc: '4 LPA',
    avgCtc: 4.0,
    tier: 'Core MedTech',
    sector: 'Medical Devices & Healthcare Systems',
    description: 'BPL Medical Technologies healthcare equipment drive. CGPA Cutoff: 6.5. Eligible Depts: EEE, ECE.',
    tags: 'Core,MedTech,CGPA: 6.5,EEE,ECE'
  }
];

async function main() {
  console.log(`🚀 Ingesting ${coreCompanies.length} CORE placement list companies...`);

  let addedCount = 0;
  for (const comp of coreCompanies) {
    await prisma.company.upsert({
      where: { id: comp.id },
      update: comp,
      create: comp,
    });
    addedCount++;
    console.log(`✅ [${addedCount}/${coreCompanies.length}] Upserted: ${comp.name}`);
  }

  const total = await prisma.company.count();
  console.log(`\n🎉 Success! Total companies in database now: ${total}`);
}

main()
  .catch((e) => {
    console.error('❌ Ingestion Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
