import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-4 py-4 bg-accent shadow-md">
      <div className="flex items-center space-x-2">
        <Image src="/Logo.png" alt="AskaFlow logo" width={32} height={32} />
        <span 
            className="font-semibold text-2xl text-background mx-2 hover:scale-105">AskaFlow</span>
      </div>
      <a
        href="https://docs.n8n.io/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-md text-background hover:underline"
      >
        n8n Docs
      </a>
    </nav>
  );
}
