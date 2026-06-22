import { Suspense } from 'react'
import SignInShell from '@/components/welcome/SignInShell'

export const metadata = { title: 'Sign in — tiikme' }

export default function SignInPage() {
  return <Suspense><SignInShell /></Suspense>
}
