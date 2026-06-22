import ExamPassedVideosRoute, {
  generateMetadata,
  generateStaticParams,
} from '../exam-passed-videos/page'

export const dynamic = 'force-dynamic'
export const revalidate = 600

export { generateMetadata, generateStaticParams }

export default ExamPassedVideosRoute
