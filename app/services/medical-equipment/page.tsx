'use client'

import Navigation from '../../components/Navigation'
import Footer from '../../components/Footer'
import Link from 'next/link'
import Image from 'next/image'

export default function MedicalEquipment() {
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
              <h1 className="text-5xl md:text-6xl font-bold mb-6">Medical Equipment Transport</h1>
              <p className="text-xl text-grey-300 mb-8">
                HIPAA-compliant transport for sensitive medical devices and laboratory equipment. Specialized handling with chain-of-custody documentation and calibration protection.
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
                src="/3.jpg"
                alt="Medical Equipment Transport - HIPAA Compliant"
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
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Why Choose Our Medical Equipment Transport?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'HIPAA Compliant',
                description: 'Full compliance with healthcare privacy regulations and data security requirements.'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: 'Chain of Custody',
                description: 'Complete documentation trail for every shipment, ensuring accountability at every step.'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                ),
                title: 'Temperature Control',
                description: 'Climate-controlled transport for temperature-sensitive medical devices and pharmaceuticals.'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                ),
                title: 'Calibration Safe',
                description: 'Specialized handling techniques to maintain equipment calibration during transport.'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                ),
                title: 'Sterile Packaging',
                description: 'Contamination-free transport options available for surgical and laboratory equipment.'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: '24/7 Monitoring',
                description: 'Real-time tracking and immediate response team available around the clock.'
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
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Equipment We Transport</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: 'Diagnostic Imaging', desc: 'MRI, CT, X-ray, and ultrasound systems' },
              { name: 'Laboratory Equipment', desc: 'Analyzers, centrifuges, and microscopes' },
              { name: 'Surgical Equipment', desc: 'Operating tables and surgical instruments' },
              { name: 'Dental Equipment', desc: 'Chairs, X-rays, and sterilizers' },
              { name: 'Patient Monitors', desc: 'Vital signs and telemetry equipment' },
              { name: 'Pharmaceutical Storage', desc: 'Refrigerators and controlled storage' },
              { name: 'Biotech Equipment', desc: 'Research and development instruments' },
              { name: 'Dialysis Machines', desc: 'Hemodialysis and peritoneal systems' }
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

      {/* Compliance Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Our Compliance Standards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: 'HIPAA Compliance', items: ['Privacy safeguards', 'Secure documentation', 'Data protection protocols', 'Staff training & certification'] },
              { title: 'FDA Regulations', items: ['GMP compliance', 'Quality system requirements', 'Device handling standards', 'Temperature monitoring'] },
              { title: 'DOT Requirements', items: ['Hazmat certification', 'Proper labeling', 'Transport documentation', 'Driver qualifications'] },
              { title: 'Insurance Coverage', items: ['Equipment value protection', 'Liability coverage', 'Cargo insurance', 'Professional indemnity'] }
            ].map((section, i) => (
              <div key={i} className="p-6 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex gap-3 text-gray-700">
                      <svg className="w-5 h-5 text-emerald flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Our Medical Equipment Transport Process</h2>
          <div className="space-y-8">
            {[
              { step: 1, title: 'Assessment & Documentation', desc: 'We evaluate equipment specifications, compliance needs, and create detailed transport documentation.' },
              { step: 2, title: 'Specialized Packaging', desc: 'Custom crating and sterile packaging designed to protect sensitive medical equipment.' },
              { step: 3, title: 'Chain of Custody Setup', desc: 'Complete documentation trail established with sign-offs at every handover point.' },
              { step: 4, title: 'Climate-Controlled Transport', desc: 'Temperature and humidity monitoring throughout transit with real-time alerts.' },
              { step: 5, title: 'Delivery & Installation Support', desc: 'Coordinated delivery with optional setup assistance and calibration verification.' }
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
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Ship Your Medical Equipment?</h2>
          <p className="text-xl text-grey-300 mb-10">
            Get a free quote for HIPAA-compliant medical equipment transport. Our specialists are ready to help.
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
