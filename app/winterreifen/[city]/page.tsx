import { createServiceCityPage } from '@/lib/seo/createServiceCityPage'

const { generateStaticParams, generateMetadata, Page } = createServiceCityPage('winterreifen')

export { generateStaticParams, generateMetadata }
export default Page
