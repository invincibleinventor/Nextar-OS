
import { FaReact, FaPython, FaHtml5, FaCss3Alt, FaLinux, FaGitAlt, FaJava } from 'react-icons/fa';
import { SiNextdotjs, SiTailwindcss, SiTypescript, SiSupabase, SiFirebase, SiMongodb, SiGnubash, SiCplusplus, SiWordpress } from 'react-icons/si';

export const portfolioData = {
    personal: {
        name: "Bala.tbr",
        role: "Frontend Developer & Student",
        bio: "I'm a passionate geek from India that loves to tinker with frontend technologies. I'm an ardent lover of Linux and FOSS principles. Self-taught web developer, specializing in Next.js and TailwindCSS. I use Arch Linux btw.",
        location: "India",
        email: "contact@baladev.in",
        socials: {
            github: "https://github.com/balaharis",
            twitter: "https://twitter.com/balaharis"
        }
    },
    projects: [
        {
            title: "Falar",
            desc: "A content publishing platform for sharing written works publicly.",
            stack: ["Next.js", "Supabase", "TailwindCSS", "Amazon S3"],
            link: "https://falarapp.vercel.app",
            icon: <SiNextdotjs className="text-black dark:text-white" />
        },
        {
            title: "MacOS Next",
            desc: "A simulation of macOS Sonoma UI in the web. Features dock, window management, and animations.",
            stack: ["Next.js", "TailwindCSS"],
            link: "https://baladev.in",
            icon: <FaReact className="text-blue-500" />
        },
        {
            title: "VSCode Portfolio",
            desc: "A portfolio website themed like Visual Studio Code.",
            stack: ["Next.js", "TailwindCSS", "TypeScript"],
            link: "https://baladev.in",
            icon: <SiTypescript className="text-blue-600" />
        },
        {
            title: "W11Web",
            desc: "Windows 11 desktop simulation using Vanilla CSS.",
            stack: ["TypeScript", "CSS", "Webpack"],
            link: "https://w11web.vercel.app",
            icon: <FaCss3Alt className="text-blue-500" />
        },
        {
            title: "Filmhood Journal",
            desc: "A wordpress blog for an aspiring filmmaker.",
            stack: ["Wordpress", "Analytics"],
            link: "https://filmhoodjournal.com",
            icon: <SiWordpress className="text-blue-900" />
        },
        {
            title: "Calistnx",
            desc: "E-commerce platform for fitness courses.",
            stack: ["Wordpress", "WooCommerce", "Stripe"],
            link: "https://calistnx.com",
            icon: <SiWordpress className="text-blue-900" />
        },
        {
            title: "TTS Internal Tools",
            desc: "Management system for Golden Jubilee fests.",
            stack: ["Qwik JS", "Supabase", "TailwindCSS"],
            link: "#",
            icon: <SiSupabase className="text-green-500" />
        }
    ],
    skills: [
        "HTML/CSS (Fluent)", "TailwindCSS (Fluent)", "React/Next.js (Fluent)", "TypeScript (Fluent)",
        "Node.js/Express (Fluent)", "Python (Fluent)", "C/C++ (Decent)", "Linux (Arch, Ubuntu)",
        "Git", "Docker", "Figma", "Firebase/Supabase"
    ]
};
