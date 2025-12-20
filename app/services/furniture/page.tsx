'use client'

import Navigation from '../../components/Navigation'
import Footer from '../../components/Footer'
import Link from 'next/link'
import Image from 'next/image'

export default function FurnitureShipping() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-grey-900 to-grey-800 text-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-grey-700 bg-grey-800/50 backdrop-blur-sm mb-6">
                <span className="text-xs font-medium text-grey-300 uppercase tracking-widest">Specialty Shipping</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">Designer Furniture Shipping</h1>
              <p className="text-xl text-grey-300 mb-8">
                White-glove furniture handling for luxury pieces and designer collections. Expert disassembly, protective wrapping, and precision reassembly included.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="tel:(512) 240-9818"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-emerald rounded-lg font-medium text-white hover:bg-emerald/90 transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  (512) 240-9818
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-grey-800/50 border border-grey-700 rounded-lg font-medium text-grey-200 hover:bg-grey-700/50 hover:border-grey-600 backdrop-blur-sm transition-all duration-300"
                >
                  Get Free Quote
                </Link>
              </div>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden border-2 border-grey-700 shadow-xl">
              <Image
                src="/2.jpg"
                alt="Designer Furniture Shipping - White Glove Service"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Why Choose Our Furniture Shipping?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                ),
                title: 'White-Glove Service',
                description: 'Premium handling from pickup to placement, ensuring your luxury furniture receives the care it deserves.'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                ),
                title: 'Expert Assembly',
                description: 'Professional disassembly before shipping and precise reassembly at your destination.'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                ),
                title: 'Protective Wrapping',
                description: 'Multi-layer protection with premium blankets, shrink wrap, and custom crating when needed.'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Scratch-Free Guarantee',
                description: 'Specialized equipment and techniques to ensure zero damage during transport.'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                ),
                title: 'Inside Delivery',
                description: 'We place furniture exactly where you want it, not just at your doorstep.'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                ),
                title: 'Debris Removal',
                description: 'We remove all packing materials and dispose of them responsibly.'
              }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-xl bg-gray-50 border border-gray-200 hover:border-emerald/50 hover:shadow-lg transition-all">
                <div className="w-16 h-16 rounded-xl bg-emerald/10 border border-emerald/20 flex items-center justify-center mb-4 text-emerald">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Ship Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Furniture We Ship</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: 'Designer Sofas & Sectionals', desc: 'Luxury seating from top brands' },
              { name: 'Dining Sets', desc: 'Tables, chairs, and buffets' },
              { name: 'Bedroom Furniture', desc: 'Beds, dressers, and armoires' },
              { name: 'Antique Furniture', desc: 'Historical and heirloom pieces' },
              { name: 'Office Furniture', desc: 'Executive desks and conference tables' },
              { name: 'Custom Built-Ins', desc: 'Shelving, cabinets, and storage' }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-emerald" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h4>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Our Furniture Shipping Process</h2>
          <div className="space-y-8">
            {[
              { step: 1, title: 'Assessment & Quote', desc: 'We evaluate your furniture and provide a detailed shipping quote with no hidden fees.' },
              { step: 2, title: 'Professional Disassembly', desc: 'Our technicians carefully disassemble complex furniture pieces for safe transport.' },
              { step: 3, title: 'Protective Wrapping', desc: 'Multiple layers of premium blankets and shrink wrap protect every surface.' },
              { step: 4, title: 'Secure Transport', desc: 'Your furniture travels in our specialized trucks with air-ride suspension.' },
              { step: 5, title: 'Reassembly & Placement', desc: 'We reassemble and place furniture exactly where you want it in your space.' }
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald text-white flex items-center justify-center text-xl font-bold">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-700 text-lg">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-grey-900 to-grey-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Ship Your Designer Furniture?</h2>
          <p className="text-xl text-grey-300 mb-10">
            Get a free quote for white-glove furniture shipping. We handle every detail so you don't have to.
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
              Request a Quote
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
