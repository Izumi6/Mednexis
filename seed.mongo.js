// This file is for MongoDB Shell (mongosh) only.
// Run with: mongosh < seed.mongo.js
// Do NOT run with Node.js (node seed.mongo.js) — use backend/seed.js instead.

/* eslint-disable */
// @ts-nocheck

use("mednexis");
db.users.deleteMany({});
db.appointments.deleteMany({});
db.medicalrecords.deleteMany({});

var doc = {
  name: 'Dr. Gregory House',
  email: 'house@mednexis.com',
  password: '$2a$10$0zX7Bq8/Z0KxgT0b.A3R..B23b7E/t/w9YlEqqRxg3eB0pU4a6KZi',
  role: 'Doctor',
  createdAt: new Date(),
  updatedAt: new Date()
};
db.users.insertOne(doc);

var doctorId = db.users.findOne({email: 'house@mednexis.com'})._id;

var pat = {
  name: 'John Doe',
  email: 'john@example.com',
  password: '$2a$10$0zX7Bq8/Z0KxgT0b.A3R..B23b7E/t/w9YlEqqRxg3eB0pU4a6KZi', 
  role: 'Patient',
  createdAt: new Date(),
  updatedAt: new Date()
};
db.users.insertOne(pat);

var patientId = db.users.findOne({email: 'john@example.com'})._id;

db.appointments.insertOne({
  patient: patientId,
  doctor: doctorId,
  date: new ISODate("2024-05-20T14:30:00Z"),
  status: 'Confirmed',
  createdAt: new Date(),
  updatedAt: new Date()
});

db.medicalrecords.insertOne({
  patient: patientId,
  history: 'Patient complains of severe headache and mild fever for 2 days. No prior chronic illnesses.',
  diagnosis: 'Migraine and Mild Viral Infection',
  medicines: 'Paracetamol 500mg, Ibuprofen 400mg as needed',
  createdAt: new Date(),
  updatedAt: new Date()
});

print("\n\n=================================");
print("✅ DATABASES SUCCESSFULLY SEEDED");
print("=================================\n");

print("--- USERS ---");
printjson(db.users.find().toArray());
print("\n--- APPOINTMENTS ---");
printjson(db.appointments.find().toArray());
print("\n--- MEDICAL RECORDS ---");
printjson(db.medicalrecords.find().toArray());
