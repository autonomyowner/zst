"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/OptimizedAuthContext'

interface GetStartedProps {
  balance?: number
  hasProducts?: boolean
  onActivateStore?: () => void
}

export default function GetStarted({ balance = 0, hasProducts = false, onActivateStore }: GetStartedProps) {
  const router = useRouter()
  const { profile } = useAuth()
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set(['activate']))
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Load completed steps from localStorage
    const saved = localStorage.getItem('onboarding_completed_steps')
    if (saved) {
      try {
        const steps = JSON.parse(saved)
        setCompletedSteps(new Set(steps))
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Check if store is activated (balance >= 1 DZD)
    if (balance >= 1) {
      setCompletedSteps(prev => new Set([...prev, 'activate']))
    }

    // Check if user has products
    if (hasProducts) {
      setCompletedSteps(prev => new Set([...prev, 'create-product']))
    }
  }, [balance, hasProducts])

  const toggleStep = (step: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(step)) {
        newSet.delete(step)
      } else {
        newSet.add(step)
      }
      return newSet
    })
  }

  const markStepComplete = (step: string) => {
    setCompletedSteps(prev => {
      const newSet = new Set([...prev, step])
      localStorage.setItem('onboarding_completed_steps', JSON.stringify([...newSet]))
      return newSet
    })
  }

  const handleActivateStore = () => {
    if (onActivateStore) {
      onActivateStore()
    } else {
      // Navigate to balance/add funds page or show modal
      router.push('/business/store?action=activate')
    }
  }

  const handleCreateProduct = () => {
    router.push('/business/my-listings?create=true')
    markStepComplete('create-product')
  }

  const handleCustomizeStore = () => {
    router.push('/business/store')
    markStepComplete('customize-store')
  }

  const handleAddDomain = () => {
    router.push('/business/store?tab=domain')
    markStepComplete('add-domain')
  }

  const steps = [
    {
      id: 'activate',
      title: 'Activate your store',
      description: 'Add DA 1 to your balance to activate your store and kickstart your e-commerce journey!',
      action: handleActivateStore,
      actionLabel: 'Activate your store now!',
      completed: completedSteps.has('activate'),
    },
    {
      id: 'create-product',
      title: 'Create a product',
      description: 'Add your first product listing to start selling.',
      action: handleCreateProduct,
      actionLabel: 'Create product',
      completed: completedSteps.has('create-product'),
    },
    {
      id: 'customize-store',
      title: 'Customize your store',
      description: 'Personalize your store settings and branding.',
      action: handleCustomizeStore,
      actionLabel: 'Customize store',
      completed: completedSteps.has('customize-store'),
    },
    {
      id: 'add-domain',
      title: 'Add a domain',
      description: 'Connect your custom domain to your store.',
      action: handleAddDomain,
      actionLabel: 'Add domain',
      completed: completedSteps.has('add-domain'),
    },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-semibold mb-2">Get Started</h2>
        <p className="text-sm text-gray-600">
          Follow these guides to get started and explore as you go.
        </p>
      </div>

      <div className="space-y-2">
        {steps.map((step) => {
          const isExpanded = expandedSteps.has(step.id)
          const isCompleted = step.completed

          return (
            <div
              key={step.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleStep(step.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  <span className="font-medium text-gray-900">{step.title}</span>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-600 mt-3 mb-4">{step.description}</p>
                  {!isCompleted && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        step.action()
                      }}
                      className="px-4 py-2 bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 transition-colors text-sm min-h-[44px]"
                    >
                      {step.actionLabel}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}









