import ExamPassedReviewDetailRoute, {
  generateMetadata,
  generateStaticParams,
} from '../../exam-passed-reviews/[reviewSlug]/page'

export const dynamic = 'force-dynamic'
export const revalidate = 600

export { generateMetadata, generateStaticParams }

export default ExamPassedReviewDetailRoute
