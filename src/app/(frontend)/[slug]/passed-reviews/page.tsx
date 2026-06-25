import ExamPassedReviewsRoute, {
  generateMetadata,
  generateStaticParams,
} from '../exam-passed-reviews/page'

export const revalidate = 600

export { generateMetadata, generateStaticParams }

export default ExamPassedReviewsRoute
