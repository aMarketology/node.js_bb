// Debug script to test Supabase auth connection
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://mlmtwwngclbtpexwtlnv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sbXR3d25nY2xidHBleHd0bG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MjczMjAsImV4cCI6MjA2NjMwMzMyMH0.Uy6eGYnPdgDXI6ENsP9P2g81ppDpMTZVPM6vrBdLarw'
);

async function testAuth() {
  console.log('=== Testing Supabase Connection ===\n');
  
  // Test 1: Check if we can connect to profiles table
  console.log('1. Testing profiles table access...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, email')
    .limit(3);
  
  if (profilesError) {
    console.log('❌ Profiles error:', profilesError.message);
  } else {
    console.log('✅ Profiles accessible:', profiles?.length, 'records');
    console.log('   Sample:', profiles);
  }

  // Test 2: Check auth settings
  console.log('\n2. Testing auth sign-in with test credentials...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'test@test.com',
    password: 'testpassword123'
  });
  
  if (signInError) {
    console.log('❌ Sign-in error:', signInError.message);
    console.log('   Error code:', signInError.status);
  } else {
    console.log('✅ Sign-in worked:', signInData?.user?.email);
  }

  // Test 3: Check if auth users exist
  console.log('\n3. Checking auth configuration...');
  const { data: session } = await supabase.auth.getSession();
  console.log('   Current session:', session?.session ? 'Active' : 'None');

  // Test 4: Try to sign up a test user
  console.log('\n4. Testing sign-up flow...');
  const testEmail = `test_${Date.now()}@example.com`;
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPassword123!'
  });
  
  if (signUpError) {
    console.log('❌ Sign-up error:', signUpError.message);
  } else {
    console.log('✅ Sign-up response:', signUpData?.user?.id ? 'User created' : 'Email confirmation required');
    console.log('   User ID:', signUpData?.user?.id);
    console.log('   Email confirmed:', signUpData?.user?.email_confirmed_at ? 'Yes' : 'No (needs confirmation)');
  }

  // Test 5: Check existing profile lookup
  console.log('\n5. Testing profile lookup by email...');
  const { data: existingProfile, error: lookupError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'max@amarketology.com')
    .single();
  
  if (lookupError) {
    console.log('❌ Lookup error:', lookupError.message);
  } else {
    console.log('✅ Found profile:', existingProfile?.user_id);
    console.log('   Blackbook address:', existingProfile?.blackbook_address);
  }
}

testAuth();
