"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { AuthService } from "@/services/auth-service"
import { ApiError } from "@/lib/api-client"

const loginSchema = z.object({
    email: z.string().min(1, "email is required"),
    password: z.string().min(1, "Password is required"),
    rememberMe: z.boolean(),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
            rememberMe: false,
        },
    })

    const handleLogin = async (data: LoginFormValues) => {
        setIsLoading(true)
        setError(null)

        try {
            console.log("Attempting login for user:", data.email)
            await AuthService.login({
                email: data.email,
                password: data.password
            })

            console.log("Login successful, redirecting to dashboard...")
            // Small delay to ensure cookies are processed by the browser before navigation
            // though router.push should handle it, this adds extra safety in some environments
            router.push("/dashboard")

            // Allow navigation to start before triggering a refresh if needed
            // router.refresh() is removed here as it can sometimes interrupt push()
        } catch (err) {
            console.error("Login component caught error:", err)
            if (err instanceof ApiError) {
                setError(err.message)
            } else {
                setError("An unexpected error occurred. Please try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative h-dvh w-full flex items-center justify-center p-4 md:p-8 overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/loginbg.webp"
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
            </div>

            {/* Main Container */}
            <Card className="relative z-10 w-full max-w-[1200px] bg-[#f8f9fa] rounded-[40px] overflow-hidden flex flex-col md:flex-row shadow-2xl border border-white/20 h-fit min-h-[500px] md:min-h-[600px] max-h-[92vh] md:max-h-[800px] p-0 border-none">
                {/* Left Side: Form */}
                <CardContent className="w-full md:w-[55%] p-8 md:p-16 flex flex-col justify-center items-center overflow-y-auto">
                    <div className="w-full max-w-[440px]">
                        {/* Logo Section */}
                        <div className="flex items-center gap-3 mb-12 group w-fit">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black tracking-tight text-[#1a1a1a]">
                                        GOEL ENTERPRISES.
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Welcome Text */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Welcome Back!</h1>
                            <p className="text-muted-foreground font-medium">We Are Happy To See You Again</p>
                        </div>

                        {/* Form */}
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="text"
                                                    placeholder="Enter your email"
                                                    leftIcon={<Mail className="size-5" />}
                                                    className="bg-white border-gray-200 rounded-lg"
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1">
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Enter your password"
                                                    leftIcon={<Lock className="size-5" />}
                                                    rightIcon={
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="flex items-center justify-center hover:text-primary transition-colors focus:outline-none"
                                                            disabled={isLoading}
                                                        >
                                                            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                                        </button>
                                                    }
                                                    className="bg-white border-gray-200 rounded-lg"
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {error && (
                                    <p className="text-destructive text-sm font-medium px-1 animate-in fade-in slide-in-from-top-1">
                                        {error}
                                    </p>
                                )}

                                <FormField
                                    control={form.control}
                                    name="rememberMe"
                                    render={({ field }) => (
                                        <div className="flex items-center justify-between py-2">
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        disabled={isLoading}
                                                    />
                                                </FormControl>
                                                <FormLabel className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-[#1a1a1a] transition-colors">
                                                    Remember me
                                                </FormLabel>
                                            </FormItem>
                                        </div>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Logging in...
                                        </>
                                    ) : (
                                        "Login"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </div>
                </CardContent>

                {/* Right Side: Visual */}
                <div className="hidden md:block w-[45%] relative group">
                    <div className="absolute inset-4 rounded-[32px] overflow-hidden">
                        <Image
                            src="/login-side.webp"
                            alt="Background pattern"
                            fill
                            className="object-cover transition-transform duration-700"
                            priority
                        />

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

                        {/* Bottom Glassmorphism Card */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[85%] bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl text-center shadow-2xl">
                            <p className="text-[10px] text-white/80 leading-relaxed font-medium">
                                &copy; {new Date().getFullYear()} GOEL ENTERPRISES. All rights reserved.
                                <br />
                                Unauthorized use or reproduction of any content on this platform is prohibited.

                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}