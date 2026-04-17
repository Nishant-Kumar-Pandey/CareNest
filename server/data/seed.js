const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Caregiver = require('../models/Caregiver');
const Patient = require('../models/Patient');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const CareNote = require('../models/CareNote');
const Review = require('../models/Review');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elderly-care';

const services = [
  { name: 'Personal Care & Hygiene', slug: 'personal-care', description: 'Assistance with bathing, grooming, dressing, and personal hygiene to maintain dignity and comfort.', category: 'Personal Care', basePrice: 22, duration: 'Hourly', icon: '🧼', features: ['Bathing assistance', 'Grooming & dressing', 'Oral hygiene', 'Skin care'] },
  { name: 'Medication Management', slug: 'medication-management', description: 'Ensuring medications are taken correctly and on time, with careful tracking and reporting.', category: 'Medical Assistance', basePrice: 28, duration: 'Hourly', icon: '💊', features: ['Medication reminders', 'Dosage tracking', 'Pharmacy coordination', 'Vital signs monitoring'] },
  { name: 'Companionship & Social Engagement', slug: 'companionship', description: 'Friendly, meaningful company to combat loneliness with activities, conversation, and outings.', category: 'Companionship', basePrice: 18, duration: 'Hourly', icon: '🤝', features: ['Conversation & activities', 'Reading & games', 'Light exercise', 'Emotional support'] },
  { name: 'Dementia & Alzheimer\'s Care', slug: 'dementia-care', description: 'Specialized memory care with structured routines, cognitive activities, and compassionate supervision.', category: 'Specialized Care', basePrice: 35, duration: 'Hourly', icon: '🧠', features: ['Cognitive stimulation', 'Structured routines', 'Safety supervision', 'Family communication'] },
  { name: 'Post-Surgery Recovery', slug: 'post-surgery', description: 'Professional assistance during recovery — wound care, mobility support, and physician liaison.', category: 'Medical Assistance', basePrice: 32, duration: 'Hourly', icon: '🏥', features: ['Wound care support', 'Mobility assistance', 'Appointment escort', 'Recovery tracking'] },
  { name: 'Household & Meal Support', slug: 'household-support', description: 'Light housekeeping, laundry, grocery shopping, and nutritious meal preparation.', category: 'Household Help', basePrice: 20, duration: 'Hourly', icon: '🍲', features: ['Meal planning & prep', 'Light housekeeping', 'Grocery shopping', 'Laundry assistance'] },
];

const caregiverProfiles = [
  { name: 'Sarah Mitchell', email: 'sarah@care.com', phone: '555-0101', specializations: ['Dementia Care', 'Medication Management'], bio: 'Certified dementia care specialist with 12 years of experience supporting families through memory challenges. I believe dignified care begins with listening.', experience: 12, hourlyRate: 38, languages: ['English', 'Spanish'], rating: 4.9, totalReviews: 47, isVerified: true, backgroundCheck: true, profileComplete: true, location: { city: 'Austin', state: 'TX', zipCode: '78701' } },
  { name: 'James Okafor', email: 'james@care.com', phone: '555-0102', specializations: ['Post-Surgery Recovery', 'Physical Therapy Assistance', 'Wound Care'], bio: 'Former hospital nurse with 8 years of post-acute care. Specializing in smooth recovery transitions from hospital to home.', experience: 8, hourlyRate: 34, languages: ['English', 'Yoruba'], rating: 4.8, totalReviews: 31, isVerified: true, backgroundCheck: true, profileComplete: true, location: { city: 'Austin', state: 'TX', zipCode: '78704' } },
  { name: 'Maria Chen', email: 'maria@care.com', phone: '555-0103', specializations: ['Companionship', 'Nutrition & Meal Prep', 'Mobility Assistance'], bio: 'Passionate about enriching the lives of seniors through meaningful connection, gentle movement, and wholesome nutrition. Let\'s make every day joyful.', experience: 6, hourlyRate: 24, languages: ['English', 'Mandarin', 'Cantonese'], rating: 4.7, totalReviews: 58, isVerified: true, backgroundCheck: true, profileComplete: true, location: { city: 'Austin', state: 'TX', zipCode: '78745' } },
  { name: 'Robert Alvarez', email: 'robert@care.com', phone: '555-0104', specializations: ['Chronic Disease Management', 'Medication Management', 'Palliative Care'], bio: 'Board-certified CNA with palliative care certification. I walk alongside families during life\'s hardest seasons with empathy and skill.', experience: 15, hourlyRate: 42, languages: ['English', 'Spanish'], rating: 4.9, totalReviews: 23, isVerified: true, backgroundCheck: true, profileComplete: true, location: { city: 'Austin', state: 'TX', zipCode: '78731' } },
  { name: 'Linda Thompson', email: 'linda@care.com', phone: '555-0105', specializations: ['Personal Care', 'Companionship', 'Mobility Assistance'], bio: 'Warm, patient, and dedicated home health aide who treats every client like family. 10 years of in-home senior care experience.', experience: 10, hourlyRate: 26, languages: ['English'], rating: 4.6, totalReviews: 74, isVerified: true, backgroundCheck: true, profileComplete: true, location: { city: 'Austin', state: 'TX', zipCode: '78758' } },
  { name: 'David Park', email: 'david@care.com', phone: '555-0106', specializations: ['Physical Therapy Assistance', 'Post-Surgery Recovery', 'Mobility Assistance'], bio: 'Physical therapy aide with a background in geriatric fitness. Helping seniors regain independence one step at a time.', experience: 5, hourlyRate: 29, languages: ['English', 'Korean'], rating: 4.5, totalReviews: 19, isVerified: true, backgroundCheck: true, profileComplete: true, location: { city: 'Austin', state: 'TX', zipCode: '78723' } },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}), Caregiver.deleteMany({}), Patient.deleteMany({}),
      Service.deleteMany({}), Booking.deleteMany({}), CareNote.deleteMany({}), Review.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Seed services
    const seededServices = await Service.insertMany(services);
    console.log(`✅ Seeded ${seededServices.length} services`);

    // Seed caregivers
    for (const cg of caregiverProfiles) {
      const { name, email, phone, specializations, bio, experience, hourlyRate, languages, rating, totalReviews, isVerified, backgroundCheck, profileComplete, location } = cg;
      const user = await User.create({ name, email, password: 'Password123!', role: 'caregiver', phone });
      await Caregiver.create({ user: user._id, bio, specializations, experience, hourlyRate, languages, rating, totalReviews, isVerified, backgroundCheck, profileComplete, location });
    }
    console.log(`✅ Seeded ${caregiverProfiles.length} caregivers`);

    // Seed a demo patient
    const patientUser = await User.create({ name: 'Eleanor Whitfield', email: 'eleanor@demo.com', password: 'Password123!', role: 'patient', phone: '555-0200' });
    await Patient.create({
      user: patientUser._id,
      dateOfBirth: new Date('1945-04-12'),
      gender: 'female',
      address: { street: '123 Oak Street', city: 'Austin', state: 'TX', zipCode: '78701' },
      medicalHistory: { conditions: ['Type 2 Diabetes', 'Mild Hypertension'], mobilityLevel: 'assisted', cognitionLevel: 'normal' },
      emergencyContact: { name: 'Thomas Whitfield', relationship: 'Son', phone: '555-0201' },
    });
    console.log('✅ Seeded demo patient (email: eleanor@demo.com, password: Password123!)');

    // Seed admin
    await User.create({ name: 'Admin User', email: 'admin@care.com', password: 'Admin123!', role: 'admin' });
    console.log('✅ Seeded admin (email: admin@care.com, password: Admin123!)');

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('Demo credentials:');
    console.log('  Patient:   eleanor@demo.com / Password123!');
    console.log('  Caregiver: sarah@care.com   / Password123!');
    console.log('  Admin:     admin@care.com    / Admin123!\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
