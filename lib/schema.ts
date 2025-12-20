// Schema.org / JSON-LD structured data for SEO and LLM optimization
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://austincrate.com',
  name: 'Austin Crate & Freight',
  alternateName: 'Austin Crate',
  legalName: 'Austin Crate & Freight LLC',
  image: 'https://austincrate.com/og-image.jpg',
  logo: 'https://austincrate.com/logo.png',
  description: 'Premier white-glove specialty shipping company in Austin, Texas providing museum-quality crating and transport for fine art, designer furniture, and medical equipment. HIPAA-compliant, climate-controlled, fully insured services serving Central Texas since 2010.',
  url: 'https://austincrate.com',
  telephone: '+15122409818',
  email: 'info@austincrate.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '3112 Windsor Rd',
    addressLocality: 'Austin',
    addressRegion: 'TX',
    postalCode: '78703',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '30.2672',
    longitude: '-97.7431',
  },
  areaServed: [
    { '@type': 'City', name: 'Austin', '@id': 'https://en.wikipedia.org/wiki/Austin,_Texas' },
    { '@type': 'City', name: 'Round Rock' },
    { '@type': 'City', name: 'Cedar Park' },
    { '@type': 'City', name: 'Georgetown' },
    { '@type': 'City', name: 'Pflugerville' },
    { '@type': 'City', name: 'Leander' },
    { '@type': 'City', name: 'Lakeway' },
    { '@type': 'City', name: 'Bee Cave' },
    { '@type': 'City', name: 'Dripping Springs' },
    { '@type': 'City', name: 'Kyle' },
  ],
  serviceArea: {
    '@type': 'GeoCircle',
    geoMidpoint: {
      '@type': 'GeoCoordinates',
      latitude: '30.2672',
      longitude: '-97.7431',
    },
    geoRadius: '50 miles',
  },
  sameAs: [
    'https://www.facebook.com/austincrate',
    'https://www.instagram.com/austincrate',
    'https://www.linkedin.com/company/austincrate',
    'https://www.google.com/maps',
  ],
  priceRange: '$$$',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '18:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Saturday',
      opens: '00:00',
      closes: '00:00',
      note: 'By Appointment',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '5.0',
    ratingCount: '28',
    reviewCount: '28',
    bestRating: '5',
    worstRating: '1',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Specialty Shipping Services',
    itemListElement: [
      {
        '@type': 'OfferCatalog',
        name: 'Fine Art Shipping',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Museum-Quality Art Crating',
              description: 'Custom wooden crates built to museum standards for paintings, sculptures, and valuable artwork',
            },
          },
        ],
      },
      {
        '@type': 'OfferCatalog',
        name: 'Designer Furniture Shipping',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'White-Glove Furniture Transport',
              description: 'Premium handling for luxury and designer furniture with assembly/disassembly services',
            },
          },
        ],
      },
      {
        '@type': 'OfferCatalog',
        name: 'Medical Equipment Transport',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'HIPAA-Compliant Medical Shipping',
              description: 'Specialized transport for medical devices and laboratory equipment with chain-of-custody documentation',
            },
          },
        ],
      },
    ],
  },
  knowsAbout: [
    'Fine art shipping',
    'Museum-quality crating',
    'Designer furniture transport',
    'Medical equipment shipping',
    'HIPAA compliance',
    'Climate-controlled transport',
    'White-glove delivery',
    'Custom crating solutions',
    'Art gallery logistics',
    'Medical device transport',
  ],
};

export const servicesSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Austin Crate & Freight Services',
  description: 'Complete range of white-glove specialty shipping services in Austin, Texas',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      item: {
        '@type': 'Service',
        '@id': 'https://austincrate.com/services/fine-art',
        name: 'Fine Art Shipping Services',
        description: 'Museum-quality crating and climate-controlled transport for paintings, sculptures, and collectibles in Austin, TX. Our expert team provides custom wooden crates, gallery-standard handling, and full insurance coverage. Climate-controlled vehicles maintain optimal temperature and humidity for valuable artwork. Professional art handlers trained in museum techniques. Real-time GPS tracking and installation services available.',
        serviceType: 'Fine Art Transportation',
        provider: {
          '@type': 'LocalBusiness',
          name: 'Austin Crate & Freight',
          telephone: '+15122409818',
        },
        areaServed: {
          '@type': 'City',
          name: 'Austin, Texas and Central Texas',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Fine Art Services',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Climate-Controlled Art Transport',
                description: 'Temperature and humidity regulated transport for sensitive artwork',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Custom Art Crating',
                description: 'Built-to-spec museum-quality wooden crates for each piece',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Art Installation Services',
                description: 'Professional hanging and placement by trained specialists',
              },
            },
          ],
        },
      },
    },
    {
      '@type': 'ListItem',
      position: 2,
      item: {
        '@type': 'Service',
        '@id': 'https://austincrate.com/services/furniture',
        name: 'Designer Furniture Shipping Services',
        description: 'White-glove furniture shipping for luxury and designer pieces in Austin, TX. Specialized handling includes professional disassembly, multi-layer protective wrapping, scratch-free transport, precision reassembly, and inside delivery to exact placement. Expert furniture technicians handle complex pieces. Full insurance coverage and debris removal included.',
        serviceType: 'Furniture Transportation',
        provider: {
          '@type': 'LocalBusiness',
          name: 'Austin Crate & Freight',
          telephone: '+15122409818',
        },
        areaServed: {
          '@type': 'City',
          name: 'Austin, Texas and Central Texas',
        },
      },
    },
    {
      '@type': 'ListItem',
      position: 3,
      item: {
        '@type': 'Service',
        '@id': 'https://austincrate.com/services/medical-equipment',
        name: 'Medical Equipment Transport Services',
        description: 'HIPAA-compliant medical equipment shipping in Austin, TX. Specialized transport for diagnostic imaging equipment, laboratory analyzers, surgical instruments, and patient monitors. Complete chain-of-custody documentation, temperature-controlled transport when required, calibration-safe handling, sterile packaging options. HIPAA-certified team with 24/7 monitoring and specialized insurance for medical devices.',
        serviceType: 'Medical Equipment Transportation',
        provider: {
          '@type': 'LocalBusiness',
          name: 'Austin Crate & Freight',
          telephone: '+15122409818',
        },
        areaServed: {
          '@type': 'City',
          name: 'Austin, Texas and Central Texas',
        },
        additionalType: 'https://en.wikipedia.org/wiki/Medical_device',
        certification: 'HIPAA Compliant',
      },
    },
  ],
};

export const breadcrumbSchema = (path: string) => {
  const baseUrl = 'https://austincrate.com';
  const breadcrumbs = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: baseUrl,
    },
  ];

  if (path.includes('/services')) {
    breadcrumbs.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Services',
      item: `${baseUrl}/services`,
    });

    if (path.includes('/fine-art')) {
      breadcrumbs.push({
        '@type': 'ListItem',
        position: 3,
        name: 'Fine Art Shipping',
        item: `${baseUrl}/services/fine-art`,
      });
    } else if (path.includes('/furniture')) {
      breadcrumbs.push({
        '@type': 'ListItem',
        position: 3,
        name: 'Designer Furniture Shipping',
        item: `${baseUrl}/services/furniture`,
      });
    } else if (path.includes('/medical-equipment')) {
      breadcrumbs.push({
        '@type': 'ListItem',
        position: 3,
        name: 'Medical Equipment Transport',
        item: `${baseUrl}/services/medical-equipment`,
      });
    }
  } else if (path === '/contact') {
    breadcrumbs.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Contact',
      item: `${baseUrl}/contact`,
    });
  } else if (path === '/about') {
    breadcrumbs.push({
      '@type': 'ListItem',
      position: 2,
      name: 'About',
      item: `${baseUrl}/about`,
    });
  } else if (path === '/buy-a-crate') {
    breadcrumbs.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Buy a Crate',
      item: `${baseUrl}/buy-a-crate`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs,
  };
};

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What types of items does Austin Crate ship?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Austin Crate & Freight specializes in white-glove shipping for fine art (paintings, sculptures, collectibles), designer furniture (luxury pieces, antiques, custom furniture), and medical equipment (diagnostic imaging, laboratory instruments, surgical equipment). We provide museum-quality crating, climate-controlled transport, and HIPAA-compliant handling for sensitive medical devices.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you provide climate-controlled shipping?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Austin Crate offers climate-controlled transport for temperature-sensitive items like fine art, antiques, and certain medical equipment. Our vehicles maintain consistent temperature and humidity levels throughout transport to prevent damage to valuable and sensitive items.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are you HIPAA compliant for medical equipment shipping?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Austin Crate is fully HIPAA-compliant for medical equipment transport. We provide complete chain-of-custody documentation, specialized handling to maintain equipment calibration, temperature-controlled transport when required, and our team is certified in HIPAA regulations for healthcare privacy and security.',
      },
    },
    {
      '@type': 'Question',
      name: 'What areas do you serve in Texas?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Austin Crate & Freight serves Austin, Round Rock, Cedar Park, Georgetown, Pflugerville, Leander, Lakeway, Bee Cave, Dripping Springs, Kyle, and all of Central Texas within a 50-mile radius. We also coordinate long-distance shipments nationwide.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you provide custom crating services?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we specialize in custom crating built to museum standards. Each crate is designed and constructed specifically for your item\'s dimensions and fragility level. Our wooden crates provide maximum protection with foam padding, moisture barriers, and reinforced construction suitable for fine art, valuable antiques, and sensitive equipment.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my shipment insured?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Austin Crate provides comprehensive insurance coverage for all shipments. We offer specialized insurance options designed for high-value art, designer furniture, and medical equipment. Coverage details and limits are discussed during your free consultation.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I get a quote for shipping services?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Contact Austin Crate at (512) 240-9818 or visit our office at 3112 Windsor Rd, Austin, TX 78703 for a free consultation and detailed quote. We assess your specific shipping needs, item dimensions, destination, and special handling requirements to provide accurate pricing.',
      },
    },
  ],
};

export const reviewSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Austin Crate & Freight',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '5.0',
    ratingCount: '28',
    bestRating: '5',
    worstRating: '1',
    reviewCount: '28',
  },
  review: [
    {
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: 'Sarah M.',
      },
      datePublished: '2024-10-15',
      reviewBody: 'Austin Crate handled my gallery\'s art collection with incredible care during our move. The custom crating was museum-quality and every piece arrived in perfect condition.',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5',
      },
    },
    {
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: 'Dr. James R.',
      },
      datePublished: '2024-09-22',
      reviewBody: 'HIPAA-compliant service was excellent. They transported our diagnostic equipment with full documentation and maintained calibration throughout. Highly professional.',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5',
      },
    },
  ],
};

// Product schema for Buy a Crate page
export const crateProductSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProductCollection',
  name: 'Custom Shipping Crates',
  description: 'Professional shipping crates in various sizes for fine art, furniture, and equipment',
  url: 'https://austincrate.com/buy-a-crate',
  hasProduct: [
    {
      '@type': 'Product',
      name: 'Small Shipping Crate',
      description: 'Perfect for small art pieces, sculptures, or decorative items',
      offers: {
        '@type': 'Offer',
        price: '149.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: 'Austin Crate & Freight',
        },
      },
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Dimensions',
          value: '24" x 18" x 18"',
        },
        {
          '@type': 'PropertyValue',
          name: 'Weight Capacity',
          value: '50 lbs',
        },
      ],
    },
    {
      '@type': 'Product',
      name: 'Medium Shipping Crate',
      description: 'Ideal for paintings, mirrors, or mid-size furniture pieces',
      offers: {
        '@type': 'Offer',
        price: '249.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: 'Austin Crate & Freight',
        },
      },
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Dimensions',
          value: '48" x 36" x 36"',
        },
        {
          '@type': 'PropertyValue',
          name: 'Weight Capacity',
          value: '150 lbs',
        },
      ],
    },
    {
      '@type': 'Product',
      name: 'Large Shipping Crate',
      description: 'Best for large furniture, multiple pieces, or equipment',
      offers: {
        '@type': 'Offer',
        price: '399.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: 'Austin Crate & Freight',
        },
      },
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Dimensions',
          value: '72" x 48" x 48"',
        },
        {
          '@type': 'PropertyValue',
          name: 'Weight Capacity',
          value: '300 lbs',
        },
      ],
    },
    {
      '@type': 'Product',
      name: 'Extra Large Shipping Crate',
      description: 'For oversized items, bulk shipments, or complex installations',
      offers: {
        '@type': 'Offer',
        price: '599.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: 'Austin Crate & Freight',
        },
      },
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Dimensions',
          value: '96" x 60" x 60"',
        },
        {
          '@type': 'PropertyValue',
          name: 'Weight Capacity',
          value: '500 lbs',
        },
      ],
    },
  ],
};
