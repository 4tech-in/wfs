import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function NotFound() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#f8fafc] px-4 text-center">

      <Image src="/404.webp" alt="Rocket Sales Logo" width={160} height={40} className="object-contain" priority />


      <h1 className="mb-2 text-6xl font-black tracking-tight text-[#1e2330]"></h1>
      <h2 className="mb-4 text-2xl font-bold text-slate-900">Page Not Found</h2>
      <p className="mb-8 max-w-md text-balance text-slate-500">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="default" size="lg" className="bg-[#3CC3A3] h-12 px-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="mt-16 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
        GOEL ENTERPRISES.
      </div>
    </div>
  )
}
