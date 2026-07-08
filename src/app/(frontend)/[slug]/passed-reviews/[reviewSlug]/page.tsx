import ExamPassedReviewDetailRoute, {
  generateMetadata,
  generateStaticParams,
} from '../../exam-passed-reviews/[reviewSlug]/page'

export const revalidate = 600
export const dynamicParams = true

export { generateMetadata, generateStaticParams }

export default ExamPassedReviewDetailRoute
