import { Link } from 'react-router-dom'
import { AuthLayout, Input, PasswordInput, PrimaryButton, Divider, GoogleButton } from '../components/AuthCard.jsx'

export default function Signup() {
  return (
    <AuthLayout
      title="Create account"
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-amber hover:underline">Sign in</Link></>}
    >
      <Input label="Email" type="email" name="email" autoComplete="email" placeholder="you@example.com" />
      <PasswordInput label="Password" name="password" autoComplete="new-password" placeholder="Create a password"
        hint="At least 8 characters." />
      <PasswordInput label="Confirm password" name="confirm" autoComplete="new-password" placeholder="Type it again" />
      <PrimaryButton>Create account</PrimaryButton>
      <Divider />
      <GoogleButton />
    </AuthLayout>
  )
}
