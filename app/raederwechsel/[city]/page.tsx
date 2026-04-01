import { createServiceCityPage } from '@/lib/seo/createServiceCityPage'

const { generateStaticParams, generateMetadata, Page } = createServiceCityPage('raederwechsel')

export { generateStaticParams, generateMetadata }
export default Page
