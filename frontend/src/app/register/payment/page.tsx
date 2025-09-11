'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from '@/styles/RegisterFlow.module.scss';

export default function PaymentPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleStartTrial = async () => {
    setIsProcessing(true);
    // Here you would integrate with Stripe
    // For now, we'll simulate the process
    setTimeout(() => {
      setIsProcessing(false);
      router.push('/dashboard');
    }, 2000);
  };

  return (
    <main className={styles.main}>
      <Navbar />
      
      <section className={styles.flowSection}>
        <div className={styles.flowContainer}>
          <div className={styles.header}>
            <Link href="/register/about" className={styles.backButton}>
              ←
            </Link>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: '100%' }}></div>
            </div>
          </div>

          <h1 className={styles.title}>Start Your Free Trial</h1>
          <p className={styles.subtitle}>Get started with MoveMosaic today and transform how you create movement sequences.</p>

          <div className={styles.pricingCard}>
            <div className={styles.priceHeader}>
              <div className={styles.price}>
                <span className={styles.currency}>$</span>
                <span className={styles.amount}>19</span>
                <span className={styles.period}>.99/month</span>
              </div>
              <div className={styles.trialBadge}>2 Week Free Trial</div>
            </div>

            <div className={styles.features}>
              <h3>What's included:</h3>
              <ul>
                <li>✓ Unlimited video uploads</li>
                <li>✓ AI-powered pose detection</li>
                <li>✓ Customizable sequence creation</li>
                <li>✓ PDF export and sharing</li>
                <li>✓ Sequence library management</li>
                <li>✓ Priority customer support</li>
              </ul>
            </div>

            <div className={styles.cancelNotice}>
              <p>Cancel anytime • No commitment required</p>
            </div>

            <button 
              onClick={handleStartTrial}
              className={`btn-primary ${isProcessing ? 'disabled' : ''}`}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Start Free Trial'}
            </button>

            <div className={styles.securityNotice}>
              <p>🔒 Secure payment powered by Stripe</p>
              <p>Your payment information is encrypted and secure</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
