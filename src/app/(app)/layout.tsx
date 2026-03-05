import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/get-user'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileNav } from '@/components/mobile-nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_top_left,rgba(244,114,182,0.18),transparent_42%),radial-gradient(circle_at_top_right,rgba(249,168,212,0.18),transparent_36%)]" />
        <div className="absolute bottom-0 left-[-6rem] h-72 w-72 rounded-full bg-[#f472b6]/12 blur-3xl" />
        <div className="absolute right-[-5rem] top-[18rem] h-80 w-80 rounded-full bg-[#f9a8d4]/14 blur-3xl" />
      </div>
      <AppSidebar user={user} />
      <MobileNav user={user} />
      <main className="lg:pl-80">
        <div className="mx-auto max-w-[1500px] px-4 pb-8 pt-20 sm:px-6 lg:px-8 lg:pt-10">
          {children}
        </div>
      </main>
    </div>
  )
}
