import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
  return (
    <div className="bg-card border border-border rounded-xl p-8 shadow-sm text-center">
      <div className="text-4xl mb-4">📧</div>
      <h2 className="text-xl font-semibold text-foreground mb-2">Vérifiez votre e-mail</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Un lien de confirmation a été envoyé à votre adresse e-mail. Cliquez dessus pour activer
        votre compte.
      </p>
      <Button asChild variant="outline">
        <Link href="/auth/login">Retour à la connexion</Link>
      </Button>
    </div>
  )
}
