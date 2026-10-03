import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Extract the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Create Supabase client with the caller's JWT to verify identity
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // 4. Get the authenticated user
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser()
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Verify the caller is a teacher
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('id', caller.id)
      .single()

    if (profileError || !callerProfile || callerProfile.role !== 'teacher') {
      return new Response(
        JSON.stringify({ error: 'Only teachers can create students' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Parse and validate request body
    const { firstName, lastName, email, password } = await req.json()

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
      return new Response(
        JSON.stringify({ error: 'All fields are required: firstName, lastName, email, password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 7. Check if email already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const emailExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === trimmedEmail
    )
    if (emailExists) {
      return new Response(
        JSON.stringify({ error: 'A user with this email already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 8. Create Auth user using admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: trimmedEmail,
      password: password,
      email_confirm: true, // Auto-confirm for teacher-created accounts
      user_metadata: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role: 'student',
      },
    })

    if (createError || !newUser?.user) {
      console.error('Auth user creation error:', createError)
      return new Response(
        JSON.stringify({ error: createError?.message || 'Failed to create user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 9. Create student profile linked to teacher
    const { data: profile, error: profileInsertError } = await adminClient
      .from('profiles')
      .insert({
        id: newUser.user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: trimmedEmail,
        role: 'student',
        teacher_id: caller.id, // Derived from JWT, not from client
        is_active: true,
      })
      .select()
      .single()

    if (profileInsertError) {
      // Rollback: delete the auth user if profile creation fails
      console.error('Profile creation error:', profileInsertError)
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      return new Response(
        JSON.stringify({ error: 'Failed to create student profile. Account rolled back.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 10. Return safe student information (never return the password)
    return new Response(
      JSON.stringify({
        success: true,
        student: {
          id: profile.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          email: profile.email,
          role: profile.role,
          createdAt: profile.created_at,
        },
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
