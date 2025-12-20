import CategoryPage from '../components/CategoryPage'

export default function PoliticsPage() {
  return (
    <CategoryPage
      category="politics"
      title="Politics Markets"
      description="Trade on elections, legislation, and political events. Make predictions on political outcomes worldwide."
      icon={
        <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      }
    />
  )
}
