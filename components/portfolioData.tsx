
import { FaReact, FaPython, FaHtml5, FaCss3Alt, FaLinux, FaGitAlt, FaJava } from 'react-icons/fa';
import { SiNextdotjs, SiTailwindcss, SiTypescript, SiSupabase, SiFirebase, SiMongodb, SiGnubash, SiCplusplus, SiWordpress } from 'react-icons/si';

export const portfoliodata = {
    personal: {
        name: "Bala TBR",
        role: "Second Year Comp Sci Student - Next.JS Full Stack Developer",
        bio: "I'm a passionate geek from India studying second year computer science engineering that loves to tinker with frontend technologies. I'm an ardent lover of Linux and FOSS principles. Self-taught web developer, specializing in Next.js and TailwindCSS. I use Arch Linux btw.",
        location: "India",
        username: "invincibleinventor",
        email: "invincibleinventor@gmail.com",
        socials: {
            github: "https://github.com/invincibleinventor",
            threads: "https://threads.com/balatbr",
            linkedin: "https://www.linkedin.com/in/balasubramaniantbr/"
        }
    },
    projects: [
        {
            title: "Falar",
            type: "Open Source",
            date: 2022,
            desc: "A content publishing platform for sharing written works publicly.",
            stack: ["Next.js", "Supabase", "TailwindCSS", "Amazon S3"],
            link: "https://falarapp.vercel.app",
            github: "https://github.com/invincibleinventor/falar",
            icon: <SiNextdotjs className="text-black dark:text-white" />
        },
        {
            title: "MacOS-Next",
            date: 2023,
            type: "Open Source",
            desc: "A simulation of macOS Sonoma UI in the web. Features dock, window management, and animations.",
            stack: ["Next.js", "TailwindCSS"],
            link: "https://baladev.in",
            github: "https://github.com/invincibleinventor/macos",
            icon: <FaReact className="text-blue-500" />
        },
        {
            title: "VSCode Portfolio",
            date: 2022,
            type: "Open Source",
            desc: "A portfolio website themed like Visual Studio Code.",
            stack: ["Next.js", "TailwindCSS", "TypeScript"],
            link: "https://baladev.vercel.app",
            github: "https://github.com/invincibleinventor/vscode-portfolio",
            icon: <SiTypescript className="text-blue-600" />
        },
        {
            title: "W11Web",
            date: 2021,
            type: "Open Source",
            desc: "Windows 11 desktop simulation using Vanilla CSS.",
            stack: ["TypeScript", "CSS", "Webpack"],
            link: "https://w11web.vercel.app",
            github: "https://github.com/invincibleinventor/w11web",
            icon: <FaCss3Alt className="text-blue-500" />
        },
        {
            title: "Filmhood Journal",
            date: 2022,
            type: "Closed Source",
            desc: "A wordpress blog for an aspiring filmmaker.",
            stack: ["Wordpress", "Analytics"],
            link: "https://filmhoodjournal.com",
            github: "#",
            icon: <SiWordpress className="text-blue-900" />
        },
        {
            title: "Calistnx",
            date: 2023,
            type: "Closed Source",
            desc: "E-commerce platform for fitness courses.",
            stack: ["Wordpress", "WooCommerce", "Stripe"],
            link: "https://calistnx.com",
            github: "#",
            icon: <SiWordpress className="text-blue-900" />
        },
        {
            title: "TTS Internal Tools",
            date: 2022,
            type: "Closed Source",
            desc: "Management system for Golden Jubilee fests.",
            stack: ["Qwik JS", "Supabase", "TailwindCSS"],
            link: "https://ttsgold.vercel.app",
            github: "https://github.com/invincibleinventor/gold",
            icon: <SiSupabase className="text-green-500" />
        },
        {
            title: "SquadSearch",
            date: 2025,
            type: "Open Source",
            desc: "A matchmaking platform for teams and TLs to find and assemble their perfect squad for hackathons or internal hirings.",
            stack: ["Next.js", "Supabase", "GSAP", "TailwindCSS", "LLMs", "FastAPI", "SMTP", "Python"],
            link: "https://squadsearch.vercel.app",
            github: "https://github.com/invincibleinventor/squadsearch",
            icon: <SiNextdotjs className="text-black dark:text-white" />
        },
        {
            title: "Sastracker",
            date: 2025,
            type: "Open Source",
            desc: "A Modern PyQDB for SASTRA Students",
            stack: ["Next.JS", "Supabase", "LLMs", "TailwindCSS", "FastAPI"],
            link: "https://sastracker.vercel.app",
            github: "https://github.com/invincibleinventor/sastracker",
            icon: <FaReact className="text-blue-500" />
        },
        {
            title: "EzyPing",
            date: 2025,
            type: "Open Source",
            desc: "A lightweight uptime monitor for tracking website status and to quicky notify subscribed users of website changes through SMTP.",
            stack: ["Next.js", "TypeScript", "Node.js", "CRON"],
            link: "https://ezyping.vercel.app",
            github: "https://github.com/invincibleinventor/ezyping",
            icon: <SiTypescript className="text-blue-600" />
        }
    ],
    skills: [
        "HTML/CSS (Fluent)", "TailwindCSS (Fluent)", "React/Next.js (Fluent)", "TypeScript (Fluent)",
        "Node.js/Express (Fluent)", "Python (Fluent)", "C/C++ (Decent)", "Linux (Arch, Ubuntu)",
        "Git", "Docker", "Figma", "Firebase/Supabase"
    ]
};

export interface PortfolioData {
    personal: {
        name: string;
        role: string;
        bio: string;
        location: string;
        email: string;
        socials: {
            github: string;
            threads: string;
            linkedin: string;
        };
    };
    projects: Array<{
        title: string;
        date: number;
        desc: string;
        stack: string[];
        link: string;
        github: string;
        icon: React.ReactNode;
    }>;
    skills: string[];
}
