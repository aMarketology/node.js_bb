// Content Schema for CMS
// This defines the structure of editable content

export interface HeroSection {
  id: string
  badge: string
  heading1: string
  heading2: string
  description: string
  ctaPrimary: {
    text: string
    phone: string
  }
  ctaSecondary: {
    text: string
    link: string
  }
  stats: Array<{
    value: string
    label: string
  }>
}

export interface ServiceCard {
  id: string
  icon: string // SVG path or icon name
  title: string
  description: string
  features: string[]
  link: string
}

export interface ServicesSection {
  id: string
  badge: string
  heading: string
  subheading: string
  services: ServiceCard[]
}

export interface WhyChooseUsSection {
  id: string
  badge: string
  heading: string
  headingHighlight: string
  description: string
  features: Array<{
    title: string
    description: string
  }>
  rating: {
    score: string
    reviews: number
    description: string
  }
  additionalStats: Array<{
    value: string
    label: string
  }>
}

export interface ServiceAreasSection {
  id: string
  badge: string
  heading: string
  subheading: string
  cities: string[]
}

export interface CTASection {
  id: string
  heading: string
  headingHighlight: string
  description: string
  ctaPrimary: {
    text: string
    phone: string
  }
  ctaSecondary: {
    text: string
    link: string
  }
  address: string
}

export interface PageContent {
  hero: HeroSection
  services: ServicesSection
  whyChooseUs: WhyChooseUsSection
  serviceAreas: ServiceAreasSection
  cta: CTASection
  seo: {
    title: string
    description: string
    keywords: string[]
  }
}

// Default content that can be loaded from database
export const defaultContent: PageContent = {
  hero: {
    id: 'hero-1',
    badge: 'Tampa Bay, Florida',
    heading1: 'Tampa Bay',
    heading2: 'Concrete Coatings',
    description: 'Precision-engineered epoxy, metallic resin, and polished concrete solutions for discerning clients.',
    ctaPrimary: {
      text: '(727) 743-7242',
      phone: '(727) 743-7242'
    },
    ctaSecondary: {
      text: 'Schedule Consultation',
      link: '/contact'
    },
    stats: [
      { value: '20+', label: 'Years Experience' },
      { value: '5.0', label: 'Google Rating' },
      { value: '1000+', label: 'Projects Done' },
      { value: '100%', label: 'Satisfaction' }
    ]
  },
  services: {
    id: 'services-1',
    badge: 'Our Services',
    heading: 'Premium Solutions',
    subheading: 'Industry-leading coatings engineered for durability and elegance',
    services: [
      {
        id: 'service-1',
        icon: 'shield',
        title: 'Epoxy Garage Floors',
        description: 'Professional-grade epoxy resin coating creating a glossy, seamless surface resistant to chemicals, oil, and wear. Lasts 10-20 years.',
        features: ['Chemical Resistant', 'High Gloss Finish', 'Easy Maintenance', 'Long-Lasting'],
        link: '/services'
      },
      {
        id: 'service-2',
        icon: 'sparkles',
        title: 'Metallic Resin Floors',
        description: 'Luxury epoxy with metallic pigments creating stunning 3D marble-like effects. Durable, stain-resistant, and visually striking. 15+ year lifespan.',
        features: ['3D Visual Effects', 'Custom Colors', 'Luxury Aesthetic', '15+ Year Life'],
        link: '/services'
      },
      {
        id: 'service-3',
        icon: 'lightning',
        title: 'Concrete Polishing',
        description: 'Diamond-abrasive grinding creating smooth, glossy finishes. Densifier hardens surfaces while sealant protects against stains and moisture.',
        features: ['Low Maintenance', 'Eco-Friendly', 'Slip Resistant', 'Cost Effective'],
        link: '/services'
      }
    ]
  },
  whyChooseUs: {
    id: 'why-choose-us-1',
    badge: 'Why Choose Us',
    heading: "Tampa Bay's Premier",
    headingHighlight: 'Concrete Specialists',
    description: "With over 20 years of experience, we've established ourselves as Tampa Bay's trusted concrete coating specialists. Our commitment to excellence, precision craftsmanship, and customer satisfaction sets us apart.",
    features: [
      { title: 'Licensed & Insured', description: 'Fully certified professionals' },
      { title: 'Premium Materials', description: 'Industry-leading products' },
      { title: 'Lifetime Warranty', description: 'Peace of mind guarantee' },
      { title: 'Expert Installation', description: 'Master-level craftsmanship' }
    ],
    rating: {
      score: '5.0',
      reviews: 28,
      description: 'Rated 5.0 from 28 verified reviews on Google'
    },
    additionalStats: [
      { value: '$2M+', label: 'Projects Value' },
      { value: '28', label: '5-Star Reviews' }
    ]
  },
  serviceAreas: {
    id: 'service-areas-1',
    badge: 'Service Areas',
    heading: 'Serving Tampa Bay',
    subheading: 'Tampa • St. Petersburg • Clearwater • Brandon • Riverview & More',
    cities: ['Tampa', 'St. Petersburg', 'Clearwater', 'Brandon', 'Riverview', 'Lutz', 'Carrollwood', "Land O' Lakes", 'Temple Terrace', 'Plant City']
  },
  cta: {
    id: 'cta-1',
    heading: 'Ready to Transform',
    headingHighlight: 'Your Space?',
    description: 'Get a free consultation and quote today. Let our experts bring your vision to life.',
    ctaPrimary: {
      text: '(727) 743-7242',
      phone: '(727) 743-7242'
    },
    ctaSecondary: {
      text: 'Request Free Quote',
      link: '/contact'
    },
    address: '386 Tavernier Cir, Oldsmar, FL 34677'
  },
  seo: {
    title: 'Tampa Bay Concrete Coatings | Premium Epoxy & Polished Concrete',
    description: 'Professional concrete coating services in Tampa Bay. Expert epoxy garage floors, metallic resin, and polished concrete. 20+ years experience.',
    keywords: ['concrete coatings tampa', 'epoxy floors', 'metallic resin', 'polished concrete', 'garage floors tampa']
  }
}
