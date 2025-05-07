'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const FadeInSection = ({ children }) => {
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
    return (
        <main className="bg-white text-[#111827] font-sans flex flex-col min-h-screen">
            <Navbar />

            {/* HERO SECTION */}
            <section className="relative h-[80vh] flex items-center justify-center text-white bg-white">
                <img
                    src="/y3.png"
                    alt="Yoga Hero"
                    className="absolute inset-0 object-cover w-full h-full opacity-30"
                />
                <div className="z-10 text-center px-6">
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        className="text-6xl font-extrabold leading-tight text-[#f87171]"
                    >
                        Breathe. Move. Remember.
                    </motion.h1>
                    <p className="mt-4 text-xl text-white">
                        Your flow, your sequence — captured and visualized.
                    </p>
                    <button className="mt-6 px-8 py-3 border-2 border-white rounded-full hover:bg-[#f87171] hover:text-white transition font-bold">
                        Learn More
                    </button>
                </div>
            </section>

            {/* ABOUT SECTION */}
            <section id="about" className="grid md:grid-cols-2 py-24 px-8 gap-14 items-center bg-white text-[#111827]">
                <FadeInSection>
                    <img
                        src="/y2.png"
                        alt="Yoga Pose"
                        className="rounded-xl shadow-xl w-full h-auto"
                    />
                </FadeInSection>
                <FadeInSection>
                    <div>
                        <h2 className="text-5xl font-black mb-6 text-[#f87171]">About Us</h2>
                        <p className="text-lg mb-6">
                            YogaFlow helps you remember the sequences that live in your body. We turn your recorded practice into clear, printable visual guides, so your teaching can grow from your lived experience.
                        </p>
                        <button className="px-8 py-2 bg-[#facc15] text-black border rounded-full hover:bg-[#111827] hover:text-white transition font-bold">
                            Learn More
                        </button>
                    </div>
                </FadeInSection>
            </section>

            {/* HOW IT WORKS */}
            <section id="how" className="bg-[#fafafa] py-20 px-8 border-y-4 border-[#111827]">
                <h2 className="text-5xl font-black text-center mb-16 text-[#f87171]">How It Works</h2>
                <div className="max-w-5xl mx-auto grid gap-12 text-left text-lg leading-relaxed">
                    {["Upload Your Practice", "Poses are Captured", "Your Sequence, Visualized", "Download, Print, Share"].map((title, idx) => (
                        <FadeInSection key={idx}>
                            <div className="bg-white p-6 rounded-lg shadow-md border border-[#111827]">
                                <h3 className="text-2xl font-extrabold mb-2 text-[#f87171]">{title}</h3>
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
            <section id="upload" className="bg-white py-24 px-8 text-center">
                <h2 className="text-5xl font-black mb-4 text-[#f87171]">Start Uploading</h2>
                <p className="text-lg mb-10 max-w-2xl mx-auto">
                    Record your flow, upload it, and receive a printable sequence you can download right away. You can use YogaFlow as a guest — no signup needed — but your past sequences won’t be saved. Create an account to keep a library of your recordings and printable files.
                </p>
                <div className="space-x-4">
                    <Link href="/upload">
                        <button className="px-6 py-2 rounded-full border-2 border-[#f87171] text-[#f87171] hover:bg-[#f87171] hover:text-white transition font-bold">
                            Use as Guest
                        </button>
                    </Link>
                    <button className="px-6 py-2 rounded-full border-2 bg-[#facc15] text-black hover:bg-[#111827] hover:text-white transition font-bold">
                        Login / Register
                    </button>
                </div>
            </section>

            {/* CONTACT */}
            <section id="contact" className="grid md:grid-cols-2 border-t-4 border-[#111827] bg-white">
                <div className="p-12">
                    <FadeInSection>
                        <h2 className="text-4xl font-black mb-6 text-[#f87171]">Connect</h2>
                        <form className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <input type="text" placeholder="First name *" className="border-b border-[#111827] bg-transparent outline-none py-2" />
                                <input type="text" placeholder="Last name *" className="border-b border-[#111827] bg-transparent outline-none py-2" />
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <input type="email" placeholder="Email *" className="border-b border-[#111827] bg-transparent outline-none py-2" />
                                <input type="text" placeholder="Phone" className="border-b border-[#111827] bg-transparent outline-none py-2" />
                            </div>
                            <textarea placeholder="Message" className="w-full border-b border-[#111827] bg-transparent outline-none py-2"></textarea>
                            <button type="submit" className="px-6 border-2 bg-[#facc15] text-black py-3 rounded-full hover:bg-[#111827] hover:text-white transition font-bold">
                                Submit
                            </button>
                        </form>
                    </FadeInSection>
                </div>
                <FadeInSection>
                    <img
                        src="/y4.png"
                        alt="Yoga Contact"
                        className="object-cover w-full h-full"
                    />
                </FadeInSection>
            </section>

            <Footer />
        </main>
    );
}
