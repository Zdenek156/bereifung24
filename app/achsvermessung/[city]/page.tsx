import { createServiceCityPage } from '@/lib/seo/createServiceCityPage'

const { generateStaticParams, generateMetadata, Page } = createServiceCityPage('achsvermessung')

export { generateStaticParams, generateMetadata }
export default Page
