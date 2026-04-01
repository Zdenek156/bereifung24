import { createServiceCityPage } from '@/lib/seo/createServiceCityPage'

const { generateStaticParams, generateMetadata, Page } = createServiceCityPage('reifenwechsel')

export { generateStaticParams, generateMetadata }
export default Page
