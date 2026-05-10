import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: string
  change: string
  changePositive: boolean
  icon: React.ReactNode
  iconClassName?: string
}

export function KpiCard({ title, value, change, changePositive, icon, iconClassName }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-xl font-bold tracking-tight leading-tight md:text-2xl">{value}</p>
          </div>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", iconClassName ?? "bg-primary/10 text-primary")}>
            {icon}
          </div>
        </div>
        <p className={cn("mt-3 text-xs font-medium", changePositive ? "text-green-600" : "text-red-500")}>
          {change}
        </p>
      </CardContent>
    </Card>
  )
}
