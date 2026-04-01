import { createServiceCityPage } from '@/lib/seo/createServiceCityPage'

const { generateStaticParams, generateMetadata, Page } = createServiceCityPage('reifen-kaufen')

export { generateStaticParams, generateMetadata }
export default Page
