'use client'

import { createSupabaseClient } from '@/lib/supabase'
import { captureGeolocation } from '@/lib/geolocation'
import { trpc } from '@/lib/trpc'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Eye, EyeOff, Loader2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const schema = z.object({
  player_fname: z.string().min(1, 'First name is required'),
  player_lname: z.string().min(1, 'Last name is required'),
  player_dob: z.string().min(1, 'Date of birth is required'),
  player_gender: z.enum(['Male', 'Female', 'Non-binary', 'Prefer not to say'], {
    required_error: 'Please select a gender',
  }),
  player_skill: z.number().int().min(1).max(5),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormData = z.infer<typeof schema>

const skillLabels = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Expert',
  5: 'Pro',
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const createPlayer = trpc.players.create.useMutation()
  const updatePlayer = trpc.players.update.useMutation()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle')

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { player_skill: 3 },
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setError(null)

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (authError || !authData.user) {
      setError(authError?.message || 'Failed to create account')
      setIsLoading(false)
      return
    }

    const playerId = authData.user.id

    // Create player record
    try {
      await createPlayer.mutateAsync({
        player_id: playerId,
        player_fname: data.player_fname,
        player_lname: data.player_lname,
        player_dob: data.player_dob,
        player_gender: data.player_gender,
        player_skill: data.player_skill,
      })

      // Non-blocking geolocation capture
      setGeoStatus('loading')
      captureGeolocation().then((coords) => {
        if (coords) {
          updatePlayer.mutate({ id: playerId, player_lat: coords.lat, player_long: coords.lon })
          setGeoStatus('success')
        } else {
          setGeoStatus('failed')
        }
      })

      router.push('/')
    } catch (err) {
      setError('Failed to create player profile')
      setIsLoading(false)
    }
  }

  const skill = watch('player_skill')
  const gender = watch('player_gender')

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint-50 via-white to-mint-100/50 p-4 py-12">
      {/* Floating decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-mint-200/30 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-mint-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="w-full max-w-2xl relative z-10 animate-in fade-in-50 slide-in-from-bottom-10 duration-500">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="mx-auto mb-2 text-5xl">🏸</div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-br from-mint-600 to-mint-800 bg-clip-text text-transparent">
            Join Match
          </CardTitle>
          <CardDescription className="text-base">
            Create your profile and start finding badminton partners
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-in fade-in-50 slide-in-from-top-2">
                {error}
              </div>
            )}

            {/* Name fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fname">First name</Label>
                <Input
                  id="fname"
                  placeholder="John"
                  {...register('player_fname')}
                  disabled={isLoading}
                />
                {errors.player_fname && (
                  <p className="text-sm text-red-500 animate-in fade-in-50 slide-in-from-top-1">
                    {errors.player_fname.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lname">Last name</Label>
                <Input
                  id="lname"
                  placeholder="Doe"
                  {...register('player_lname')}
                  disabled={isLoading}
                />
                {errors.player_lname && (
                  <p className="text-sm text-red-500 animate-in fade-in-50 slide-in-from-top-1">
                    {errors.player_lname.message}
                  </p>
                )}
              </div>
            </div>

            {/* DOB and Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of birth</Label>
                <Input
                  id="dob"
                  type="date"
                  {...register('player_dob')}
                  disabled={isLoading}
                />
                {errors.player_dob && (
                  <p className="text-sm text-red-500 animate-in fade-in-50 slide-in-from-top-1">
                    {errors.player_dob.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={gender}
                  onValueChange={(value) => setValue('player_gender', value as any)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Non-binary">Non-binary</SelectItem>
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                {errors.player_gender && (
                  <p className="text-sm text-red-500 animate-in fade-in-50 slide-in-from-top-1">
                    {errors.player_gender.message}
                  </p>
                )}
              </div>
            </div>

            {/* Skill level selector */}
            <div className="space-y-2">
              <Label>Skill level</Label>
              <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50/50 space-y-3">
                <div className="flex justify-between items-center gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setValue('player_skill', level)}
                      disabled={isLoading}
                      className={`flex-1 h-12 rounded-xl border-2 font-bold text-sm transition-all duration-200 ${
                        level <= skill
                          ? 'bg-mint-500 border-mint-500 text-white shadow-lg shadow-mint-500/30 scale-105'
                          : 'border-gray-300 text-gray-400 hover:border-mint-300 hover:text-mint-500'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="text-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-mint-100 text-mint-700 text-sm font-medium">
                    {skillLabels[skill as keyof typeof skillLabels]}
                  </span>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500 animate-in fade-in-50 slide-in-from-top-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  {...register('password')}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 animate-in fade-in-50 slide-in-from-top-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Location permission info */}
            <div className="p-3 rounded-xl bg-mint-50 border border-mint-200 text-mint-700 text-sm flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                We'll request your location after signup to help find nearby courts and matches.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating your account...
                </>
              ) : (
                'Create account'
              )}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="text-center">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Sign in instead
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
