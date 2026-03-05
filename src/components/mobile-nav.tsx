'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  Sparkles,
} from 'lucide-react'

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/questoes', label: 'Questoes', icon: BookOpen },
  { href: '/simulado', label: 'Simulado', icon: ClipboardList },
  { href: '/revisao', label: 'Revisao', icon: RotateCcw },
]

export function MobileNav({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 lg:hidden">
      <div className="border-b border-white/60 bg-white/74 px-4 py-3 shadow-[0_18px_60px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Performance Lab</p>
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">ENAMED Study</h1>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-2xl">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-80 border-l border-white/60 bg-white/82 p-4 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/86">
                <div className="rounded-[1.75rem] border border-white/65 bg-[linear-gradient(145deg,rgba(131,24,67,0.98),rgba(236,72,153,0.88))] p-5 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.32em] text-white/64">Performance Lab</p>
                      <h2 className="mt-2 text-xl font-semibold">ENAMED Study</h2>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/78">
                    Estudo guiado por performance, revisao e simulados com contexto.
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-3xl border border-white/60 bg-white/72 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#be185d,#f472b6)] text-sm font-semibold text-white">
                    {(user.user_metadata?.full_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{user.user_metadata?.full_name || 'Usuario'}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <nav className="mt-5 space-y-2">
                  {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all',
                          isActive
                            ? 'border-[#db2777]/18 bg-[linear-gradient(135deg,rgba(236,72,153,0.14),rgba(249,168,212,0.1))] text-foreground'
                            : 'border-transparent hover:border-border/70 hover:bg-white/72 dark:hover:bg-white/5'
                        )}
                      >
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', isActive ? 'bg-[#db2777] text-white' : 'bg-background/70 text-muted-foreground')}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>

                <Button variant="ghost" size="sm" className="mt-6 w-full justify-start rounded-xl" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
