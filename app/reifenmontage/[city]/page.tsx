import { createServiceCityPage } from '@/lib/seo/createServiceCityPage'

const { generateStaticParams, generateMetadata, Page } = createServiceCityPage('reifenmontage')

export { generateStaticParams, generateMetadata }
export default Page
