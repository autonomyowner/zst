import { render, screen } from '@testing-library/react'
import Header from '../Header'
import { AuthContext } from '@/contexts/OptimizedAuthContext'

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: jest.fn() }),
}))

// Mock the AuthContext
const mockAuthContext = {
  user: null,
  profile: null,
  loading: false,
  signOut: jest.fn(),
}

describe('Header', () => {
  it('renders the public B2C header by default', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <Header />
      </AuthContext.Provider>
    )

    // Check for top bar links
    expect(screen.getByText('For Shopping')).toBeInTheDocument()
    expect(screen.getByText('For Business')).toBeInTheDocument()

    // Check for main header links
    expect(screen.getByText('Sell your product')).toBeInTheDocument()
    expect(screen.getByText('Sign up')).toBeInTheDocument()
    expect(screen.getByText('Log in')).toBeInTheDocument()
  })
})