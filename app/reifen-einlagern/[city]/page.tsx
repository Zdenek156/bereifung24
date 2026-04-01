import { createServiceCityPage } from '@/lib/seo/createServiceCityPage'

const { generateStaticParams, generateMetadata, Page } = createServiceCityPage('reifen-einlagern')

export { generateStaticParams, generateMetadata }
export default Page
