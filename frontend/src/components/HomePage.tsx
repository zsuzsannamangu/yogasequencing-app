'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import styles from '@/styles/HomePage.module.scss';

const FadeInSection = ({ children }: { children: React.ReactNode }) => {
    const [ref, inView] = useInView({ triggerOnce: false, threshold: 0.2 });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
        >
            {children}
        </motion.div>
    );
};

export default function HomePage() {
    // Mock authentication state - in real app this would come from auth context
    const isAuthenticated = false; // Change to true to test signed-in state
    const userData = {
        firstName: 'John',
        lastName: 'Doe',
        profileImage: null
    };

    return (
        <main className={styles.main}>
            <Navbar 
                showUserMenu={isAuthenticated} 
                firstName={isAuthenticated ? userData.firstName : ''} 
                lastName={isAuthenticated ? userData.lastName : ''}
                profileImage={isAuthenticated ? userData.profileImage : undefined}
            />

            {/* HERO SECTION */}
            <section className={styles.heroSection}>
                <img
                    src="images/yoga2.jpg"
                    alt="Yoga Hero"
                    className={styles.heroImage}
                />
                <div className={styles.heroContent}>
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        className={styles.heroTitle}
                    >
                        Breathe. Move. Remember.
                    </motion.h1>
                    <p className={styles.heroSubtitle}>
                        Your sequence captured and visualized.
                    </p>
                    <button 
                        className={styles.heroButton}
                        onClick={() => {
                            document.getElementById('how')?.scrollIntoView({ 
                                behavior: 'smooth' 
                            });
                        }}
                    >
                        Learn More
                    </button>
                </div>
            </section>

            {/* ABOUT SECTION */}
            <section id="about" className={styles.aboutSection}>
                <FadeInSection>
                    <img
                        src="/images/yoga5.jpg"
                        alt="Yoga Pose"
                        className={styles.aboutImage}
                    />
                </FadeInSection>
                <FadeInSection>
                    <div>
                        <h2 className={styles.sectionTitle}>About Us</h2>
                        <p className={styles.sectionText}>
                            MoveMosaic helps you remember the sequences that live in your body. We turn your recorded practice into clear, printable visual guides, so your teaching can grow from your lived experience.
                        </p>
                        <button 
                            className={styles.primaryButton}
                            onClick={() => {
                                document.getElementById('upload')?.scrollIntoView({ 
                                    behavior: 'smooth' 
                                });
                            }}
                        >
                            Try for Free
                        </button>
                    </div>
                </FadeInSection>
            </section>

            {/* HOW IT WORKS */}
            <section id="how" className={styles.HowWorkssection}>
                <h2 className={styles.heading}>How It Works</h2>
                <div className={styles.stepsContainer}>
                    {["Upload Your Practice", "Poses are Captured", "Your Sequence, Visualized", "Download, Print, Share"].map((title, idx) => (
                        <FadeInSection key={idx}>
                            <div className={styles.step}>
                                <h3>{title}</h3>
                                <p>
                                    {[
                                        "Record yourself moving through a sequence and upload the video. Your embodied flow becomes a visual reference.",
                                        "The tool detects moments of pause — the held postures — and captures them for you.",
                                        "Each held pose is transformed into a simple silhouette — clean and ready to print or share.",
                                        "Export your sequence as a printable file — to teach, to share, or to keep for inspiration."
                                    ][idx]}
                                </p>
                            </div>
                        </FadeInSection>
                    ))}
                </div>
            </section>


            {/* START UPLOADING */}
            <section id="upload" className={styles.uploadSection}>
                <h2 className={styles.sectionTitle}>Start Uploading</h2>
                <p className={styles.sectionText}>
                    Record your flow, upload it, and receive a printable sequence you can download right away. You can use YogaFlow as a guest — no signup needed — but your past sequences won’t be saved. Create an account to keep a library of your recordings and printable files.
                </p>
                <div className={styles.uploadButtons}>
                    <Link href="/upload">
                        <button className={styles.outlineButton}>
                            Start Free Trial
                        </button>
                    </Link>
                    <button className={styles.primaryButton}>
                        Login
                    </button>
                </div>
            </section>

            {/* CONTACT */}
            <section id="contact" className={styles.contactSection}>
                <div className={styles.contactFormWrapper}>
                    <FadeInSection>
                        <h2 className={styles.contactTitle}>Connect</h2>
                        <form className={styles.contactForm}>
                            <div className={styles.inputRow}>
                                <input type="text" placeholder="First name *" className={styles.input} />
                                <input type="text" placeholder="Last name *" className={styles.input} />
                            </div>
                            <div className={styles.inputRow}>
                                <input type="email" placeholder="Email *" className={styles.input} />
                                <input type="text" placeholder="Phone" className={styles.input} />
                            </div>
                            <textarea placeholder="Message" className={styles.textarea}></textarea>
                            <button type="submit" className={styles.primaryButton}>
                                Submit
                            </button>
                        </form>
                    </FadeInSection>
                </div>
                <FadeInSection>
                    <img
                        src="/images/yoga3.jpg"
                        alt="Yoga Contact"
                        className={styles.contactImage}
                    />
                </FadeInSection>
            </section>

            <Footer />
        </main>
    );
}
