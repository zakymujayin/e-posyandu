"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Loader2, Landmark, CheckCircle, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      setError(result.error)
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex bg-background transition-all duration-300">
      {/* Left side: branding/illustration panel (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tr from-primary via-primary/95 to-accent/90 text-primary-foreground p-12 flex-col justify-between relative overflow-hidden select-none">
        {/* Soft decorative background patterns */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
        <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Branding header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="size-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-bold border border-white/10 shadow-lg shadow-black/5">
            EP
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-none">
              E-Posyandu
            </h1>
            <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wider mt-1 leading-none">
              Kabupaten Lebak
            </p>
          </div>
        </div>

        {/* Informative center content */}
        <div className="max-w-md relative z-10">
          <Landmark className="size-12 mb-6 text-accent" />
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight mb-4">
            Layanan Pengajuan & Verifikasi E-Posyandu
          </h2>
          <p className="text-sm text-white/80 leading-relaxed">
            Portal terintegrasi Dinas Pemberdayaan Masyarakat dan Desa (DPMD) Kabupaten Lebak untuk kader posyandu, perangkat desa, OPD, dan pimpinan daerah.
          </p>
          
          <div className="mt-8 flex flex-col gap-3">
            {[
              "Persetujuan pengajuan data posyandu real-time",
              "Pemantauan status pengajuan transparan",
              "Pengarsipan master data wilayah terintegrasi",
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs text-white/90">
                <CheckCircle className="size-4 text-accent shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-white/60 relative z-10">
          &copy; {new Date().getFullYear()} DPMD Kab. Lebak. All rights reserved.
        </div>
      </div>

      {/* Right side: Login form card */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md border border-border bg-card shadow-2xl relative">
          {/* Accent top boundary bar for premium look */}
          <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-primary to-accent" />

          <CardHeader className="space-y-2 text-center pt-8">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground select-none">
              Selamat Datang
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground select-none">
              Silakan masukkan email dan kata sandi Anda untuk mengakses layanan
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-xs px-4 py-3 rounded-xl border border-destructive/20 flex items-start gap-2.5 animate-in fade-in duration-300">
                  <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">
                  Email Layanan
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@domain.com"
                  autoComplete="email"
                  className="rounded-xl border-border bg-background focus:ring-primary focus:border-primary"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs font-medium text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground">
                  Kata Sandi
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="rounded-xl border-border bg-background focus:ring-primary focus:border-primary pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-destructive mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full min-h-[44px] rounded-xl font-bold tracking-tight shadow-md hover:shadow-lg transition-all duration-300 mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Masuk ke Dashboard"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
