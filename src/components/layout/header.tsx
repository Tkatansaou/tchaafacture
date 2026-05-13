'use client'

import { Plus, Search, Bell, Menu, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:h-20 md:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="h-10 w-64 rounded-full border bg-muted/50 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Button className="rounded-full px-3 shadow-sm md:px-6" asChild>
          <Link href="/invoices/new">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Nouvelle facture</span>
          </Link>
        </Button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Bell className="h-4 w-4 md:h-5 md:w-5" />
        </div>

        <button
          onClick={handleSignOut}
          title="Se déconnecter"
          className="flex h-9 w-9 items-center justify-center rounded-full border text-muted-foreground hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
