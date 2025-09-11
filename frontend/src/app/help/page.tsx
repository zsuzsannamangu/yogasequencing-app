'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Mail, MessageCircle, Phone, Clock } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import styles from '@/styles/Help.module.scss';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "How does MoveMosaic work?",
    answer: "MoveMosaic uses AI-powered pose detection to analyze your movement videos and automatically identify key poses. It then creates printable sequence guides that you can share with clients or students for home practice."
  },
  {
    id: 2,
    question: "What video formats are supported?",
    answer: "We support most common video formats including MP4, MOV, AVI, and more. If your video isn't in MP4 format, we'll automatically convert it for you. For best results, we recommend MP4 files."
  },
  {
    id: 3,
    question: "How long can my videos be?",
    answer: "We support videos of any length! Our system is optimized to handle long-form content including full classes, workshops, and extended practice sessions. For very long videos (over 60 minutes), processing may take longer but will complete successfully."
  },
  {
    id: 4,
    question: "Can I edit the poses after they're detected?",
    answer: "Yes! After AI detection, you can delete unwanted poses by clicking the red X, rename poses for clarity, and reorder them to create the perfect sequence flow."
  },
  {
    id: 5,
    question: "How do I download my sequences?",
    answer: "Once your sequence is complete, click the 'Download PDF' button. This will generate a professional, printable sequence guide that you can share with clients or use for your own reference."
  },
  {
    id: 6,
    question: "Can I share sequences with others?",
    answer: "Absolutely! Use the 'Share' button to send sequence links directly to others, or download the PDF to share the printable version. Perfect for sending homework to students or sharing with colleagues."
  },
  {
    id: 7,
    question: "What if the pose detection isn't accurate?",
    answer: "Our AI is constantly learning and improving. For best results, ensure good lighting, clear movement, and a clean background. You can always manually edit or delete poses that don't match your sequence."
  },
  {
    id: 8,
    question: "How do I cancel my subscription?",
    answer: "You can cancel your subscription at any time from your Account Settings. There are no long-term commitments, and you'll continue to have access until the end of your current billing period."
  },
  {
    id: 9,
    question: "Is my data secure?",
    answer: "Yes, we take security seriously. All video uploads are encrypted, and we don't store or share your content with third parties. Your sequences are private and only accessible to you."
  },
  {
    id: 10,
    question: "Do you offer refunds?",
    answer: "We offer a 2-week free trial so you can test MoveMosaic risk-free. If you're not satisfied within the first 30 days of paid subscription, we'll provide a full refund."
  }
];

export default function HelpPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (id: number) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <main className={styles.main}>
                <Navbar showUserMenu={true} firstName="User" lastName="Name" profileImage={null} />

      <section className={styles.helpSection}>
        <div className={styles.helpContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>Help & Support</h1>
            <p className={styles.subtitle}>Find answers to common questions</p>
          </div>

          <div className={styles.searchSection}>
            <div className={styles.searchContainer}>
              <input 
                type="text" 
                placeholder="Search for help topics..." 
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.faqSection}>
            <div className={styles.faqList}>
              {faqData.map((faq) => (
                <div key={faq.id} className={styles.faqItem}>
                  <button 
                    className={styles.faqQuestion}
                    onClick={() => toggleFAQ(faq.id)}
                  >
                    <span>{faq.question}</span>
                    {openFAQ === faq.id ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                  {openFAQ === faq.id && (
                    <div className={styles.faqAnswer}>
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.simpleContactSection}>
            <h2 className={styles.sectionTitle}>Still Need Help?</h2>
            <p className={styles.contactText}>
             Email us at <a href="mailto:support@movemosaic.com" className={styles.emailLink}>support@movemosaic.com</a> to get in touch.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
