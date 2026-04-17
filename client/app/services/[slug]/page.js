'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

// Static content for specialized services (Phase 3 Expansion)
const SERVICE_CONTENT = {
  'dementia-care': {
    title: 'Dementia & Alzheimer Support',
    heroImage: '🧠',
    overview: 'Personalized care focused on cognitive stimulation, safety, and maintaining dignity for those living with memory loss.',
    keyFeatures: [
      '24/7 Monitoring & Wandering Prevention',
      'Cognitive Engagement Activities',
      'Medication Management & Reminders',
      'Respite for Family Caregivers'
    ],
    detailedDescription: 'Our dementia care specialists are trained to handle the unique challenges of memory loss. We focus on creating a familiar, safe environment while engaging patients in activities that stimulate memory and maintain motor skills.',
    badge: 'Specialized Certification'
  },
  'post-surgical': {
    title: 'Post-Surgical Recovery',
    heroImage: '🩹',
    overview: 'Professional nursing assistance to ensure a smooth transition from hospital to home after surgery.',
    keyFeatures: [
      'Wound Care & Dressing Changes',
      'Pain Management Coordination',
      'Mobility & Physical Therapy Support',
      'Complication Monitoring'
    ],
    detailedDescription: 'The first few weeks after surgery are critical. Our caregivers provide the physical and clinical support needed to prevent infections and ensure you meet your recovery milestones safely at home.',
    badge: 'Clinical Oversight'
  },
  'chronic-care': {
    title: 'Chronic Condition Management',
    heroImage: '❤️',
    overview: 'Ongoing assistance for long-term health issues like Diabetes, COPD, or Heart Disease.',
    keyFeatures: [
      'Vital Sign Monitoring',
      'Dietary Management & Meal Prep',
      'Exercise Support',
      'Symptom Tracking & Reporting'
    ],
    detailedDescription: 'Living with a chronic condition requires constant vigilance. We help manage the daily routine of tracking vitals and adhering to medical advice, significantly reducing hospital readmission rates.',
    badge: 'Long-term Support'
  }
};

export default function SpecializedServicePage({ params }) {
  const { slug } = params;
  const content = SERVICE_CONTENT[slug] || {
    title: 'General Nursing Care',
    heroImage: '🌿',
    overview: 'High-quality, compassionate nursing care for everyday needs and well-being.',
    keyFeatures: ['Personal Care', 'Medication Help', 'Companionship'],
    detailedDescription: 'Our general nursing services cover everything from daily hygiene to companionship and basic health monitoring.',
    badge: 'Verified Care'
  };

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: 'var(--cream-50)' }}>
        
        {/* HERO SECTION */}
        <div style={{ background: 'var(--cream-100)', paddingTop: '160px', paddingBottom: 'var(--space-20)', position: 'relative', overflow: 'hidden' }}>
          <div className="container" style={{ position: 'relative', zIndex: 2 }}>
            <span className="badge badge-sage" style={{ marginBottom: 'var(--space-4)' }}>{content.badge}</span>
            <h1 className="section-heading" style={{ fontSize: '3.5rem', marginBottom: 'var(--space-6)', maxWidth: '700px' }}>
              {content.title}
            </h1>
            <p className="section-subheading" style={{ fontSize: '1.25rem', maxWidth: '600px', lineHeight: 1.6 }}>
              {content.overview}
            </p>
            <div style={{ marginTop: 'var(--space-10)', display: 'flex', gap: 'var(--space-4)' }}>
              <Link href="/book" className="btn btn-primary">Book This Service →</Link>
              <Link href="/caregivers" className="btn btn-outline">Meet Our Specialists</Link>
            </div>
          </div>
          <div style={{ position: 'absolute', top: '10%', right: '5%', fontSize: '20rem', opacity: 0.1, transform: 'rotate(10deg)' }}>
            {content.heroImage}
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="container" style={{ padding: 'var(--space-20) 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'var(--space-16)' }}>
            
            <div style={{ background: 'white', padding: 'var(--space-10)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: 'var(--space-6)', fontSize: '1.5rem' }}>What's Included</h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 0, listStyle: 'none' }}>
                {content.keyFeatures.map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: 'var(--sage-600)', fontSize: '1.25rem' }}>✓</div>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: 'var(--space-6)', fontSize: '1.75rem' }}>Our Approach</h3>
              <p style={{ fontSize: '1.125rem', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
                {content.detailedDescription}
              </p>
              
              <div style={{ background: 'var(--terracotta-50)', padding: 'var(--space-8)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--terracotta-200)' }}>
                <h4 style={{ color: 'var(--primary)', margin: '0 0 12px' }}>Family Coordination</h4>
                <p style={{ fontSize: '0.9375rem', margin: 0, color: 'var(--text-primary)' }}>
                  For complex care like <strong>{content.title}</strong>, we provide real-time updates directly to family members through our dashboard messaging and digital health logs.
                </p>
              </div>
            </div>

          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
