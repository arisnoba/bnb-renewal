import ExamPassedReviewDetailRoute, {
  generateMetadata,
} from '../../exam-passed-reviews/[reviewSlug]/page'

export const revalidate = 600
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export { generateMetadata }

export default ExamPassedReviewDetailRoute
