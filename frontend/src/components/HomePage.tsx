'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function HomePage() {
    return (
        <main className="bg-[#fde68a] text-[#111827] font-sans flex flex-col min-h-screen">
            <Navbar />

            {/* HERO SECTION */}
            <section className="relative h-[80vh] flex items-center justify-center text-[#fef08a] bg-[#60a5fa]">
                <img
                    src="/y3.png"
                    alt="Yoga Hero"
                    className="absolute inset-0 object-cover w-full h-full opacity-40"
                />
                <div className="z-10 text-center px-6">
                    <h1 className="text-6xl font-extrabold leading-tight">Breathe. Move. Remember.</h1>
                    <p className="mt-4 text-xl text-white">
                        Your flow, your sequence — captured and visualized.
                    </p>
                    <button className="mt-6 px-8 py-3 border-2 border-white rounded-full hover:bg-white hover:text-[#60a5fa] transition font-bold">
                        Learn More
                    </button>
                </div>
            </section>

            {/* ABOUT SECTION */}
            <section id="about" className="grid md:grid-cols-2 py-24 px-8 gap-14 items-center bg-[#facc15] text-[#111827]">
                <img
                    src="/y2.png"
                    alt="Yoga Pose"
                    className="rounded-xl shadow-xl w-full h-auto"
                />
                <div>
                    <h2 className="text-5xl font-black mb-6">About Us</h2>
                    <p className="text-lg mb-6">
                        YogaFlow helps you remember the sequences that live in your body. We turn your recorded practice into clear, printable visual guides, so your teaching can grow from your lived experience.
                    </p>
                    <button className="px-8 py-2 bg-white border border-black rounded-full hover:bg-[#111827] hover:text-white transition font-bold">
                        Learn More
                    </button>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how" className="bg-[#fde68a] py-20 px-8 border-y-4 border-[#111827]">
                <h2 className="text-5xl font-black text-[#111827] text-center mb-16">How It Works</h2>

                <div className="max-w-5xl mx-auto grid gap-12 text-left text-lg leading-relaxed">
                    {["Upload Your Practice", "Poses are Captured", "Your Sequence, Visualized", "Download, Print, Share"].map((title, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-lg shadow-md border border-[#111827]">
                            <h3 className="text-2xl font-extrabold mb-2">{title}</h3>
                            <p>
                                {["Record yourself moving through a sequence and upload the video. Your embodied flow becomes a visual reference.",
                                  "The tool detects moments of pause — the held postures — and captures them for you.",
                                  "Each held pose is transformed into a simple silhouette — clean and ready to print or share.",
                                  "Export your sequence as a printable file — to teach, to share, or to keep for inspiration."][idx]}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* START UPLOADING */}
            <section id="upload" className="bg-[#facc15] py-24 px-8 text-center text-[#111827]">
                <h2 className="text-5xl font-black mb-4">Start Uploading</h2>
                <p className="text-lg mb-10 max-w-2xl mx-auto">
                    Record your flow, upload it, and receive a printable sequence you can download right away. You can use YogaFlow as a guest — no signup needed — but your past sequences won’t be saved.
                    Create an account to keep a library of your recordings and printable files.
                </p>
                <div className="space-x-4">
                    <Link href="/upload">
                        <button className="px-6 py-2 rounded-full border-2 border-[#111827] hover:bg-[#111827] hover:text-white transition font-bold">
                            Use as Guest
                        </button>
                    </Link>
                    <button className="px-6 py-2 rounded-full bg-[#111827] text-white hover:bg-[#374151] transition font-bold">
                        Login / Register
                    </button>
                </div>
            </section>

            {/* CONTACT */}
            <section id="contact" className="grid md:grid-cols-2 border-t-4 border-[#111827] bg-[#fef3c7]">
                <div className="p-12">
                    <h2 className="text-4xl font-black mb-6">Let's Connect</h2>
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
                        <button
                            type="submit"
                            className="w-full bg-[#f87171] text-white py-3 rounded-full hover:bg-[#ef4444] transition font-bold"
                        >
                            Submit
                        </button>
                    </form>
                </div>
                <img
                    src="/y1.png"
                    alt="Yoga Contact"
                    className="object-cover w-full h-full"
                />
            </section>

            <Footer />
        </main>
    );
}
