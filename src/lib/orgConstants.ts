export const ORG_TYPES = [
  { id: 'company', icon: '🏢', label: 'Company / Business', desc: 'Startups, SMEs, corporates, shops' },
  { id: 'education', icon: '🎓', label: 'Educational Institution', desc: 'Schools, colleges, universities' },
  { id: 'hospital', icon: '🏥', label: 'Hospital / Healthcare', desc: 'Hospitals, clinics, labs' },
  { id: 'government', icon: '🏛', label: 'Government Body', desc: 'Ministries, departments, PSUs' },
  { id: 'ngo', icon: '🤝', label: 'NGO / Non-Profit', desc: 'Trusts, societies, social enterprises' },
  { id: 'individual', icon: '👤', label: 'Individual Business', desc: 'Freelancers, consultants' },
] as const;

export const SUBTYPES: Record<string, string[]> = {
  company: ['Startup','SME/Small Business','Private Limited','Public Limited','LLP/Partnership','MNC','Freelancer/Individual','E-Commerce','Retail','Food & Beverage','Manufacturing','Agriculture','Fashion','Media','Finance/NBFC','Real Estate','Technology/Software','Healthcare Company','Other'],
  education: ['School (Primary)','School (Secondary/Sr.Secondary)','Junior College','Engineering College','Medical College','Law College','Arts/Science/Commerce College','University','MBA/Business School','Coaching Institute','Skill Development Center','EdTech Platform','Research Institute','Other'],
  hospital: ['Government Hospital','Private Hospital','Specialty Hospital','Clinic/Polyclinic','Diagnostic Lab','Pharmacy','Dental Clinic','Mental Health Center','Nursing Home','Ayurveda/Homeopathy Center','Other'],
  government: ['Ministry (Central Govt)','Department (State Govt)','Municipal Corporation','Nagar Panchayat','Gram Panchayat','District Collectorate','Police Station/Department','Military/Defense','PSU/Undertaking','Courts/Judiciary','Other'],
  ngo: ['Registered Trust','Society/Association','Section 8 Company','Social Enterprise','Religious Organization','Other'],
  individual: ['Freelancer','Consultant','Independent Professional','Other'],
};

export const EMPLOYEE_SIZES = ['1-10','11-50','51-200','201-500','500-1000','1000-5000','5000+'];

export const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

export const NAAC_GRADES = ['A++','A+','A','B++','B+','B','C','Not Accredited'];

export const MEMBER_LABELS: Record<string, string[]> = {
  company: ['Employees','Alumni'],
  education: ['Students','Faculty','Alumni'],
  hospital: ['Doctors','Nurses','Staff'],
  government: ['Officers','Staff'],
  ngo: ['Team','Volunteers'],
  individual: ['Team'],
};

export const MEMBER_TYPE_OPTIONS: Record<string, string[]> = {
  company: ['Current Employee','Former Employee','Intern'],
  education: ['Current Student','Alumni','Faculty','Staff'],
  hospital: ['Doctor','Nurse','Staff','Intern'],
  government: ['Current Officer','Current Staff','Former'],
  ngo: ['Team Member','Volunteer','Former'],
  individual: ['Team Member'],
};

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80);
}
