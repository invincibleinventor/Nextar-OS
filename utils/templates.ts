import { ProjectTemplate, DEFAULT_LAYOUT } from '../types/project';

export const templates: ProjectTemplate[] = [
    {
        id: 'nextjs-fullstack',
        name: 'Next.js Full Stack',
        description: 'Full-stack app with Next.js, API routes, and Tailwind CSS. Ready for Vercel deploy.',
        icon: '▲',
        stack: ['Next.js', 'React', 'Tailwind CSS', 'TypeScript'],
        category: 'fullstack',
        startupCommand: 'npm run dev',
        featurePacksIncluded: [],
        initialLayout: { ...DEFAULT_LAYOUT, previewOpen: true },
        dependencies: {
            'next': '^14.0.0',
            'react': '^18.2.0',
            'react-dom': '^18.2.0',
        },
        devDependencies: {
            'typescript': '^5.0.0',
            '@types/react': '^18.2.0',
            '@types/node': '^20.0.0',
            'tailwindcss': '^3.4.0',
            'postcss': '^8.4.0',
            'autoprefixer': '^10.4.0',
        },
        files: {
            'package.json': JSON.stringify({
                name: 'hackathon-nextjs-app',
                version: '0.1.0',
                private: true,
                scripts: {
                    dev: 'next dev',
                    build: 'next build',
                    start: 'next start',
                },
                dependencies: { next: '^14.0.0', react: '^18.2.0', 'react-dom': '^18.2.0' },
                devDependencies: { typescript: '^5.0.0', '@types/react': '^18.2.0', '@types/node': '^20.0.0', tailwindcss: '^3.4.0', postcss: '^8.4.0', autoprefixer: '^10.4.0' },
            }, null, 2),
            'tsconfig.json': JSON.stringify({
                compilerOptions: {
                    target: 'es5', lib: ['dom', 'dom.iterable', 'esnext'], allowJs: true, skipLibCheck: true,
                    strict: true, noEmit: true, esModuleInterop: true, module: 'esnext',
                    moduleResolution: 'bundler', resolveJsonModule: true, isolatedModules: true, jsx: 'preserve',
                    incremental: true, paths: { '@/*': ['./*'] },
                },
                include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
                exclude: ['node_modules'],
            }, null, 2),
            'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};`,
            'postcss.config.js': `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`,
            'app/layout.tsx': `import './globals.css';

export const metadata = {
  title: 'Hackathon App',
  description: 'Built at a hackathon',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`,
            'app/page.tsx': `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">🚀 Hackathon Project</h1>
      <p className="text-lg text-gray-600">Start building something amazing.</p>
    </main>
  );
}`,
            'app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: system-ui, sans-serif;
}`,
            'app/api/hello/route.ts': `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello from the API!' });
}`,
            '.env.local': '# Add your environment variables here\n',
            'README.md': '# Hackathon Project\n\nBuilt with Next.js Full Stack template.\n\n## Getting Started\n\n```bash\nnpm run dev\n```\n',
        },
    },
    {
        id: 'react-vite',
        name: 'React + Vite',
        description: 'Fast React SPA with Vite, TypeScript, and Tailwind. Perfect for frontend-focused hacks.',
        icon: '⚡',
        stack: ['React', 'Vite', 'TypeScript', 'Tailwind CSS'],
        category: 'frontend',
        startupCommand: 'npm run dev',
        featurePacksIncluded: [],
        initialLayout: { ...DEFAULT_LAYOUT, previewOpen: true },
        dependencies: {
            'react': '^18.2.0',
            'react-dom': '^18.2.0',
        },
        devDependencies: {
            'vite': '^5.0.0',
            '@vitejs/plugin-react': '^4.0.0',
            'typescript': '^5.0.0',
            'tailwindcss': '^3.4.0',
        },
        files: {
            'package.json': JSON.stringify({
                name: 'hackathon-react-app',
                version: '0.1.0',
                private: true,
                type: 'module',
                scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
                dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
                devDependencies: { vite: '^5.0.0', '@vitejs/plugin-react': '^4.0.0', typescript: '^5.0.0', tailwindcss: '^3.4.0' },
            }, null, 2),
            'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});`,
            'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hackathon App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
            'src/main.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
            'src/App.tsx': `import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold mb-4">⚡ Hackathon App</h1>
      <button
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        onClick={() => setCount(c => c + 1)}
      >
        Count: {count}
      </button>
    </div>
  );
}

export default App;`,
            'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;`,
            'README.md': '# Hackathon App\n\nReact + Vite + TypeScript starter.\n\n```bash\nnpm run dev\n```\n',
        },
    },
    {
        id: 'express-api',
        name: 'Express API',
        description: 'REST API with Express, TypeScript, and CORS. Ready for any frontend to consume.',
        icon: '🔌',
        stack: ['Express', 'Node.js', 'TypeScript', 'CORS'],
        category: 'api',
        startupCommand: 'npm run dev',
        featurePacksIncluded: [],
        initialLayout: { ...DEFAULT_LAYOUT, previewOpen: false },
        dependencies: {
            'express': '^4.18.0',
            'cors': '^2.8.5',
        },
        devDependencies: {
            'typescript': '^5.0.0',
            'tsx': '^4.0.0',
            '@types/express': '^4.17.0',
            '@types/cors': '^2.8.0',
        },
        files: {
            'package.json': JSON.stringify({
                name: 'hackathon-api',
                version: '0.1.0',
                private: true,
                type: 'module',
                scripts: { dev: 'tsx watch src/index.ts', build: 'tsc', start: 'node dist/index.js' },
                dependencies: { express: '^4.18.0', cors: '^2.8.5' },
                devDependencies: { typescript: '^5.0.0', tsx: '^4.0.0', '@types/express': '^4.17.0', '@types/cors': '^2.8.0' },
            }, null, 2),
            'tsconfig.json': JSON.stringify({
                compilerOptions: { target: 'ES2020', module: 'ESNext', moduleResolution: 'bundler', outDir: './dist', strict: true, esModuleInterop: true, skipLibCheck: true },
                include: ['src/**/*'],
            }, null, 2),
            'src/index.ts': `import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Hackathon API is running!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// Add your routes here
app.get('/api/items', (req, res) => {
  res.json({ items: [] });
});

app.post('/api/items', (req, res) => {
  const { name } = req.body;
  res.status(201).json({ id: Date.now().toString(), name });
});

app.listen(PORT, () => {
  console.log(\`API running on http://localhost:\${PORT}\`);
});`,
            '.env': '# Add your environment variables\nPORT=3001\n',
            'README.md': '# Hackathon API\n\nExpress + TypeScript REST API.\n\n```bash\nnpm run dev\n```\n',
        },
    },
    {
        id: 'vanilla-html',
        name: 'Vanilla HTML/CSS/JS',
        description: 'Zero-framework starter. Pure HTML, CSS, and JavaScript. Fastest to prototype.',
        icon: '📄',
        stack: ['HTML', 'CSS', 'JavaScript'],
        category: 'static',
        startupCommand: 'npx serve .',
        featurePacksIncluded: [],
        initialLayout: { ...DEFAULT_LAYOUT, previewOpen: true, terminalOpen: false },
        dependencies: {},
        files: {
            'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hackathon Project</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="container">
    <h1>🚀 Hackathon Project</h1>
    <p>Start building something amazing.</p>
    <button id="actionBtn">Get Started</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
            'style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #0a0a0a;
  color: #ededed;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  text-align: center;
  padding: 2rem;
}

h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

p {
  font-size: 1.2rem;
  color: #888;
  margin-bottom: 2rem;
}

button {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #1d4ed8;
}`,
            'script.js': `document.getElementById('actionBtn').addEventListener('click', () => {
  alert('Let\\'s build something awesome!');
});`,
            'README.md': '# Hackathon Project\n\nVanilla HTML/CSS/JS starter.\n\nOpen `index.html` in your browser to get started.\n',
        },
    },
    {
        id: 'python-flask',
        name: 'Python Flask API',
        description: 'Lightweight Python backend with Flask. Great for ML/AI hackathon projects.',
        icon: '🐍',
        stack: ['Python', 'Flask', 'REST API'],
        category: 'api',
        startupCommand: 'python app.py',
        featurePacksIncluded: [],
        initialLayout: { ...DEFAULT_LAYOUT, previewOpen: false },
        dependencies: {},
        files: {
            'app.py': `from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({"status": "ok", "message": "Hackathon API running!"})

@app.route('/api/health')
def health():
    return jsonify({"status": "healthy"})

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()
    # Add your ML model inference here
    return jsonify({"prediction": "placeholder", "input": data})

if __name__ == '__main__':
    app.run(debug=True, port=5000)`,
            'requirements.txt': 'flask==3.0.0\nflask-cors==4.0.0\n',
            'README.md': '# Hackathon API\n\nPython Flask starter.\n\n```bash\npip install -r requirements.txt\npython app.py\n```\n',
        },
    },
    {
        id: 'hackos-app',
        name: 'HackathOS App',
        description: 'Build a custom app for HackathOS. Uses the DynamicAppRunner to run inside the desktop.',
        icon: '🖥',
        stack: ['React', 'TypeScript', 'HackathOS SDK'],
        category: 'frontend',
        startupCommand: 'Run as App',
        featurePacksIncluded: [],
        initialLayout: { ...DEFAULT_LAYOUT, previewOpen: true, terminalOpen: false },
        dependencies: {},
        files: {
            'app.tsx': `import React, { useState } from 'react';

// This file runs inside HackathOS via DynamicAppRunner.
// Use "Run as App" in the workspace toolbar to launch it.

export default function App() {
  const [items, setItems] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const addItem = () => {
    if (input.trim()) {
      setItems(prev => [...prev, input.trim()]);
      setInput('');
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, monospace', color: '#cad3f5', background: '#1e2030', minHeight: '100%' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>My HackathOS App</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Add an item..."
          style={{ flex: 1, padding: '8px 12px', background: '#24273a', border: '1px solid #363a4f', color: '#cad3f5', outline: 'none' }}
        />
        <button
          onClick={addItem}
          style={{ padding: '8px 16px', background: '#8aadf4', color: '#1e2030', border: 'none', fontWeight: 600, cursor: 'pointer' }}
        >
          Add
        </button>
      </div>
      {items.length === 0 ? (
        <p style={{ color: '#6e738d' }}>No items yet. Add one above.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((item, i) => (
            <li key={i} style={{ padding: '8px 12px', background: '#24273a', border: '1px solid #363a4f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{item}</span>
              <button
                onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', color: '#ed8796', cursor: 'pointer', fontSize: 14 }}
              >
                remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}`,
            'README.md': `# HackathOS App

A custom app that runs inside HackathOS.

## How to Use

1. Edit \`app.tsx\` with your React component
2. Click **Run as App** in the workspace toolbar
3. Your app launches as a window in HackathOS

## Tips

- Use inline styles (no CSS imports in DynamicAppRunner)
- The app runs in a sandboxed React environment
- You have access to React hooks (useState, useEffect, etc.)
- Match the HackathOS theme: bg \`#1e2030\`, text \`#cad3f5\`, accent \`#8aadf4\`
`,
        },
    },
];

export const getTemplate = (id: string): ProjectTemplate | undefined => {
    return templates.find(t => t.id === id);
};

export const getTemplatesByCategory = (category: string): ProjectTemplate[] => {
    return templates.filter(t => t.category === category);
};
