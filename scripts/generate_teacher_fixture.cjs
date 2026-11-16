const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const fixtureDir = path.resolve(__dirname, '../tests/fixtures');
if (!fs.existsSync(fixtureDir)) {
  fs.mkdirSync(fixtureDir, { recursive: true });
}

// 37 rows of realistic teacher data from Google Form responses
const rows = [
  {
    "Timestamp": "2026/06/10 9:15:22 AM GMT+5:30",
    "Sign In with Google Mail ID": "gayathri.p@gmail.com",
    "Teacher Name": "GAYATHRI. .P",
    "Gender": "Female",
    "Phone Number": "9840123456",
    "Qualification": "M.Sc., B.Ed.",
    "Subjects": "Tamil, English, Mathamatics, Science, Social Science",
    "Class Teacher": "class 1 - section A",
    "Password": "SecretPassword123"
  },
  {
    "Timestamp": "2026/06/10 9:18:45 AM GMT+5:30",
    "Sign In with Google Mail ID": "k.divya@school.edu",
    "Teacher Name": "K.divya",
    "Gender": "Female",
    "Phone Number": "+91 9840120002",
    "Qualification": "M.A., B.Ed.",
    "Subjects": "English, Social Science",
    "Class Teacher": "Class 9 -section C",
    "Password": "Pass@1234"
  },
  {
    "Timestamp": "2026/06/10 9:22:10 AM GMT+5:30",
    "Sign In with Google Mail ID": "s.ramesh@school.edu",
    "Teacher Name": "Dr. S. Ramesh",
    "Gender": "Male",
    "Phone Number": "9.84012E+09",
    "Qualification": "Ph.D, M.Sc.",
    "Subjects": "Physics, Chemistry",
    "Class Teacher": "class 10 - section A",
    "Password": "RameshPassword!"
  },
  {
    "Timestamp": "2026/06/10 9:25:01 AM GMT+5:30",
    "Sign In with Google Mail ID": "meena.kumari@gmail.com",
    "Teacher Name": "Meena Kumari M",
    "Gender": "Female",
    "Phone Number": "9840120004",
    "Qualification": "M.Com., M.Phil.",
    "Subjects": "Accountancy, Commerce, Economics",
    "Class Teacher": "LKG",
    "Password": "MeenaSecret2026"
  },
  {
    "Timestamp": "2026/06/10 9:28:14 AM GMT+5:30",
    "Sign In with Google Mail ID": "priya.d@gmail.com",
    "Teacher Name": "D. Priya",
    "Gender": "Female",
    "Phone Number": "9840120005",
    "Qualification": "B.Sc., B.Ed.",
    "Subjects": "Maths, Computer Science",
    "Class Teacher": "Ukg",
    "Password": "PriyaPass"
  },
  {
    "Timestamp": "2026/06/10 9:31:50 AM GMT+5:30",
    "Sign In with Google Mail ID": "accounts@school.edu",
    "Teacher Name": "V. Sundar",
    "Gender": "Male",
    "Phone Number": "9840120006",
    "Qualification": "B.Com.",
    "Subjects": "-",
    "Class Teacher": "Accounts assistant",
    "Password": "SundarAdminPass"
  },
  {
    "Timestamp": "2026/06/10 9:35:12 AM GMT+5:30",
    "Sign In with Google Mail ID": "pet.anand@school.edu",
    "Teacher Name": "M. Anand",
    "Gender": "Male",
    "Phone Number": "9840120007",
    "Qualification": "B.P.Ed, M.P.Ed",
    "Subjects": "Physical Education, PT",
    "Class Teacher": "None",
    "Password": "AnandFitness"
  }
];

// Fill rows 8 to 37 with varied realistic school staff
const firstNames = ["Anitha", "Balamurugan", "Chitra", "Deepak", "Elango", "Fatima", "Gokul", "Hemalatha", "Iniyan", "Jeyanthi", "Karthik", "Lakshmi", "Manikandan", "Nithya", "Omprakash", "Pavithra", "Raghavan", "Saravanan", "Thangam", "Usha", "Vasanth", "Yamuna", "Zeenath", "Arun", "Bhuvaneshwari", "Dinesh", "Gopinath", "Indira", "Kavitha", "Murugan"];
const subLists = [
  "Tamil",
  "English",
  "Mathematics, Science",
  "Social Science, Tamil",
  "Computer Science, CS",
  "Physics, Mathamatics",
  "Chemistry, Biology",
  "Economics, Commerce",
  "Hindi, Sanskrit",
  "Art, Craft",
  "Music, Dance",
  "Library, Reading",
  "Science, Social",
  "Maths, Statistics",
  "Biology, Botany"
];
const classTeachers = [
  "class 2 - section A", "class 2 - section B", "class 3 - section A", "class 3 - section B",
  "class 4 - section A", "class 4 - section B", "class 5 - section A", "class 5 - section B",
  "class 6 - section A", "class 6 - section B", "class 7 - section A", "class 7 - section B",
  "class 8 - section A", "class 8 - section B", "class 9 - section A", "class 9 - section B",
  "class 10 - section B", "class 11 - section A", "class 11 - section B", "class 12 - section A",
  "class 12 - section B", "-", "None", "None", "-", "class 6 - section C", "class 7 - section C",
  "class 8 - section C", "LKG", "UKG"
];

for (let i = 0; i < 30; i++) {
  const num = i + 8;
  const fn = firstNames[i % firstNames.length];
  rows.push({
    "Timestamp": `2026/06/10 9:${35 + i}:00 AM GMT+5:30`,
    "Sign In with Google Mail ID": `${fn.toLowerCase()}.${num}@school.edu`,
    "Teacher Name": `${fn} ${String.fromCharCode(65 + (i % 26))}.`,
    "Gender": i % 2 === 0 ? "Female" : "Male",
    "Phone Number": `98401200${num < 10 ? '0' + num : num}`,
    "Qualification": i % 3 === 0 ? "M.Sc., B.Ed." : i % 3 === 1 ? "M.A., B.Ed." : "M.C.A.",
    "Subjects": subLists[i % subLists.length],
    "Class Teacher": classTeachers[i % classTeachers.length],
    "Password": `UserPass_${num}#`
  });
}

console.log(`Prepared ${rows.length} rows for fixture.`);

const wb = XLSX.utils.book_new();

// Sheet 1: "Form responses 1" with 37 data rows
const ws1 = XLSX.utils.json_to_sheet(rows);
XLSX.utils.book_append_sheet(wb, ws1, "Form responses 1");

// Sheet 2: Empty "Sheet1"
const ws2 = XLSX.utils.json_to_sheet([]);
XLSX.utils.book_append_sheet(wb, ws2, "Sheet1");

const destPath = path.join(fixtureDir, 'SRT_SCHOOL__TEACHER.xlsx');
XLSX.writeFile(wb, destPath);

console.log(`Successfully generated fixture at: ${destPath}`);
