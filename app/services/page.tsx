'use client'

import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import Link from 'next/link'
import Image from 'next/image'

export default function Services() {
  return (
    <div className="min-h-screen bg-white flex-col">
      <Navigation />

      {/* Page Header */}
      <section className="bg-gradient-to-br from-grey-900 to-grey-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-5xl font-bold mb-4">Specialty Shipping Services</h1>
          <p className="text-xl text-grey-300">White-Glove Handling for Fine Art, Furniture & Medical Equipment</p>
        </div>
      </section>

      {/* Hero Images Section */}
      <section className="py-8 px-4 bg-grey-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="relative h-64 rounded-xl overflow-hidden border-2 border-grey-700 shadow-xl group">
              <Image
                src="/1.jpg"
                alt="Fine Art Shipping Services"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-grey-900/90 via-grey-900/40 to-transparent flex items-end p-6">
                <div>
                  <h3 className="text-grey-50 font-bold text-2xl mb-2">Fine Art</h3>
                  <p className="text-grey-300 text-sm">Museum-quality crating & transport</p>
                </div>
              </div>
            </div>
            <div className="relative h-64 rounded-xl overflow-hidden border-2 border-grey-700 shadow-xl group">
              <Image
                src="/2.jpg"
                alt="Designer Furniture Shipping"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-grey-900/90 via-grey-900/40 to-transparent flex items-end p-6">
                <div>
                  <h3 className="text-grey-50 font-bold text-2xl mb-2">Designer Furniture</h3>
                  <p className="text-grey-300 text-sm">White-glove furniture handling</p>
                </div>
              </div>
            </div>
            <div className="relative h-64 rounded-xl overflow-hidden border-2 border-grey-700 shadow-xl group">
              <Image
                src="/3.jpg"
                alt="Medical Equipment Shipping"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-grey-900/90 via-grey-900/40 to-transparent flex items-end p-6">
                <div>
                  <h3 className="text-grey-50 font-bold text-2xl mb-2">Medical Equipment</h3>
                  <p className="text-grey-300 text-sm">HIPAA-compliant transport</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Detail */}
      <section className="flex-1 py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto space-y-16">

          {/* Service 1: Fine Art Shipping */}
          <div className="bg-gray-50 p-8 md:p-12 rounded-lg shadow">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Fine Art Shipping</h2>
            <p className="text-xl text-emerald font-semibold mb-6 pb-4 border-b-2 border-emerald">
              Museum-quality crating and climate-controlled transport for paintings, sculptures, and collectibles. Our expert handling ensures your artwork arrives in pristine condition.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What is Fine Art Shipping?</h3>
            <p className="text-gray-700 leading-relaxed mb-8">
              Fine art shipping is a specialized service that provides museum-quality care for valuable artwork. Our expert team uses custom crating, climate-controlled transport, and gallery-standard handling techniques to ensure paintings, sculptures, and collectibles arrive safely and in pristine condition.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">Key Benefits:</h3>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>Climate-Controlled Transport:</strong> Temperature and humidity regulated throughout shipping</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>Custom Crating:</strong> Built-to-spec wooden crates for each unique piece</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>Full Insurance Coverage:</strong> Comprehensive protection for your valuable art</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>Gallery-Standard Care:</strong> White-glove handling by trained art handlers</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>Installation Services:</strong> Professional hanging and placement available</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>Real-Time Tracking:</strong> Monitor your shipment 24/7 online</span>
              </li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ideal For:</h3>
            <ul className="space-y-2 mb-8">
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald">•</span>
                <span>Oil paintings and canvases</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald">•</span>
                <span>Sculptures and statues</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald">•</span>
                <span>Framed artwork and prints</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald">•</span>
                <span>Antiques and collectibles</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald">•</span>
                <span>Gallery exhibitions</span>
              </li>
            </ul>

            <Link href="/contact" className="inline-block bg-white border-2 border-emerald text-emerald hover:bg-emerald hover:text-white font-bold py-3 px-8 rounded transition">
              Get a Free Quote
            </Link>
          </div>

          {/* Service 2: Designer Furniture */}
          <div className="bg-gray-50 p-8 md:p-12 rounded-lg shadow">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Designer Furniture Shipping</h2>
            <p className="text-xl text-emerald font-semibold mb-6 pb-4 border-b-2 border-emerald">
              White-glove furniture handling for luxury pieces and designer collections. Expert disassembly, protective wrapping, and precision reassembly included.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What is White-Glove Furniture Shipping?</h3>
            <p className="text-gray-700 leading-relaxed mb-8">
              White-glove furniture shipping provides premium handling services for high-end and designer furniture. Our experienced team carefully disassembles, wraps, transports, and reassembles your luxury pieces, ensuring they arrive in perfect condition without a single scratch.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">Key Benefits:</h3>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>White-Glove Service:</strong> Meticulous care from pickup to final placement</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>Professional Wrapping:</strong> Multi-layer protection with premium materials</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>Assembly/Disassembly:</strong> Expert furniture technicians handle complex pieces</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>Scratch-Free Transport:</strong> Specialized equipment prevents all damage</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>Inside Delivery:</strong> Placed exactly where you want it</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>Debris Removal:</strong> We take away all packing materials</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>Full Insurance:</strong> Complete protection for your investment</span>
              </li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ideal For:</h3>
            <ul className="space-y-2 mb-8">
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald">•</span>
                <span>Designer sofas and sectionals</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald">•</span>
                <span>Luxury dining sets</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald">•</span>
                <span>High-end bedroom furniture</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald">•</span>
                <span>Antique furniture</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald">•</span>
                <span>Custom built-ins</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald">•</span>
                <span>Executive office furniture</span>
              </li>
            </ul>

            <Link href="/contact" className="inline-block bg-white border-2 border-emerald text-emerald hover:bg-emerald hover:text-white font-bold py-3 px-8 rounded transition">
              Get a Free Quote
            </Link>
          </div>

          {/* Service 3: Medical Equipment */}
          <div className="bg-gray-50 p-8 md:p-12 rounded-lg shadow">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Medical Equipment Transport</h2>
            <p className="text-xl text-emerald font-semibold mb-6 pb-4 border-b-2 border-emerald">
              HIPAA-compliant transport for sensitive medical devices and laboratory equipment. Specialized handling with chain-of-custody documentation and calibration protection.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What is Medical Equipment Transport?</h3>
            <p className="text-gray-700 leading-relaxed mb-8">
              Medical equipment transport is a highly specialized service that ensures safe, compliant handling of sensitive medical devices and laboratory equipment. Our HIPAA-certified team provides chain-of-custody documentation, temperature-controlled transport, and calibration-safe handling to protect your critical medical assets.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">Key Benefits:</h3>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>HIPAA Compliant:</strong> Full compliance with healthcare privacy regulations</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>Chain of Custody:</strong> Complete documentation trail for every shipment</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>Temperature Control:</strong> Climate-controlled transport when required</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>Calibration Safe:</strong> Specialized handling to maintain equipment calibration</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>Sterile Packaging:</strong> Contamination-free transport options available</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>Installation Support:</strong> Setup and testing coordination available</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>24/7 Monitoring:</strong> Real-time tracking and immediate issue response</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald font-bold">✓</span>
                <span><strong>Specialized Insurance:</strong> Coverage designed for medical equipment</span>
              </li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ideal For:</h3>
            <ul className="space-y-2 mb-8">
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald">•</span>
                <span>Diagnostic imaging equipment (MRI, CT, X-ray)</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald">•</span>
                <span>Laboratory analyzers and instruments</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald">•</span>
                <span>Surgical equipment and tools</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald">•</span>
                <span>Dental equipment</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald">•</span>
                <span>Patient monitors and devices</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald">•</span>
                <span>Pharmaceutical storage units</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <span className="text-emerald">•</span>
                <span>Research and biotech equipment</span>
              </li>
            </ul>

            <Link href="/contact" className="inline-block bg-white border-2 border-emerald text-emerald hover:bg-emerald hover:text-white font-bold py-3 px-8 rounded transition">
              Get a Free Quote
            </Link>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Our Shipping Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: 1, title: 'Free Consultation', desc: 'We assess your shipping needs and provide a detailed quote with no obligation.' },
              { number: 2, title: 'Custom Packaging', desc: 'Our team creates custom crating and packaging designed specifically for your items.' },
              { number: 3, title: 'Secure Transport', desc: 'White-glove handling and climate-controlled transport ensure safe delivery.' },
              { number: 4, title: 'Final Placement', desc: 'We deliver, unpack, and place your items exactly where you want them.' }
            ].map((step) => (
              <div key={step.number} className="bg-white p-6 rounded-lg shadow text-center">
                <div className="w-12 h-12 bg-emerald text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20 px-4 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Ship Your Valuable Items?</h2>
        <p className="text-xl text-gray-300 mb-8">Contact us today for a free consultation and shipping quote</p>
        <a 
          href="tel:(512) 240-9818" 
          className="bg-emerald hover:bg-emerald/90 text-white font-bold py-4 px-10 rounded inline-block transition transform hover:-translate-y-1 shadow-lg flex items-center justify-center gap-2 max-w-max mx-auto"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          (512) 240-9818
        </a>
      </section>

      <Footer />
    </div>
  )
}
