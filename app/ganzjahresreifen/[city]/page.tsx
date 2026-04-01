import { createServiceCityPage } from '@/lib/seo/createServiceCityPage'

const { generateStaticParams, generateMetadata, Page } = createServiceCityPage('ganzjahresreifen')

export { generateStaticParams, generateMetadata }
export default Page
