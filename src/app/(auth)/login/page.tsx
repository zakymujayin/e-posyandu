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
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
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
      username: data.username,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      const errorMap: Record<string, string> = {
        CredentialsSignin: "Username atau kata sandi tidak valid. Pastikan data login Anda sudah benar.",
        Configuration: "Terjadi kesalahan sistem. Silakan hubungi administrator.",
        AccessDenied: "Akses ditolak. Akun Anda mungkin tidak aktif.",
      }
      setError(errorMap[result.error] ?? "Terjadi kesalahan saat login. Silakan coba lagi.")
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex bg-slate-50 transition-all duration-300">
      {/* Left side: branding/illustration panel (desktop only) */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between relative overflow-hidden p-12"
        style={{
          background: "linear-gradient(135deg, oklch(0.28 0.14 265) 0%, oklch(0.36 0.17 255) 30%, oklch(0.44 0.18 245) 60%, oklch(0.38 0.16 270) 100%)"
        }}
      >
        {/* Mesh gradient overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 80% 10%, oklch(0.60 0.18 220 / 0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 70% at 10% 90%, oklch(0.30 0.20 280 / 0.22) 0%, transparent 60%)"
          }}
        />

        {/* Subtle grid texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />

        {/* Decorative glowing orbs */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, oklch(0.60 0.20 215 / 0.20) 0%, transparent 70%)" }}
        />
        <div className="absolute bottom-0 -left-24 w-[380px] h-[380px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, oklch(0.42 0.22 275 / 0.25) 0%, transparent 70%)" }}
        />
        <div className="absolute top-1/2 left-1/3 w-[200px] h-[200px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, oklch(0.65 0.16 230 / 0.10) 0%, transparent 70%)" }}
        />

        {/* Branding header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="size-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center font-black border border-white/20 shadow-lg text-white text-sm tracking-wide">
            EP
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-none">
              E-Posyandu
            </h1>
            <p className="text-[10px] font-semibold text-blue-200/80 uppercase tracking-widest mt-1 leading-none">
              Kabupaten Lebak
            </p>
          </div>
        </div>

        {/* Informative center content */}
        <div className="max-w-md relative z-10">
          <div className="size-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mb-6 shadow-lg backdrop-blur-sm">
            <Landmark className="size-7 text-blue-200" />
          </div>
          <h2 className="text-[28px] font-extrabold tracking-tight text-white leading-tight mb-4">
            Layanan Pengajuan &amp; Verifikasi E-Posyandu
          </h2>
          <p className="text-[14px] text-blue-100/75 leading-relaxed">
            Portal terintegrasi Dinas Pemberdayaan Masyarakat dan Desa (DPMD) Kabupaten Lebak untuk kader posyandu, perangkat desa, OPD, dan pimpinan daerah.
          </p>

          <div className="mt-8 flex flex-col gap-3.5">
            {[
              "Persetujuan pengajuan data posyandu real-time",
              "Pemantauan status pengajuan transparan",
              "Pengarsipan master data wilayah terintegrasi",
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-3 text-[13px] text-white/85">
                <div className="size-5 rounded-full bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle className="size-3 text-blue-200" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[11px] text-blue-200/50 relative z-10 font-medium">
          &copy; {new Date().getFullYear()} DPMD Kab. Lebak. Hak cipta dilindungi.
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-slate-50 relative">
        {/* Subtle background blobs on the right panel */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, oklch(0.44 0.13 245 / 0.04) 0%, transparent 70%)" }}
        />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, oklch(0.44 0.13 245 / 0.03) 0%, transparent 70%)" }}
        />

        <Card className="w-full max-w-md border border-slate-200/80 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)] relative">
          {/* Accent top bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[inherit]"
            style={{ background: "linear-gradient(90deg, oklch(0.36 0.17 255), oklch(0.44 0.18 245), oklch(0.55 0.15 230))" }}
          />

          <CardHeader className="space-y-2 text-center pt-8">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Selamat Datang
            </CardTitle>
            <CardDescription className="text-[13px] text-muted-foreground">
              Silakan masukkan email dan kata sandi Anda untuk mengakses layanan
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-3 animate-in fade-in duration-300">
                  <ShieldAlert className="size-4" />
                  <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-[13px] font-semibold text-slate-700">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="masukkan username Anda"
                  autoComplete="username"
                  className="rounded-xl border-slate-200 bg-white focus:ring-primary focus:border-primary"
                  {...register("username")}
                />
                {errors.username && (
                  <p className="text-xs font-medium text-destructive mt-1">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[13px] font-semibold text-slate-700">
                  Kata Sandi
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="rounded-xl border-slate-200 bg-white focus:ring-primary focus:border-primary pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
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
