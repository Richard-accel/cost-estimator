export interface Hospital {
  id: string;
  name: string;
}

export const hospitals: Hospital[] = [
  { id: "kpj-ampang", name: "KPJ Ampang Puteri Specialist Hospital" },
  { id: "kpj-damansara", name: "KPJ Damansara Specialist Hospital" },
  { id: "kpj-johor", name: "KPJ Johor Specialist Hospital" },
  { id: "kpj-klang", name: "KPJ Klang Specialist Hospital" },
  { id: "kpj-penang", name: "KPJ Penang Specialist Hospital" },
  { id: "kpj-perdana", name: "KPJ Perdana Specialist Hospital" },
  { id: "kpj-rawang", name: "KPJ Rawang Specialist Hospital" },
  { id: "kpj-selangor", name: "KPJ Selangor Specialist Hospital" },
  { id: "kpj-seremban", name: "KPJ Seremban Specialist Hospital" },
  { id: "kpj-sentosa", name: "KPJ Sentosa KL Specialist Hospital" },
  { id: "kpj-tawakkal", name: "KPJ Tawakkal Specialist Hospital" },
  { id: "kpj-ipoh", name: "KPJ Ipoh Specialist Hospital" },
  { id: "kpj-kuching", name: "KPJ Kuching Specialist Hospital" },
  { id: "kpj-sabah", name: "KPJ Sabah Specialist Hospital" },
  { id: "kpj-pahang", name: "KPJ Pahang Specialist Hospital" },
];

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospitalId: string;
}

export const doctors: Doctor[] = [
  { id: "d1", name: "Dr. Ahmad Razali", specialty: "Orthopaedic Surgery", hospitalId: "kpj-ampang" },
  { id: "d2", name: "Dr. Lim Wei Shan", specialty: "Orthopaedic Surgery", hospitalId: "kpj-ampang" },
  { id: "d3", name: "Dr. Siti Nurhaliza", specialty: "General Surgery", hospitalId: "kpj-ampang" },
  { id: "d4", name: "Dr. Rajesh Kumar", specialty: "Cardiology", hospitalId: "kpj-damansara" },
  { id: "d5", name: "Dr. Tan Mei Ling", specialty: "General Surgery", hospitalId: "kpj-damansara" },
  { id: "d6", name: "Dr. Mohamed Faiz", specialty: "Orthopaedic Surgery", hospitalId: "kpj-damansara" },
  { id: "d7", name: "Dr. Wong Chee Keong", specialty: "Cardiology", hospitalId: "kpj-johor" },
  { id: "d8", name: "Dr. Aisha Binti Yusof", specialty: "Obstetrics & Gynaecology", hospitalId: "kpj-johor" },
  { id: "d9", name: "Dr. Hariharan Nair", specialty: "ENT Surgery", hospitalId: "kpj-penang" },
  { id: "d10", name: "Dr. Chong Siew Peng", specialty: "General Surgery", hospitalId: "kpj-penang" },
  { id: "d11", name: "Dr. Nurul Izzah", specialty: "Obstetrics & Gynaecology", hospitalId: "kpj-selangor" },
  { id: "d12", name: "Dr. Vikram Singh", specialty: "Urology", hospitalId: "kpj-selangor" },
  { id: "d13", name: "Dr. Lee Pei Yee", specialty: "Ophthalmology", hospitalId: "kpj-sentosa" },
  { id: "d14", name: "Dr. Azman Shah", specialty: "Cardiology", hospitalId: "kpj-sentosa" },
  { id: "d15", name: "Dr. Priya Menon", specialty: "Dermatology", hospitalId: "kpj-ipoh" },
];

export const specialties = [
  "Cardiology",
  "Dermatology",
  "ENT Surgery",
  "General Surgery",
  "Obstetrics & Gynaecology",
  "Ophthalmology",
  "Orthopaedic Surgery",
  "Urology",
];

export interface Procedure {
  code: string;
  name: string;
  category: string;
}

export const procedures: Procedure[] = [
  { code: "PR001", name: "Total Knee Replacement (TKR)", category: "Orthopaedic" },
  { code: "PR002", name: "Total Hip Replacement (THR)", category: "Orthopaedic" },
  { code: "PR003", name: "Arthroscopic Knee Surgery", category: "Orthopaedic" },
  { code: "PR004", name: "Coronary Artery Bypass Graft (CABG)", category: "Cardiology" },
  { code: "PR005", name: "Percutaneous Coronary Intervention (PCI)", category: "Cardiology" },
  { code: "PR006", name: "Appendectomy", category: "General Surgery" },
  { code: "PR007", name: "Cholecystectomy (Laparoscopic)", category: "General Surgery" },
  { code: "PR008", name: "Hernia Repair (Inguinal)", category: "General Surgery" },
  { code: "PR009", name: "Caesarean Section (LSCS)", category: "Obstetrics" },
  { code: "PR010", name: "Normal Vaginal Delivery", category: "Obstetrics" },
  { code: "PR011", name: "Hysterectomy", category: "Obstetrics" },
  { code: "PR012", name: "Cataract Surgery (Phacoemulsification)", category: "Ophthalmology" },
  { code: "PR013", name: "Tonsillectomy", category: "ENT" },
  { code: "PR014", name: "Septoplasty", category: "ENT" },
  { code: "PR015", name: "Transurethral Resection of Prostate (TURP)", category: "Urology" },
  { code: "PR016", name: "Lithotripsy (ESWL)", category: "Urology" },
  { code: "PR017", name: "Mastectomy", category: "General Surgery" },
  { code: "PR018", name: "Thyroidectomy", category: "General Surgery" },
  { code: "PR019", name: "Spinal Fusion Surgery", category: "Orthopaedic" },
  { code: "PR020", name: "ACL Reconstruction", category: "Orthopaedic" },
  { code: "PR021", name: "Setting of Branula", category: "General" },
  { code: "PR022", name: "Blood Transfusion", category: "General" },
  { code: "PR023", name: "ECG Monitoring", category: "Cardiology" },
  { code: "PR024", name: "Physiotherapy Session", category: "Rehabilitation" },
  { code: "PR025", name: "Colonoscopy", category: "Gastroenterology" },
  { code: "PR026", name: "Endoscopy (Upper GI)", category: "Gastroenterology" },
  { code: "PR027", name: "Skin Biopsy", category: "Dermatology" },
  { code: "PR028", name: "Excision of Lesion", category: "General Surgery" },
  { code: "PR029", name: "Angioplasty", category: "Cardiology" },
  { code: "PR030", name: "Pacemaker Implantation", category: "Cardiology" },
];

export interface ProcedureRecommendation {
  procedureCode: string;
  probability: number;
  reason: string;
}

export const procedureRecommendations: Record<string, ProcedureRecommendation[]> = {
  "PR001": [
    { procedureCode: "PR021", probability: 0.88, reason: "88% of TKR episodes also include Setting of Branula" },
    { procedureCode: "PR024", probability: 0.75, reason: "75% of TKR episodes include Physiotherapy Session" },
  ],
  "PR004": [
    { procedureCode: "PR023", probability: 0.95, reason: "95% of CABG episodes include ECG Monitoring" },
    { procedureCode: "PR022", probability: 0.60, reason: "60% of CABG episodes include Blood Transfusion" },
  ],
  "PR007": [
    { procedureCode: "PR021", probability: 0.82, reason: "82% of Cholecystectomy episodes include Setting of Branula" },
  ],
  "PR009": [
    { procedureCode: "PR022", probability: 0.45, reason: "45% of LSCS episodes include Blood Transfusion" },
    { procedureCode: "PR021", probability: 0.92, reason: "92% of LSCS episodes include Setting of Branula" },
  ],
  "PR012": [
    { procedureCode: "PR023", probability: 0.30, reason: "30% of Cataract surgeries include ECG Monitoring" },
  ],
};

export const episodeTypes = ["Inpatient", "Outpatient", "Day Surgery"] as const;
export type EpisodeType = typeof episodeTypes[number];

export const wardTypes = ["Single Room", "Twin Sharing", "4-Bedded Ward", "6-Bedded Ward", "Suite", "ICU"];

export const payorTypes = ["Self", "Insurance", "Corporate", "Others"] as const;

export const diagnosisCodes = [
  { code: "M17.1", description: "Primary osteoarthritis, knee" },
  { code: "M16.1", description: "Primary osteoarthritis, hip" },
  { code: "I25.1", description: "Atherosclerotic heart disease" },
  { code: "K80.2", description: "Gallbladder calculus without cholecystitis" },
  { code: "K35.8", description: "Acute appendicitis" },
  { code: "O82", description: "Encounter for caesarean delivery" },
  { code: "H25.1", description: "Age-related nuclear cataract" },
  { code: "J35.1", description: "Hypertrophy of tonsils" },
  { code: "N40.1", description: "Benign prostatic hyperplasia" },
  { code: "K40.9", description: "Inguinal hernia without obstruction" },
  { code: "C50.9", description: "Malignant neoplasm of breast" },
  { code: "E04.2", description: "Nontoxic multinodular goiter" },
];
