'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="flex justify-between items-center px-8 py-6 bg-[#f87171] text-white">
      <div className="text-2xl font-black">YogaFlow</div>
      <nav className="space-x-6 text-md font-semibold">
        <Link href="/home" className="hover:underline">Home</Link>
        <Link href="/upload" className="hover:underline">Upload</Link>
        <Link href="/home/#contact" className="hover:underline">Contact</Link>
        <Link href="/register" className="hover:underline">Register</Link>
        <Link href="/login" className="hover:underline">Login</Link>
      </nav>
    </header>
  );
}
