import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center space-y-5">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Mail className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Vérifiez votre e-mail</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Un lien de confirmation a été envoyé à votre adresse e-mail. Cliquez dessus pour activer votre compte.
        </p>
      </div>

      <div className="rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        Vous ne voyez pas l&apos;e-mail ? Attendez quelques minutes et vérifiez vos <strong>spams</strong>.
      </div>

      <Button asChild variant="outline" className="rounded-full px-6">
        <Link href="/auth/login">Retour à la connexion</Link>
      </Button>
    </div>
  )
}
