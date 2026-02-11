import { FeaturePack } from '../types/project';

export const featurePacks: FeaturePack[] = [
    {
        id: 'auth-pack',
        name: 'Authentication',
        description: 'Add user authentication with JWT, login/signup forms, and session management.',
        icon: '🔐',
        injectFiles: {
            'lib/auth.ts': `import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function signToken(payload: object): string {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  // In production, use bcrypt
  return Buffer.from(password).toString('base64');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}`,
            'components/LoginForm.tsx': `'use client';
import { useState } from 'react';

export default function LoginForm({ onLogin }: { onLogin: (email: string, password: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onLogin(email, password); }} className="space-y-4 max-w-sm mx-auto p-6">
      <h2 className="text-xl font-bold">Login</h2>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full p-2 border rounded" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full p-2 border rounded" />
      <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700">Login</button>
    </form>
  );
}`,
        },
        injectDependencies: ['jsonwebtoken', 'bcryptjs'],
        injectEnvVars: { JWT_SECRET: 'change-me-in-production' },
    },
    {
        id: 'stripe-pack',
        name: 'Stripe Payments',
        description: 'Add Stripe checkout, subscription handling, and webhook processing.',
        icon: '💳',
        injectFiles: {
            'lib/stripe.ts': `import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function createCheckoutSession(priceId: string, successUrl: string, cancelUrl: string) {
  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}`,
            'app/api/webhook/route.ts': `import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  try {
    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful payment
        console.log('Payment successful:', event.data.object);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}`,
        },
        injectDependencies: ['stripe'],
        injectEnvVars: {
            STRIPE_SECRET_KEY: 'sk_test_...',
            STRIPE_WEBHOOK_SECRET: 'whsec_...',
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_...',
        },
    },
    {
        id: 'chat-pack',
        name: 'Real-time Chat',
        description: 'Add real-time messaging with WebSocket support and a chat UI component.',
        icon: '💬',
        injectFiles: {
            'components/ChatWidget.tsx': `'use client';
import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
}

export default function ChatWidget({ roomId, userId }: { roomId: string; userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: userId,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
    setInput('');
    // TODO: Send via WebSocket
  };

  return (
    <div className="flex flex-col h-96 border rounded-lg">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map(msg => (
          <div key={msg.id} className={\`p-2 rounded-lg max-w-[80%] \${msg.sender === userId ? 'ml-auto bg-blue-600 text-white' : 'bg-gray-100'}\`}>
            <p className="text-sm">{msg.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-2 border-t flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }} placeholder="Type a message..." className="flex-1 p-2 border rounded" />
        <button onClick={sendMessage} className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
      </div>
    </div>
  );
}`,
        },
        injectDependencies: ['socket.io-client'],
        injectEnvVars: { NEXT_PUBLIC_WS_URL: 'ws://localhost:3001' },
    },
    {
        id: 'ai-pack',
        name: 'AI Integration',
        description: 'Add OpenAI/Anthropic API integration with a ready-to-use AI helper.',
        icon: '🤖',
        injectFiles: {
            'lib/ai.ts': `const API_KEY = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

export async function generateText(prompt: string, model = 'gpt-4') {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${API_KEY}\`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function generateEmbedding(text: string) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${API_KEY}\`,
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  });

  const data = await res.json();
  return data.data?.[0]?.embedding || [];
}`,
            'app/api/ai/route.ts': `import { generateText } from '@/lib/ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
  }

  try {
    const result = await generateText(prompt);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
  }
}`,
        },
        injectDependencies: ['openai'],
        injectEnvVars: { OPENAI_API_KEY: 'sk-...' },
    },
];

export const getFeaturePack = (id: string): FeaturePack | undefined => {
    return featurePacks.find(p => p.id === id);
};
