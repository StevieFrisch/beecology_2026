import { Link } from 'react-router-dom'
import { AuthLayout, Input, PasswordInput, Checkbox, PrimaryButton, Divider, GoogleButton } from '../components/AuthCard.jsx'

export default function Login() {
  return (
    <AuthLayout
      title="Sign in"
      footer={<>New to Beecology? <Link to="/signup" className="font-semibold text-amber hover:underline">Create an account</Link></>}
    >
      <Input label="Email" type="email" name="email" autoComplete="email" placeholder="you@example.com" />
      <PasswordInput label="Password" name="password" autoComplete="current-password" placeholder="Your password" />
      <div className="flex items-center justify-between">
        <Checkbox label="Remember me" name="remember" />
        <a href="#" onClick={(e) => e.preventDefault()} className="text-sm font-medium text-amber hover:underline">Forgot password?</a>
      </div>
      <PrimaryButton>Sign in</PrimaryButton>
      <Divider />
      <GoogleButton />
    </AuthLayout>
  )
}
