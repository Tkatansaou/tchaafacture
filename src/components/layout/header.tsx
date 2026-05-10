import { Plus, Search, Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:h-20 md:px-8">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search — desktop only */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="h-10 w-64 rounded-full border bg-muted/50 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Create Invoice — icon on mobile, full button on desktop */}
        <Button className="rounded-full px-3 shadow-sm md:px-6">
          <Plus className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Nouvelle facture</span>
        </Button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground hover:cursor-pointer">
          <Bell className="h-4 w-4 md:h-5 md:w-5" />
        </div>

        <div className="h-9 w-9 overflow-hidden rounded-full border hover:cursor-pointer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            alt="Profile"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </header>
  )
}
