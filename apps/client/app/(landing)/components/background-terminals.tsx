import { ReactNode } from 'react';

interface TerminalWindowProps {
  children: ReactNode;
  className?: string;
}

function TerminalWindow({ children, className }: TerminalWindowProps): React.ReactElement {
  return (
    <div className={className}>
      <div className="w-full h-full bg-[#1a1b26] border border-[#2a2b3d] rounded-lg overflow-hidden shadow-2xl">
        <div className="bg-[#16161e] px-4 py-2.5 flex items-center gap-2 border-b border-[#2a2b3d]">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          <span className="ml-2 text-xs text-surface-dim">terminal - zsh</span>
        </div>
        <div className="p-4 font-mono text-[11px] leading-relaxed text-surface-dim space-y-1.5">
          {children}
        </div>
      </div>
    </div>
  );
}

interface PromptLineProps {
  directory: string;
  command: string;
  showCursor?: boolean;
}

function PromptLine({ directory, command, showCursor }: PromptLineProps): React.ReactElement {
  return (
    <div className="flex gap-2">
      <span className="text-accent-primary">thiago@macbook</span>
      <span className="text-surface-dim">{directory}</span>
      <span className="text-green-400">$</span>
      <span>{command}</span>
      {showCursor && <span className="animate-pulse">_</span>}
    </div>
  );
}

function CreateNextAppTerminal(): React.ReactElement {
  return (
    <TerminalWindow className="absolute top-20 left-[-10%] w-[550px] h-[350px] rotate-[-12deg] pointer-events-none z-0 animate-fade-up-delay-1">
      <PromptLine directory="~" command="npx create-next-app@latest my-saas" />
      <div className="text-surface-dim/70">Creating a new Next.js app in /Users/thiago/my-saas...</div>
      <div className="text-surface-dim/70 mt-2">Would you like to use TypeScript? Yes</div>
      <div className="text-surface-dim/70">Would you like to use ESLint? Yes</div>
      <div className="text-surface-dim/70">Would you like to use Tailwind CSS? Yes</div>
      <div className="mt-2 text-cyan-400">Installing dependencies:</div>
      <div className="text-surface-dim/70">- react, react-dom, next</div>
      <div className="text-surface-dim/70">- typescript, @types/node, @types/react</div>
      <div className="mt-2 text-green-400">Installation complete</div>
      <PromptLine directory="~/my-saas" command="" showCursor />
    </TerminalWindow>
  );
}

function DockerComposeTerminal(): React.ReactElement {
  return (
    <TerminalWindow className="absolute bottom-20 right-[-10%] w-[550px] h-[350px] rotate-[12deg] pointer-events-none z-0 animate-fade-up-delay-3">
      <PromptLine directory="~/projects/time2ship" command="docker-compose up" />
      <div className="text-purple-400">Creating network "time2ship_default" with the default driver</div>
      <div className="text-cyan-400">Creating time2ship_postgres_1 ... done</div>
      <div className="text-cyan-400">Creating time2ship_redis_1    ... done</div>
      <div className="text-cyan-400">Creating time2ship_api_1      ... done</div>
      <div className="text-cyan-400">Creating time2ship_client_1   ... done</div>
      <div className="mt-2 text-green-400">api_1     | Server listening on http://localhost:4000</div>
      <div className="text-green-400">client_1  | Next.js 16.1.3</div>
      <div className="text-green-400">client_1  | - Local:   http://localhost:3000</div>
      <div className="text-yellow-400">postgres_1| database system is ready to accept connections</div>
      <div className="flex items-center gap-2 mt-2">
        <span className="animate-pulse text-green-400">*</span>
        <span className="text-surface-dim/70">All services running</span>
      </div>
    </TerminalWindow>
  );
}

export function BackgroundTerminals(): React.ReactElement {
  return (
    <>
      <CreateNextAppTerminal />
      <DockerComposeTerminal />
    </>
  );
}
