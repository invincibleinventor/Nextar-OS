export interface Project {
    id: string;
    title: string;
    description: string;
    techStack: string[];
    link: string;
    github?: string;
    icon?: string; 
}

export const portfolioData = {
    personal: {
        name: "Balasubramanian TBR",
        alias: "invincibleinventor",
        role: "Web Frontend Developer",
        location: "India",
        bio: "I'm a passionate geek from India that loves to tinker with frontend tech. An ardent lover of Linux and FOSS principles. Self-taught web dev, specializing in React, Next.js, and Tailwind CSS.",
        avatar: "/user.jpg", 
        email: "contact@example.com", 
        socials: {
            github: "https://github.com/invincibleinventor",
            website: "https://baladev.vercel.app/",
            twitter: "https://twitter.com/invincibleinventor" 
        }
    },
    skills: [
        "React", "Next.js", "Tailwind CSS", "TypeScript", "Linux (Arch)", "Git", "Docker", "Vim/Neovim"
    ],
    projects: [
        {
            id: "macos-web",
            title: "MacOS Web",
            description: "A faithful clone of MacOS web desktop experience built with React and Framer Motion.",
            techStack: ["React", "TypeScript", "Tailwind", "Framer Motion"],
            link: "https://github.com/invincibleinventor/macos-web", 
            github: "https://github.com/invincibleinventor/macos-web",
            icon: "🖥️"
        },
        {
            id: "bala",
            title: "bala",
            description: "Personal project repository.",
            techStack: ["TypeScript"],
            link: "https://github.com/invincibleinventor/bala",
            github: "https://github.com/invincibleinventor/bala",
            icon: "⚡"
        },
        {
            id: "gold",
            title: "gold",
            description: "A golden project.",
            techStack: ["TypeScript"],
            link: "https://github.com/invincibleinventor/gold",
            github: "https://github.com/invincibleinventor/gold",
            icon: "🪙"
        },
        {
            id: "portfolio-v1",
            title: "Old Portfolio",
            description: "Previous portfolio site with VS Code theme.",
            techStack: ["CSS", "HTML"],
            link: "https://baladev.vercel.app",
            github: "https://github.com/invincibleinventor/portfolio",
            icon: "🎨"
        },
        {
            id: "wp",
            title: "wp",
            description: "Wallpaper / Web Project.",
            techStack: [],
            link: "https://github.com/invincibleinventor/wp",
            github: "https://github.com/invincibleinventor/wp",
            icon: "🖼️"
        }
    ],
    experience: [
        {
            id: 1,
            role: "Frontend Developer",
            company: "Self-Employed",
            period: "2023 - Present",
            description: "Building scalable web applications and experimenting with UI designs."
        }
    ]
};
