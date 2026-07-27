type SubmitResult = {
  res: Pick<Response, 'ok'>
}

export function shouldRedirectAfterInquirySave(result: SubmitResult | void) {
  return result?.res.ok === true
}
