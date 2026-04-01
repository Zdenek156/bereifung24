import { createServiceCityPage } from '@/lib/seo/createServiceCityPage'

const { generateStaticParams, generateMetadata, Page } = createServiceCityPage('sommerreifen')

export { generateStaticParams, generateMetadata }
export default Page
