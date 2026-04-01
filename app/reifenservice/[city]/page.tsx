import { createServiceCityPage } from '@/lib/seo/createServiceCityPage'

const { generateStaticParams, generateMetadata, Page } = createServiceCityPage('reifenservice')

export { generateStaticParams, generateMetadata }
export default Page
