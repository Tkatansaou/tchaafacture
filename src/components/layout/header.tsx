import { Plus, Search, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="flex h-20 items-center justify-between border-b bg-background px-8">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="h-10 w-64 rounded-full border bg-muted/50 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <Button className="rounded-full px-6 shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground hover:cursor-pointer">
          <Bell className="h-5 w-5" />
        </div>
        <div className="h-10 w-10 overflow-hidden rounded-full border hover:cursor-pointer">
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
