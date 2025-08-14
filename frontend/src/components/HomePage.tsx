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
    const isAuthenticated = true; // Set to true to show user menu when signed in
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
                    <motion.p
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        className={styles.heroTitle}
                    >
                        Visualize movement into a sequence.
                    </motion.p>
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
                <div className={styles.container}>
                    <div className={styles.section}>
                        <div className={styles.content}>
                            <h2 className={styles.sectionTitle}>About Us</h2>
                            <p className={styles.sectionText}>
                                MoveMosaic helps you remember the sequences that live in your body. We turn your recorded practice into clear, printable visual guides, so your teaching can grow from your lived experience.
                            </p>
                            <p className={styles.sectionText}>
                                Every movement professional has experienced that moment when a student asks, "Can you show me that sequence again?" or "What was that flow we did last week?" With MoveMosaic, you'll never have to rely on memory alone. Your embodied knowledge becomes a tangible, shareable resource that grows with every practice session.
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
                        <div className={styles.imageContainer}>
                            <img
                                src="/images/yoga5.jpg"
                                alt="Yoga Pose"
                                className={styles.aboutImage}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* WHO IS THIS FOR SECTION - FULL WIDTH */}
            <section className={styles.whoIsThisForSection}>
                <div className={styles.contentContainer}>
                    <FadeInSection>
                        
                        <div className={styles.professionalsHeader}>
                            <div className={styles.professionalsTitle}>
                                <h3>Who is it for?</h3>
                                <p>Our app is designed for movement and wellness professionals who want to create clear, personalized visual sequences from their own video demonstrations, making it easier to communicate, teach, and support their clients' progress.</p>
                            </div>
                        </div>
                    </FadeInSection>
                </div>
                
                <div className={styles.navigationArrows}>
                    <button className={styles.navArrow} onClick={() => document.getElementById('professionalsGrid')?.scrollBy({ left: -1180, behavior: 'smooth' })}>
                        ←
                    </button>
                    <button className={styles.navArrow} onClick={() => document.getElementById('professionalsGrid')?.scrollBy({ left: 1180, behavior: 'smooth' })}>
                        →
                    </button>
                </div>
                
                <div id="professionalsGrid" className={styles.professionalsGrid}>
                    <div className={styles.professionalCard}>
                        <div className={styles.cardIcon}>
                            <img src="/images/yogaicon.png" alt="Yoga" />
                        </div>
                        <h4>Yoga Teachers & Therapists</h4>
                        <p>Capture your flows and therapeutic sequences in a printable format to share with students for home practice or rehab.</p>
                    </div>
                    
                    <div className={styles.professionalCard}>
                        <div className={styles.cardIcon}>
                            <img src="/images/pilatesicon.png" alt="Pilates" />
                        </div>
                        <h4>Pilates Instructors</h4>
                        <p>Turn your Pilates routines into easy-to-follow visual guides to support client learning and technique.</p>
                    </div>
                    
                    <div className={styles.professionalCard}>
                        <div className={styles.cardIcon}>
                            <img src="/images/pystherapyicon.png" alt="Physical Therapy" />
                        </div>
                        <h4>Physical Therapists</h4>
                        <p>Generate customized exercise sheets from live demonstrations to enhance patient recovery and compliance.</p>
                    </div>
                    
                    <div className={styles.professionalCard}>
                        <div className={styles.cardIcon}>
                            <img src="/images/oticon.png" alt="Occupational Therapy" />
                        </div>
                        <h4>Occupational Therapists</h4>
                        <p>Create tailored activity sequences that help clients build functional movement skills at their own pace.</p>
                    </div>
                    
                    <div className={styles.professionalCard}>
                        <div className={styles.cardIcon}>
                            <img src="/images/dancericon.png" alt="Dance" />
                        </div>
                        <h4>Dance Teachers & Choreographers</h4>
                        <p>Document choreography with precise pose visuals, helping dancers learn and rehearse complex sequences.</p>
                    </div>
                    
                    <div className={styles.professionalCard}>
                        <div className={styles.cardIcon}>
                            <img src="/images/trainericon.png" alt="Fitness Training" />
                        </div>
                        <h4>Personal Trainers & Fitness Coaches</h4>
                        <p>Build workout plans with clear visual cues to improve client engagement and form.</p>
                    </div>
                    
                    <div className={styles.professionalCard}>
                        <div className={styles.cardIcon}>
                            <img src="/images/martialartsicon.png" alt="Martial Arts" />
                        </div>
                        <h4>Martial Arts Instructors</h4>
                        <p>Break down forms, katas, and techniques into step-by-step pose sequences for student mastery.</p>
                    </div>
                    
                    <div className={styles.professionalCard}>
                        <div className={styles.cardIcon}>
                            <img src="/images/coachicon.png" alt="Sports Training" />
                        </div>
                        <h4>Sports Coaches</h4>
                        <p>Visualize sport-specific drills and preventive exercises for optimal performance and injury prevention.</p>
                    </div>
                    
                    <div className={styles.professionalCard}>
                        <div className={styles.cardIcon}>
                            <img src="/images/chiroicon.png" alt="Chiropractic" />
                        </div>
                        <h4>Chiropractors</h4>
                        <p>Provide patients with simple visual exercise guides to support spinal health and mobility.</p>
                    </div>
                </div>
            </section>

            <div className={styles.contentContainer}>
                {/* WHY MOVEMOSAIC SECTION */}
                <section className={styles.whySection}>
                    <div className={styles.container}>
                        <div className={`${styles.section} ${styles.reverse}`}>
                            <div className={styles.content}>
                                <h2 className={styles.sectionTitle}>Why MoveMosaic?</h2>
                                <p className={styles.sectionText}>
                                    In the world of movement education, there's a gap between what you know in your body and what you can share with your students. Traditional methods like written notes or generic diagrams often fall short of capturing the nuance and flow of your practice.
                                </p>
                                <p className={styles.sectionText}>
                                    MoveMosaic bridges this gap by capturing the exact moments of your sequences. Our technology creates visual representations that preserve the essence of your teaching style.
                                </p>
                                <p className={styles.sectionText}>
                                    What sets us apart is our commitment to personalization. Every sequence you create becomes part of your unique library, reflecting your teaching philosophy, your students' needs, and your evolving practice.
                                </p>
                            </div>
                            <div className={styles.imageContainer}>
                                <img
                                    src="/images/4.jpg"
                                    alt="Why MoveMosaic"
                                    className={styles.whyImage}
                                />
                            </div>
                        </div>
                    </div>
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
                                            "The tool detects moments of pause, the held postures, and captures them for you.",
                                            "Each held pose is transformed into a simple silhouette, clean and ready to print or share.",
                                            "Export your sequence as a printable file, to teach, to share, or to keep for inspiration."
                                        ][idx]}
                                    </p>
                                </div>
                            </FadeInSection>
                        ))}
                    </div>
                </section>

                {/* FEATURES SECTION */}
                <section className={styles.featuresSection}>
                    <div className={styles.featuresContent}>
                        <h2 className={styles.sectionTitle}>Powerful Features for Movement Professionals</h2>
                        <div className={styles.featureList}>
                            <div className={styles.featureItem}>
                                <h4>Pose Detection</h4>
                                <p>Our advanced machine learning algorithms automatically identify and capture key poses from your video, ensuring nothing important is missed.</p>
                            </div>
                            <div className={styles.featureItem}>
                                <h4>Customizable Sequences</h4>
                                <p>Edit, reorder, and personalize your sequences. Add notes, modify poses, and create variations for different skill levels.</p>
                            </div>
                            <div className={styles.featureItem}>
                                <h4>Professional Export Options</h4>
                                <p>Download your sequences in multiple formats including PDF, SVG, and high-resolution images perfect for printing or digital sharing.</p>
                            </div>
                            <div className={styles.featureItem}>
                                <h4>Client Management</h4>
                                <p>Organize sequences by client, class type, or therapeutic focus. Build comprehensive libraries that grow with your practice.</p>
                            </div>
                            <div className={styles.featureItem}>
                                <h4>Mobile-First Design</h4>
                                <p>Record and upload videos directly from your phone, then access your sequences anywhere, anytime.</p>
                            </div>
                        </div>
                    </div>
                    <div className={styles.imageContainer}>
                        <img
                            src="/images/9.jpg"
                            alt="App Features"
                            className={styles.featuresImage}
                        />
                    </div>
                </section>

                {/* BENEFITS SECTION */}
                <section className={styles.benefitsSection}>
                    <FadeInSection>
                        <img
                            src="/images/8.jpg"
                            alt="Teaching Benefits"
                            className={styles.benefitsImage}
                        />
                    </FadeInSection>
                    <FadeInSection>
                        <div className={styles.benefitsContent}>
                            <h2 className={styles.sectionTitle}>Transform Your Teaching Practice</h2>
                            <p className={styles.sectionText}>
                                SequenceFlow is a fundamental shift in how movement professionals document and share their knowledge. By digitizing your embodied expertise, you're creating a legacy that extends far beyond individual sessions.
                            </p>
                            <div className={styles.benefitsGrid}>
                                <div className={styles.benefitCard}>
                                    <h4>Enhanced Client Engagement</h4>
                                    <p>Provide clients or students with clear, visual references that support their home practice and accelerate their progress.</p>
                                </div>
                                <div className={styles.benefitCard}>
                                    <h4>Professional Development</h4>
                                    <p>Build a comprehensive library of your teaching methods, making it easier to refine your approach and develop new sequences.</p>
                                </div>
                                <div className={styles.benefitCard}>
                                    <h4>Time Efficiency</h4>
                                    <p>Reduce the time spent recreating sequences from memory or explaining complex movements to multiple students.</p>
                                </div>
                                <div className={styles.benefitCard}>
                                    <h4>Business Growth</h4>
                                    <p>Create additional revenue streams by offering personalized sequence packages and expanding your reach beyond in-person sessions.</p>
                                </div>
                            </div>
                        </div>
                    </FadeInSection>
                </section>

                {/* START UPLOADING */}
                <section id="upload" className={styles.uploadSection}>
                    <h2 className={styles.sectionTitle}>Start Creating</h2>
                    <p className={styles.sectionText}>
                        Upload your video and receive a printable sequence. Keep a library of your sequences, share with others, and browse sequences from the community. Start building your digital movement library.
                    </p>
                    
                    <div className={styles.pricingSection}>
                        <h3 className={styles.pricingTitle}>Simple, Transparent Pricing</h3>
                        <div className={styles.pricingGrid}>
                            <div className={styles.pricingCard}>
                                <h4 className={styles.pricingPlan}>Free Trial</h4>
                                <p className={styles.pricingDuration}>2 weeks</p>
                                <p className={styles.pricingPrice}>$0</p>
                                <p className={styles.pricingDescription}>Try all features with no commitment</p>
                            </div>
                            
                            <div className={styles.pricingCard}>
                                <h4 className={styles.pricingPlan}>Monthly</h4>
                                <p className={styles.pricingDuration}>Billed monthly</p>
                                <p className={styles.pricingPrice}>$19</p>
                                <p className={styles.pricingDescription}>Full access to all features</p>
                            </div>
                            
                            <div className={styles.pricingCard}>
                                <h4 className={styles.pricingPlan}>Annual</h4>
                                <p className={styles.pricingDuration}>Billed yearly</p>
                                <p className={styles.pricingPrice}>$79</p>
                                <p className={styles.pricingDescription}>Save $159 per year</p>
                            </div>
                            
                            <div className={styles.pricingCard}>
                                <h4 className={styles.pricingPlan}>Student Trial</h4>
                                <p className={styles.pricingDuration}>3 months</p>
                                <p className={styles.pricingPrice}>$29</p>
                                <p className={styles.pricingDescription}>For students in training</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className={styles.uploadButtons}>
                        <Link href="/register">
                            <button className={styles.outlineButton}>
                                Start Free Trial
                            </button>
                        </Link>
                        <button 
                            className={styles.primaryButton}
                            onClick={() => {
                                window.location.href = '/login';
                            }}
                        >
                            Login
                        </button>
                    </div>
                </section>
            </div>

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
