'use client'

import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import Link from 'next/link'
import { useState } from 'react'

export default function BuyACrate() {
  const [selectedSize, setSelectedSize] = useState('')

  const crateSizes = [
    {
      name: 'Small Crate',
      dimensions: '24" x 24" x 24"',
      weight: '50 lbs capacity',
      price: '$149',
      ideal: 'Small artwork, sculptures, collectibles',
      features: ['Marine-grade plywood', 'Foam padding included', 'Weather-resistant']
    },
    {
      name: 'Medium Crate',
      dimensions: '36" x 36" x 36"',
      weight: '100 lbs capacity',
      price: '$249',
      ideal: 'Medium artwork, small furniture pieces',
      features: ['Reinforced construction', 'Custom foam inserts', 'Lockable latches']
    },
    {
      name: 'Large Crate',
      dimensions: '48" x 48" x 48"',
      weight: '200 lbs capacity',
      price: '$399',
      ideal: 'Large paintings, furniture, equipment',
      features: ['Heavy-duty construction', 'Moisture barrier', 'Lifting handles']
    },
    {
      name: 'Extra Large Crate',
      dimensions: '60" x 60" x 60"',
      weight: '300 lbs capacity',
      price: '$599',
      ideal: 'Oversized art, large furniture, medical equipment',
      features: ['Industrial-grade materials', 'Forklift compatible', 'Climate protection']
    }
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-grey-900 to-grey-800 text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-grey-700 bg-grey-800/50 backdrop-blur-sm mb-6">
            <span className="text-xs font-medium text-grey-300 uppercase tracking-widest">Shipping Supplies</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Buy a Crate</h1>
          <p className="text-xl text-grey-300 mb-8 max-w-3xl mx-auto">
            Professional-grade shipping crates built to museum standards. Perfect for shipping fine art, furniture, or sensitive equipment with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:(512) 240-9818"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-emerald rounded-lg font-medium text-white hover:bg-emerald/90 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Call to Order
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-grey-800/50 border border-grey-700 rounded-lg font-medium text-grey-200 hover:bg-grey-700/50 hover:border-grey-600 backdrop-blur-sm transition-all duration-300"
            >
              Request Custom Size
            </Link>
          </div>
        </div>
      </section>

      {/* Crate Options Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Choose Your Crate Size</h2>
          <p className="text-center text-gray-600 mb-16 text-lg">All crates are built to order and ship within 5-7 business days</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {crateSizes.map((crate, i) => (
              <div
                key={i}
                className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedSize === crate.name
                    ? 'border-emerald bg-emerald/5 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-emerald/50 hover:shadow-md'
                }`}
                onClick={() => setSelectedSize(crate.name)}
              >
                {i === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald text-white text-sm font-bold rounded-full">
                    Most Popular
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{crate.name}</h3>
                  <div className="text-4xl font-bold text-emerald mb-2">{crate.price}</div>
                  <p className="text-gray-600 text-sm">{crate.dimensions}</p>
                  <p className="text-gray-500 text-sm">{crate.weight}</p>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Ideal For:</p>
                  <p className="text-sm text-gray-600">{crate.ideal}</p>
                </div>

                <div className="space-y-2 mb-6">
                  {crate.features.map((feature, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-emerald flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <a
                  href={`tel:(512) 240-9818`}
                  className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-all ${
                    selectedSize === crate.name
                      ? 'bg-emerald text-white hover:bg-emerald/90'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Order Now
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Why Choose Austin Crate Shipping Crates?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
                title: 'Museum-Quality Construction',
                description: 'Built to the same standards used by museums and galleries worldwide for priceless artwork.'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                ),
                title: 'Fully Customizable',
                description: 'Need a custom size? We can build crates to your exact specifications for any shipping need.'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                ),
                title: 'Reusable & Eco-Friendly',
                description: 'Durable construction means crates can be reused multiple times, reducing waste.'
              }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-xl bg-white border border-gray-200 text-center">
                <div className="w-16 h-16 rounded-xl bg-emerald/10 border border-emerald/20 flex items-center justify-center mb-4 text-emerald mx-auto">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specifications Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Crate Specifications</h2>
          <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Materials</h3>
                <ul className="space-y-2">
                  {[
                    'Marine-grade plywood (3/4" thick)',
                    'Kiln-dried lumber framing',
                    'Stainless steel hardware',
                    'High-density foam padding'
                  ].map((item, i) => (
                    <li key={i} className="flex gap-2 text-gray-700">
                      <svg className="w-5 h-5 text-emerald flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Features</h3>
                <ul className="space-y-2">
                  {[
                    'Weather-resistant construction',
                    'Shock-absorbing design',
                    'Stackable for storage',
                    'International shipping certified'
                  ].map((item, i) => (
                    <li key={i} className="flex gap-2 text-gray-700">
                      <svg className="w-5 h-5 text-emerald flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Crates CTA */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Need a Custom Size?</h2>
          <p className="text-xl text-gray-600 mb-8">
            We specialize in building custom crates for unique items. From oversized sculptures to delicate antiques, we can create the perfect crate for your needs.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-emerald rounded-lg font-semibold text-lg text-white hover:bg-emerald/90 transition-all duration-300"
          >
            Request Custom Quote
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-grey-900 to-grey-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Order Your Crate?</h2>
          <p className="text-xl text-grey-300 mb-10">
            Call us today to place your order or discuss custom crating options for your specific needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:(512) 240-9818"
              className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-emerald rounded-lg font-semibold text-lg text-white hover:bg-emerald/90 transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              (512) 240-9818
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-grey-800/50 border-2 border-grey-700 rounded-lg font-semibold text-lg text-grey-300 hover:bg-grey-700/50 hover:border-grey-600 backdrop-blur-sm transition-all duration-300"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
