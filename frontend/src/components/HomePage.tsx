// 

export default function HomePage() {
    return (
        <main className="bg-white text-neutral-900 font-sans">
            {/* NAV */}
            <header className="flex justify-between items-center px-8 py-4 border-b">
                <div className="text-lg font-bold text-red-600">YogaFlow</div>
                <nav className="space-x-6 text-sm font-medium">
                    <a href="#about" className="hover:underline">About</a>
                    <a href="#how" className="hover:underline">How It Works</a>
                    <a href="#upload" className="hover:underline">Upload</a>
                    <a href="#contact" className="hover:underline">Contact</a>
                </nav>
            </header>
            {/* HERO SECTION */}
            <section className="relative h-[80vh] flex items-center justify-center bg-black text-white">
                <img
                    src="/hero-yoga.jpg"
                    alt="Yoga Hero"
                    className="absolute inset-0 object-cover w-full h-full opacity-60"
                />
                <div className="z-10 text-center px-6">
                    <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                        Transforming Practice into Presence
                    </h1>
                    <p className="mt-4 text-lg text-gray-200">
                        Empowering yoga teachers through intuitive AI-generated sequences
                    </p>
                    <button className="mt-6 px-6 py-2 border border-white rounded-full hover:bg-white hover:text-black transition">
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
                    <h2 className="text-5xl font-bold text-red-600 mb-6">About Us</h2>
                    <p className="text-lg text-gray-700 mb-6">
                        At YogaFlow, we’re dedicated to enhancing your well-being through a unique blend of mindfulness, movement, and intelligent tools. Our mission is to empower yoga teachers with visual resources that deepen the connection to body, breath, and presence.
                    </p>
                    <button className="px-6 py-2 border border-red-600 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition">
                        Learn More
                    </button>
                </div>
            </section>

            <section id="how" className="bg-white py-20 px-6 border-y">
                <h2 className="text-5xl font-extrabold text-red-600 text-left max-w-screen-xl mx-auto mb-16">
                    How It Works
                </h2>

                <div className="max-w-screen-xl mx-auto grid gap-8 text-left text-lg leading-relaxed text-gray-800">
                    {[
                        {
                            title: "Upload Your Practice",
                            description: "Simply record yourself flowing through your practice and upload the video to YogaFlow. No need to write anything down.",
                        },
                        {
                            title: "AI Detects Held Poses",
                            description: "Our AI automatically detects moments of stillness where you hold a pose, ensuring your sequence reflects your embodied experience.",
                        },
                        {
                            title: "Visual Sequence is Generated",
                            description: "We create a clean, printable visual guide with vector silhouettes of your poses in the order you performed them.",
                        },
                        {
                            title: "Download, Print, or Teach",
                            description: "Download your sequence, share it with students, or keep it for your own practice. YogaFlow helps you preserve and transmit your flow.",
                        },
                    ].map((item, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-x-12 border-t pt-8">
                            <h3 className="text-2xl font-semibold text-red-600">{item.title}</h3>
                            <p className="text-gray-700">{item.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* START UPLOADING */}
            <section id="upload" className="bg-gray-50 py-24 px-6 text-center">
                <h2 className="text-5xl font-extrabold text-red-600 mb-4">Start Uploading</h2>
                <p className="text-gray-700 text-lg mb-10 max-w-2xl mx-auto">
                    Sign in or register to begin generating printable visual sequences from your recorded yoga practice.
                </p>
                <div className="space-x-4">
                    <button className="px-6 py-2 rounded-full border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition">
                        Register
                    </button>
                    <button className="px-6 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition">
                        Login
                    </button>
                </div>
            </section>

            {/* CONTACT */}
            <section id="contact" className="grid md:grid-cols-2 border-t">
                {/* Left: Form */}
                <div className="bg-gray-50 p-12">
                    <h2 className="text-4xl font-bold text-red-600 mb-6">Let's Connect</h2>
                    <form className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <input type="text" placeholder="First name *" className="border-b border-red-600 bg-transparent outline-none py-2" />
                            <input type="text" placeholder="Last name *" className="border-b border-red-600 bg-transparent outline-none py-2" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <input type="email" placeholder="Email *" className="border-b border-red-600 bg-transparent outline-none py-2" />
                            <input type="text" placeholder="Phone" className="border-b border-red-600 bg-transparent outline-none py-2" />
                        </div>
                        <textarea placeholder="Message" className="w-full border-b border-red-600 bg-transparent outline-none py-2"></textarea>
                        <button
                            type="submit"
                            className="w-full bg-red-600 text-white py-2 rounded-full hover:bg-red-700 transition"
                        >
                            Submit
                        </button>
                    </form>
                </div>

                {/* Right: Image */}
                <img
                    src="/contact-yoga.jpg"
                    alt="Yoga Contact"
                    className="object-cover w-full h-full"
                />
            </section>

            {/* FOOTER */}
            <footer className="text-center text-sm text-gray-500 py-6 border-t">
                © {new Date().getFullYear()} YogaFlow. All rights reserved.
            </footer>
        </main>
    );
}