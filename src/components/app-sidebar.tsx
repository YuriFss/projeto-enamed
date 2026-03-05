'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  RotateCcw,
  Sparkles,
} from 'lucide-react'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', description: 'Visao geral e foco', icon: LayoutDashboard },
  { href: '/questoes', label: 'Questoes', description: 'Banco filtrado e continuo', icon: BookOpen },
  { href: '/simulado', label: 'Simulado', description: 'Blocos e prova cronometrada', icon: ClipboardList },
  { href: '/revisao', label: 'Revisao', description: 'Reforco dos pontos fracos', icon: RotateCcw },
]

export function AppSidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
      <div className="flex h-full flex-col border-r border-white/60 bg-white/72 px-5 py-6 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="rounded-[2rem] border border-white/65 bg-[linear-gradient(145deg,rgba(131,24,67,0.98),rgba(236,72,153,0.88))] p-5 text-white shadow-[0_30px_70px_-40px_rgba(219,39,119,0.65)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/65">Performance Lab</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">ENAMED Study</h1>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 backdrop-blur-sm">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/78">
            Uma rotina de estudo guiada por dados, revisao inteligente e leitura rapida de desempenho.
          </p>
        </div>

        <div className="mt-6">
          <p className="px-2 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Navegacao
          </p>
          <nav className="mt-3 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex items-start gap-3 rounded-2xl border px-4 py-3 transition-all',
                    isActive
                      ? 'border-[#db2777]/18 bg-[linear-gradient(135deg,rgba(236,72,153,0.14),rgba(249,168,212,0.1))] shadow-[0_18px_45px_-35px_rgba(219,39,119,0.45)]'
                      : 'border-transparent hover:border-border/70 hover:bg-white/65 dark:hover:bg-white/5'
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl transition-colors',
                      isActive
                        ? 'bg-[#db2777] text-white'
                        : 'bg-background/70 text-muted-foreground group-hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.description}</p>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto rounded-[1.75rem] border border-white/65 bg-white/78 p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-md dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#be185d,#f472b6)] text-sm font-semibold text-white shadow-lg">
              {(user.user_metadata?.full_name?.[0] || user.email?.[0] || '?').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.user_metadata?.full_name || 'Usuario'}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <ThemeToggle />
          </div>

          <div className="mt-4 rounded-2xl border border-border/70 bg-background/80 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sessao</p>
            <p className="mt-1 text-sm leading-6 text-foreground">
              Organize estudo, revisao e simulado a partir de um unico painel.
            </p>
          </div>

          <Button variant="ghost" size="sm" className="mt-4 w-full justify-start rounded-xl" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </aside>
  )
}
