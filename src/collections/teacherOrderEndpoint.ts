import { createHash } from 'node:crypto'

import {
  addDataAndFileToRequest,
  commitTransaction,
  headersWithCors,
  initTransaction,
  killTransaction,
  type Endpoint,
  type PayloadRequest,
  type Where,
} from 'payload'

import { centers, type CenterSlug } from '@/lib/centers'
import {
  teacherBelongsToOrderCenter,
  teacherOrderFieldName,
  teacherOrderValue,
  type TeacherOrderDocument,
} from '@/lib/teacherOrder'

import { isGlobalAdminUser, userCenterValue } from './shared'
import { revalidateFrontendPaths } from './revalidateFrontend'

type TeacherOrderRow = TeacherOrderDocument & {
  id: number
  name?: string | null
  status?: string | null
  updatedAt?: string | null
}

type TeacherOrderRequestData = {
  center?: unknown
  revision?: unknown
  teacherIds?: unknown
}

function jsonResponse(req: PayloadRequest, status: number, body: Record<string, unknown>) {
  return Response.json(body, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status,
  })
}

function firstValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value
}

function requestedCenter(value: unknown): CenterSlug | undefined {
  const center = firstValue(value)

  return typeof center === 'string' && center in centers ? (center as CenterSlug) : undefined
}

function manageableCenters(user: unknown): CenterSlug[] {
  if (isGlobalAdminUser(user)) {
    return Object.keys(centers) as CenterSlug[]
  }

  const center = userCenterValue(user)

  return center && center in centers ? [center as CenterSlug] : []
}

function canManageCenter(user: unknown, center: CenterSlug) {
  return manageableCenters(user).includes(center)
}

function teacherCenterWhere(center: CenterSlug): Where {
  return {
    or: [
      {
        centers: {
          contains: center,
        },
      },
      {
        centers: {
          contains: 'all',
        },
      },
    ],
  }
}

function teacherOrderRevision(docs: TeacherOrderRow[], center: CenterSlug) {
  const state = [...docs]
    .sort((left, right) => left.id - right.id)
    .map((doc) => [doc.id, teacherOrderValue(doc, center), doc.updatedAt ?? ''])

  return createHash('sha256').update(JSON.stringify(state)).digest('hex')
}

async function findTeacherOrderRows(req: PayloadRequest, center: CenterSlug) {
  const orderField = teacherOrderFieldName(center)
  const result = await req.payload.find({
    collection: 'teachers',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    req,
    select: {
      centers: true,
      displayOrder: true,
      id: true,
      name: true,
      status: true,
      updatedAt: true,
      [orderField]: true,
    } as never,
    sort: [orderField, 'id'],
    where: teacherCenterWhere(center),
  })

  return (result.docs as TeacherOrderRow[])
    .filter((doc) => teacherBelongsToOrderCenter(doc.centers, center))
    .sort((left, right) => {
      const leftOrder = teacherOrderValue(left, center) ?? Number.MAX_SAFE_INTEGER
      const rightOrder = teacherOrderValue(right, center) ?? Number.MAX_SAFE_INTEGER

      return leftOrder - rightOrder || left.id - right.id
    })
}

function requestedTeacherIDs(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const ids = value.map((item) =>
    typeof item === 'number'
      ? item
      : typeof item === 'string' && item.trim()
        ? Number(item)
        : Number.NaN
  )

  if (ids.some((id) => !Number.isSafeInteger(id) || id <= 0) || new Set(ids).size !== ids.length) {
    return undefined
  }

  return ids
}

function sameTeacherSet(currentDocs: TeacherOrderRow[], requestedIDs: number[]) {
  if (currentDocs.length !== requestedIDs.length) {
    return false
  }

  const currentIDs = new Set(currentDocs.map((doc) => doc.id))

  return requestedIDs.every((id) => currentIDs.has(id))
}

async function getTeacherOrder(req: PayloadRequest) {
  const center = requestedCenter(req.query?.center)

  if (!req.user || !center || !canManageCenter(req.user, center)) {
    return jsonResponse(req, 403, {
      message: '이 센터의 강사진 순서를 관리할 권한이 없습니다.',
    })
  }

  const docs = await findTeacherOrderRows(req, center)

  return jsonResponse(req, 200, {
    center,
    docs,
    manageableCenters: manageableCenters(req.user),
    revision: teacherOrderRevision(docs, center),
  })
}

async function saveTeacherOrder(req: PayloadRequest) {
  await addDataAndFileToRequest(req)

  const data = (req.data ?? {}) as TeacherOrderRequestData
  const center = requestedCenter(data.center)
  const teacherIDs = requestedTeacherIDs(data.teacherIds)
  const revision = typeof data.revision === 'string' ? data.revision : undefined

  if (!req.user || !center || !canManageCenter(req.user, center)) {
    return jsonResponse(req, 403, {
      message: '이 센터의 강사진 순서를 관리할 권한이 없습니다.',
    })
  }

  if (!teacherIDs || !revision) {
    return jsonResponse(req, 400, {
      message: '저장할 강사진 순서가 올바르지 않습니다.',
    })
  }

  const currentDocs = await findTeacherOrderRows(req, center)

  if (
    !sameTeacherSet(currentDocs, teacherIDs) ||
    teacherOrderRevision(currentDocs, center) !== revision
  ) {
    return jsonResponse(req, 409, {
      message: '강사진 정보가 변경되었습니다. 새로고침 후 다시 정렬해 주세요.',
    })
  }

  const currentByID = new Map(currentDocs.map((doc) => [doc.id, doc]))
  const orderField = teacherOrderFieldName(center)
  const updates = teacherIDs.flatMap((id, index) => {
    const doc = currentByID.get(id)
    const nextOrder = index + 1

    return doc?.[orderField] === nextOrder ? [] : [{ id, order: nextOrder }]
  })

  const previousDisableRevalidate = req.context.disableRevalidate
  let startedTransaction = false

  try {
    req.context.disableRevalidate = true
    startedTransaction = await initTransaction(req)

    for (const update of updates) {
      await req.payload.update({
        collection: 'teachers',
        context: req.context,
        data: {
          [orderField]: update.order,
        } as never,
        depth: 0,
        id: update.id,
        overrideAccess: true,
        overrideLock: true,
        req,
      })
    }

    if (startedTransaction) {
      await commitTransaction(req)
    }
  } catch (error) {
    if (startedTransaction) {
      await killTransaction(req)
    }

    req.payload.logger.error({
      err: error,
      msg: `Failed to reorder teachers for ${center}`,
    })

    return jsonResponse(req, 500, {
      message: '강사진 순서를 저장하지 못했습니다.',
    })
  } finally {
    req.context.disableRevalidate = previousDisableRevalidate
  }

  revalidateFrontendPaths({
    paths: [`/${center}`, `/${center}/teachers`],
    reason: `teacher-order-${center}`,
    req,
    tags: [`frontend_teachers_${center}`],
  })

  const docs = await findTeacherOrderRows(req, center)

  return jsonResponse(req, 200, {
    center,
    docs,
    manageableCenters: manageableCenters(req.user),
    message:
      updates.length > 0
        ? `강사진 ${updates.length}명의 순서를 저장했습니다.`
        : '변경된 순서가 없습니다.',
    revision: teacherOrderRevision(docs, center),
    updatedCount: updates.length,
  })
}

export const teacherOrderEndpoints: Endpoint[] = [
  {
    handler: getTeacherOrder,
    method: 'get',
    path: '/order',
  },
  {
    handler: saveTeacherOrder,
    method: 'post',
    path: '/order',
  },
]
