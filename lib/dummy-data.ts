// Company and Factory Data
export const companyData = {
  name: "Premier Footwear Manufacturing Ltd",
  totalRevenue: 2450000,
  totalItemsProduced: 15420,
  totalDefects: 892,
  qualityScore: 94.2,
  totalProfit: 485000,
  monthlyGrowth: 12.5,
}

export const factories = [
  {
    id: "factory-1",
    name: "Main Production Unit - Mumbai",
    location: "Mumbai",
    capacity: 1000,
    currentProduction: 850,
    efficiency: 92.5,
    qualityScore: 95.2,
    employeeCount: 120,
    monthlyRevenue: 850000,
    status: "Active",
  },
  {
    id: "factory-2",
    name: "Secondary Unit - Bangalore",
    location: "Bangalore",
    capacity: 800,
    currentProduction: 720,
    efficiency: 90.0,
    qualityScore: 93.8,
    employeeCount: 95,
    monthlyRevenue: 720000,
    status: "Active",
  },
  {
    id: "factory-3",
    name: "Export Unit - Chennai",
    location: "Chennai",
    capacity: 1200,
    currentProduction: 1100,
    efficiency: 91.7,
    qualityScore: 94.5,
    employeeCount: 140,
    monthlyRevenue: 980000,
    status: "Active",
  },
]

// Article Base Data
export const articleBases = [
  { id: "ART001", name: "Classic Oxford", category: "Formal", basePrice: 45.0 },
  { id: "ART002", name: "Sports Sneaker", category: "Athletic", basePrice: 35.0 },
  { id: "ART003", name: "Casual Boot", category: "Casual", basePrice: 55.0 },
  { id: "ART004", name: "Running Shoe", category: "Athletic", basePrice: 40.0 },
  { id: "ART005", name: "Dress Pump", category: "Formal", basePrice: 50.0 },
]

// Colors, Sizes, etc.
export const colors = [
  { id: "black", name: "Black", hex: "#000000" },
  { id: "brown", name: "Brown", hex: "#8B4513" },
  { id: "white", name: "White", hex: "#FFFFFF" },
  { id: "tan", name: "Tan", hex: "#D2B48C" },
  { id: "navy", name: "Navy", hex: "#000080" },
  { id: "red", name: "Red", hex: "#DC143C" },
  { id: "gray", name: "Gray", hex: "#808080" },
]

export const sizes = ["5", "6", "7", "8", "9", "10", "11", "12"]
export const genders = [
  { id: "male", name: "Male" },
  { id: "female", name: "Female" },
  { id: "unisex", name: "Unisex" },
  { id: "kids", name: "Kids" },
]
export const sides = [
  { id: "left", name: "Left" },
  { id: "right", name: "Right" },
  { id: "both", name: "Both" },
]

// Article Variants (combination of base + attributes)
export const articleVariants = [
  {
    id: "AV001",
    articleNumber: "ART001",
    articleName: "Classic Oxford",
    size: "9",
    color: "black",
    colorName: "Black",
    gender: "male",
    genderName: "Male",
    side: "both",
    sideName: "Both",
    fullName: "ART001 - Black - 9 - Male - Both",
    displayName: "Classic Oxford - Black - 9 - Male - Both",
    materials: ["Upper Leather", "Insole", "Outsole", "Lace"],
    stages: ["Cutting", "Stitching", "Lasting", "Sole Attachment", "Finishing"],
    price: 45.0,
  },
  {
    id: "AV002",
    articleNumber: "ART001",
    articleName: "Classic Oxford",
    size: "10",
    color: "brown",
    colorName: "Brown",
    gender: "male",
    genderName: "Male",
    side: "both",
    sideName: "Both",
    fullName: "ART001 - Brown - 10 - Male - Both",
    displayName: "Classic Oxford - Brown - 10 - Male - Both",
    materials: ["Upper Leather", "Insole", "Outsole", "Lace"],
    stages: ["Cutting", "Stitching", "Lasting", "Sole Attachment", "Finishing"],
    price: 45.0,
  },
  {
    id: "AV003",
    articleNumber: "ART002",
    articleName: "Sports Sneaker",
    size: "8",
    color: "white",
    colorName: "White",
    gender: "unisex",
    genderName: "Unisex",
    side: "both",
    sideName: "Both",
    fullName: "ART002 - White - 8 - Unisex - Both",
    displayName: "Sports Sneaker - White - 8 - Unisex - Both",
    materials: ["Synthetic Upper", "Foam Insole", "Rubber Outsole", "Lace"],
    stages: ["Cutting", "Stitching", "Sole Attachment", "Quality Check"],
    price: 35.0,
  },
  {
    id: "AV004",
    articleNumber: "ART003",
    articleName: "Casual Boot",
    size: "9",
    color: "brown",
    colorName: "Brown",
    gender: "female",
    genderName: "Female",
    side: "left",
    sideName: "Left",
    fullName: "ART003 - Brown - 9 - Female - Left",
    displayName: "Casual Boot - Brown - 9 - Female - Left",
    materials: ["Leather Upper", "Insole", "Outsole", "Zipper"],
    stages: ["Cutting", "Stitching", "Lasting", "Finishing"],
    price: 55.0,
  },
  {
    id: "AV005",
    articleNumber: "ART002",
    articleName: "Sports Sneaker",
    size: "7",
    color: "red",
    colorName: "Red",
    gender: "female",
    genderName: "Female",
    side: "both",
    sideName: "Both",
    fullName: "ART002 - Red - 7 - Female - Both",
    displayName: "Sports Sneaker - Red - 7 - Female - Both",
    materials: ["Synthetic Upper", "Foam Insole", "Rubber Outsole", "Lace"],
    stages: ["Cutting", "Stitching", "Sole Attachment", "Quality Check"],
    price: 35.0,
  },
]

// Workers Data
export const workers = [
  {
    id: "W001",
    name: "John Smith",
    skill: "Cutting",
    status: "Available",
    hourlyRate: 15,
    employeeId: "EMP001",
    joinDate: "2023-01-15",
    phone: "+91-9876543210",
    address: "123 Main St, Mumbai",
  },
  {
    id: "W002",
    name: "Maria Garcia",
    skill: "Stitching",
    status: "Busy",
    hourlyRate: 18,
    employeeId: "EMP002",
    joinDate: "2023-02-20",
    phone: "+91-9876543211",
    address: "456 Oak Ave, Mumbai",
  },
  {
    id: "W003",
    name: "David Chen",
    skill: "Lasting",
    status: "Available",
    hourlyRate: 20,
    employeeId: "EMP003",
    joinDate: "2023-03-10",
    phone: "+91-9876543212",
    address: "789 Pine Rd, Mumbai",
  },
  {
    id: "W004",
    name: "Sarah Johnson",
    skill: "Finishing",
    status: "Available",
    hourlyRate: 16,
    employeeId: "EMP004",
    joinDate: "2023-04-05",
    phone: "+91-9876543213",
    address: "321 Elm St, Mumbai",
  },
  {
    id: "W005",
    name: "Ahmed Hassan",
    skill: "Quality Check",
    status: "Busy",
    hourlyRate: 22,
    employeeId: "EMP005",
    joinDate: "2023-05-12",
    phone: "+91-9876543214",
    address: "654 Maple Dr, Mumbai",
  },
]

// Employee Work History
export const workHistory = [
  {
    id: "WH001",
    workerId: "W001",
    workerName: "John Smith",
    taskId: "TASK001",
    articleVariant: "AV001",
    articleName: "Classic Oxford - Black - 9 - Male - Both",
    stage: "Cutting",
    startDate: "2024-01-15",
    endDate: "2024-01-17",
    hoursWorked: 16,
    quantity: 50,
    status: "Completed",
    isRework: false,
    qualityScore: 95,
    payableAmount: 240.0,
  },
  {
    id: "WH002",
    workerId: "W002",
    workerName: "Maria Garcia",
    taskId: "TASK002",
    articleVariant: "AV003",
    articleName: "Sports Sneaker - White - 8 - Unisex - Both",
    stage: "Stitching",
    startDate: "2024-01-14",
    endDate: "2024-01-16",
    hoursWorked: 20,
    quantity: 30,
    status: "Completed",
    isRework: false,
    qualityScore: 92,
    payableAmount: 360.0,
  },
  {
    id: "WH003",
    workerId: "W001",
    workerName: "John Smith",
    taskId: "TASK003",
    articleVariant: "AV002",
    articleName: "Classic Oxford - Brown - 10 - Male - Both",
    stage: "Cutting",
    startDate: "2024-01-13",
    endDate: "2024-01-15",
    hoursWorked: 12,
    quantity: 25,
    status: "Rework",
    isRework: true,
    qualityScore: 70,
    payableAmount: 0.0,
  },
]

// Raw Materials
export const rawMaterials = [
  "Upper Leather",
  "Synthetic Upper",
  "Insole",
  "Foam Insole",
  "Outsole",
  "Rubber Outsole",
  "Lace",
  "Eyelet",
  "Thread",
  "Glue",
  "Polish",
  "Zipper",
]

// Production Stages
export const productionStages = [
  "Cutting",
  "Stitching",
  "Lasting",
  "Sole Attachment",
  "Finishing",
  "Quality Check",
  "Packaging",
]

// Purchase Orders
export const purchaseOrders = [
  { id: "PO001", supplier: "Leather Suppliers Ltd", date: "2024-01-15", status: "Active" },
  { id: "PO002", supplier: "Sole Manufacturing Co", date: "2024-01-14", status: "Pending" },
  { id: "PO003", supplier: "Hardware Supplies Inc", date: "2024-01-13", status: "Active" },
  { id: "PO004", supplier: "Synthetic Materials Corp", date: "2024-01-12", status: "Completed" },
]

// Provider Companies
export const providerCompanies = [
  { id: "PC001", name: "Global Shoe Distributors", contact: "John Doe", email: "john@globalshoe.com" },
  { id: "PC002", name: "Fashion Forward Inc", contact: "Jane Smith", email: "jane@fashionforward.com" },
  { id: "PC003", name: "Sports Gear Ltd", contact: "Mike Johnson", email: "mike@sportsgear.com" },
]

// Defect Types
export const defectTypes = [
  "Poor stitching",
  "Uneven cutting",
  "Color mismatch",
  "Size variation",
  "Material defect",
  "Alignment issue",
  "Finishing problem",
  "Sole detachment",
  "Other",
]

// Report Templates
export const reportTemplates = [
  { id: "RPT001", name: "Production Summary", description: "Overall production metrics by factory" },
  { id: "RPT002", name: "Quality Analysis", description: "Defect rates and quality scores" },
  { id: "RPT003", name: "Worker Performance", description: "Individual worker productivity and quality" },
  { id: "RPT004", name: "Article Performance", description: "Production and quality by article variant" },
  { id: "RPT005", name: "Payroll Summary", description: "Worker wages and payment details" },
]
