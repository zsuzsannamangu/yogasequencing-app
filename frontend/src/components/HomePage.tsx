'use client';

import React from 'react';

export default function HomePage() {
    return (
        <main className="bg-[#f4c6cc] text-[#3f4a23] font-sans">
            {/* NAV */}
            <header className="flex justify-between items-center px-8 py-4 border-b border-[#3f4a23]">
                <div className="text-lg font-bold">YogaFlow</div>
                <nav className="space-x-6 text-sm font-medium">
                    <a href="#about" className="hover:underline">About</a>
                    <a href="#how" className="hover:underline">How It Works</a>
                    <a href="#upload" className="hover:underline">Upload</a>
                    <a href="#contact" className="hover:underline">Contact</a>
                </nav>
            </header>

            {/* HERO SECTION */}
            <section className="relative h-[80vh] flex items-center justify-center text-[#fdf157]">
                <img
                    src="/hero-yoga.jpg"
                    alt="Yoga Hero"
                    className="absolute inset-0 object-cover w-full h-full opacity-50"
                />
                <div className="z-10 text-center px-6">
                    <h1 className="text-5xl md:text-7xl font-bold leading-tight">Breathe. Move. Remember.</h1>
                    <p className="mt-4 text-lg text-[#3f4a23]/90">
                        Your flow, your sequence — made visual through AI.
                    </p>
                    <button className="mt-6 px-6 py-2 border border-[#3f4a23] rounded-full hover:bg-[#3f4a23] hover:text-white transition">
                        Learn More
                    </button>
                </div>
            </section>

            {/* ABOUT SECTION */}
            <section id="about" className="grid md:grid-cols-2 py-24 px-6 gap-14 items-center">
                <img
                    src="/yoga-side.jpg"
                    alt="Yoga Pose"
                    className="rounded-lg shadow-md w-full h-auto"
                />
                <div>
                    <h2 className="text-5xl font-bold mb-6">About Us</h2>
                    <p className="text-lg text-[#3f4a23]/80 mb-6">
                        At YogaFlow, we help you capture and preserve the magic of your embodied practice by translating movement into printable, clean visuals.
                    </p>
                    <button className="px-6 py-2 border border-[#3f4a23] text-[#3f4a23] rounded-full hover:bg-[#3f4a23] hover:text-white transition">
                        Learn More
                    </button>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how" className="bg-[#f4c6cc] py-20 px-6 border-y border-[#3f4a23]/30">
                <h2 className="text-5xl font-extrabold text-[#3f4a23] text-left max-w-screen-xl mx-auto mb-16">
                    How It Works
                </h2>

                <div className="max-w-screen-xl mx-auto grid gap-8 text-left text-lg leading-relaxed text-[#3f4a23]/90">
                    {[
                        {
                            title: "Upload Your Practice",
                            description: "Record yourself flowing and upload the video. Your embodied sequence becomes data.",
                        },
                        {
                            title: "AI Detects Held Poses",
                            description: "Our system identifies moments of stillness — the true asanas — and extracts them.",
                        },
                        {
                            title: "Visual Sequence Generated",
                            description: "Each pose becomes a clean, printable silhouette. Saved as vector art.",
                        },
                        {
                            title: "Download or Share",
                            description: "Export your sequence as a printable PDF — to teach, to share, or to remember.",
                        },
                    ].map((item, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-x-12 border-t border-[#3f4a23]/20 pt-8">
                            <h3 className="text-2xl font-semibold text-[#3f4a23]">{item.title}</h3>
                            <p>{item.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* START UPLOADING */}
            <section id="upload" className="bg-[#fdf2f4] py-24 px-6 text-center">
                <h2 className="text-5xl font-extrabold text-[#3f4a23] mb-4">Start Uploading</h2>
                <p className="text-[#3f4a23]/80 text-lg mb-10 max-w-2xl mx-auto">
                    Create printable sequences by recording and uploading your embodied flow.
                </p>
                <div className="space-x-4">
                    <button className="px-6 py-2 rounded-full border border-[#3f4a23] text-[#3f4a23] hover:bg-[#3f4a23] hover:text-white transition">
                        Register
                    </button>
                    <button className="px-6 py-2 rounded-full bg-[#3f4a23] text-white hover:bg-[#2d381a] transition">
                        Login
                    </button>
                </div>
            </section>

            {/* CONTACT */}
            <section id="contact" className="grid md:grid-cols-2 border-t border-[#3f4a23]/20">
                <div className="bg-[#fdf2f4] p-12">
                    <h2 className="text-4xl font-bold text-[#3f4a23] mb-6">Let's Connect</h2>
                    <form className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <input type="text" placeholder="First name *" className="border-b border-[#3f4a23] bg-transparent outline-none py-2" />
                            <input type="text" placeholder="Last name *" className="border-b border-[#3f4a23] bg-transparent outline-none py-2" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <input type="email" placeholder="Email *" className="border-b border-[#3f4a23] bg-transparent outline-none py-2" />
                            <input type="text" placeholder="Phone" className="border-b border-[#3f4a23] bg-transparent outline-none py-2" />
                        </div>
                        <textarea placeholder="Message" className="w-full border-b border-[#3f4a23] bg-transparent outline-none py-2"></textarea>
                        <button
                            type="submit"
                            className="w-full bg-[#fdf157] text-[#3f4a23] py-2 rounded-full hover:bg-[#2d381a] transition"
                        >
                            Submit
                        </button>
                    </form>
                </div>
                <img
                    src="/contact-yoga.jpg"
                    alt="Yoga Contact"
                    className="object-cover w-full h-full"
                />
            </section>

            {/* FOOTER */}
            <footer className="text-center text-sm text-[#3f4a23]/60 py-6 border-t border-[#3f4a23]/20">
                © {new Date().getFullYear()} YogaFlow. All rights reserved.
            </footer>
        </main>
    );
}
