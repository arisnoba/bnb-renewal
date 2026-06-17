import {
  ArrowRight,
  CircleDot,
  ClipboardList,
  CreditCard,
  Phone,
  School,
  UserCheck,
} from 'lucide-react'
import Link from 'next/link'

import type { CenterSlug } from '@/lib/centers'
import { getCenterLabel } from '@/lib/centers'
import { cn } from '@/utilities/ui'

import { getAdmissionContent } from './admissionContent'
import type { ContentTable, ProcedureStep, TableRow } from './admissionContent'
import { SmoothAnchorLink } from './SmoothAnchorLink.client'

const navItems = [
  { href: '#procedure', label: '입학절차' },
  { href: '#tuition', label: '수강료/장학제도' },
  { href: '#leave-completion', label: '휴학/복학/수료' },
  { href: '#refund', label: '환불정책' },
] as const

const procedureIcons = [Phone, School, ClipboardList, CreditCard, UserCheck]

export function AdmissionGuide({ center }: { center: CenterSlug }) {
  const content = getAdmissionContent(center)
  const centerLabel = getCenterLabel(center)

  return (
    <main className="page page-light page-admission page-top-offset" data-center={center}>
      <section className="section-admission-intro section-p-block-sm bg-white">
        <div className="container">
          <header className="section-admission-intro__header">
            <p className="type-label-m font-bold text-brand">{centerLabel}</p>
            <h1 className="mt-4 type-headline-xl font-extrabold leading-[1.25] text-neutral-950">
              입학안내
            </h1>
          </header>

          <nav
            aria-label="입학안내 섹션 이동"
            className="section-admission-intro__nav sticky top-[var(--page-top-offset)] z-10 mt-10 border-b border-neutral-900/10 bg-white/95 backdrop-blur"
          >
            <div className="flex gap-8 overflow-x-auto md:gap-14">
              {navItems.map((item, index) => (
                <SmoothAnchorLink
                  className={cn(
                    'shrink-0 border-b-[3px] px-1 py-5 type-title-s font-bold transition-colors hover:text-brand',
                    index === 0 ? 'border-brand text-brand' : 'border-transparent text-neutral-950/45',
                  )}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </SmoothAnchorLink>
              ))}
            </div>
          </nav>
        </div>
      </section>

      <section
        className="section-admission-procedure section-p-b-sm scroll-mt-(--page-top-offset) bg-white"
        id="procedure"
      >
        <div className="container">
          <SectionTitle title="입학절차" />
          <div className="mt-8 overflow-hidden border-y border-neutral-200">
            {content.procedure.map((step, index) => (
              <ProcedureCard
                index={index}
                key={`${index}-${step.title}`}
                step={step}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        className="section-admission-tuition section-p-block-sm scroll-mt-(--page-top-offset) bg-neutral-50"
        id="tuition"
      >
        <div className="container">
          <SectionTitle title="수강료/장학제도 안내" />
          <div className="mt-8 flex flex-col gap-9">
            <TableGroup tables={content.tuitionTables} />
          </div>
        </div>
      </section>

      <section
        className="section-admission-leave section-p-block-sm scroll-mt-(--page-top-offset) bg-white"
        id="leave-completion"
      >
        <div className="container">
          <SectionTitle title={content.leaveTitle} />
          <div className="mt-8 grid gap-9">
            <TableGroup tables={content.leaveTables} />
          </div>
        </div>
      </section>

      <section
        className="section-admission-refund section-p-block-sm scroll-mt-(--page-top-offset) bg-neutral-50"
        id="refund"
      >
        <div className="container">
          <SectionTitle title="환불정책" />
          <p className="mt-6 type-body-m leading-[1.75] text-neutral-700">
            {content.refundIntro}
          </p>
          <div className="mt-8 grid gap-9">
            <TableGroup tables={content.refundTables} />
          </div>
        </div>
      </section>
    </main>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <header className="section-admission-title flex items-end justify-between gap-6">
      <h2 className="type-headline-m font-bold leading-tight text-neutral-950">
        {title}
      </h2>
    </header>
  )
}

function ProcedureCard({ index, step }: { index: number; step: ProcedureStep }) {
  const Icon = procedureIcons[index] ?? CircleDot

  return (
    <article className="section-admission-procedure__card grid gap-6 border-b border-neutral-200 py-6 last:border-b-0 md:grid-cols-4 md:gap-8 md:py-10">
      <header className="col-span-1 md:col-span-1">
        <div className="flex items-start md:items-center gap-2">
          <Icon aria-hidden="true" className="mt-0.5 size-5.5 text-brand" strokeWidth={2} />
          <h3 className="type-title-m font-semibold leading-normal text-neutral-900">
            {step.title}
          </h3>
        </div>
      </header>
      <div className="grid min-w-0 gap-6 col-span-1 md:col-span-3 type-body-m leading-[1.65] text-neutral-700">
        {step.body ? (
          <div className="grid gap-3">
            {step.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : null}
        {step.items ? (
          <div className="grid gap-6">
            {step.items.map((item, itemIndex) => (
              <div className="grid gap-3" key={`${item.title}-${itemIndex}`}>
                <h4 className="type-title-s font-semibold text-neutral-900">{item.title}</h4>
                <p>{item.body}</p>
                {item.cta ? <TextLink href={item.cta.href}>{item.cta.label}</TextLink> : null}
              </div>
            ))}
          </div>
        ) : null}
        {step.ctas ? (
          <div className="flex flex-wrap gap-3">
            {step.ctas.map((cta) => (
              <TextLink href={cta.href} key={cta.href}>
                {cta.label}
              </TextLink>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}

function TextLink({ children, href }: { children: string; href: string }) {
  const isInternal = href.startsWith('/')

  const className =
    'inline-flex w-fit items-center gap-2 rounded-full border border-neutral-900/35 px-5 py-3 type-label-m font-semibold leading-none text-neutral-950 transition-colors hover:border-brand hover:text-brand'
  const icon = <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2.2} />

  if (isInternal) {
    return (
      <Link className={className} href={href}>
        {children}
        {icon}
      </Link>
    )
  }

  return (
    <a className={className} href={href}>
      {children}
      {icon}
    </a>
  )
}

function TableGroup({ tables }: { tables: ContentTable[] }) {
  return (
    <>
      {tables.map((table) => (
        <DataTable
          caption={table.caption}
          columns={table.columns}
          key={table.title}
          minWidth={table.minWidth}
          notes={table.notes}
          rows={table.rows}
          title={table.title}
        />
      ))}
    </>
  )
}

function DataTable({
  caption,
  columns,
  minWidth: minWidthOverride,
  notes,
  rows,
  title,
}: {
  caption?: ContentTable['caption']
  columns: Array<{ key: string; label: string }>
  minWidth?: ContentTable['minWidth']
  notes?: ContentTable['notes']
  rows: TableRow[]
  title: string
}) {
  const minWidth = minWidthOverride ?? Math.max(680, columns.length * 170)

  return (
    <section className="section-admission-table">
      <h3 className="mb-5 type-title-l font-semibold leading-none text-neutral-950">
        {title}
      </h3>
      <div className="hidden overflow-x-auto md:block">
        <table
          className="w-full table-fixed border-collapse border border-neutral-200 bg-white text-left type-body-s"
          style={{ minWidth }}
        >
          {caption || notes ? (
            <caption className="caption-bottom pl-1 pt-4 text-left type-caption-l leading-[1.7] text-neutral-500">
              <TableCaptionContent caption={caption} notes={notes} />
            </caption>
          ) : null}
          <thead>
            <tr className="bg-neutral-100 text-neutral-950">
              {columns.map((column) => (
                <th className="border-b border-neutral-200 px-4 py-4 font-bold" key={column.key}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                className="border-t border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-50"
                key={`${title}-${rowIndex}`}
              >
                {columns.map((column) => (
                  <td className="whitespace-pre-line px-4 py-4 align-top leading-[1.65]" key={column.key}>
                    <TableCell columnKey={column.key} row={row} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MobileTable columns={columns} rows={rows} title={title} />
      {caption || notes ? (
        <div className="mt-4 text-left type-caption-m leading-[1.7] text-neutral-600 md:hidden">
          <TableCaptionContent caption={caption} notes={notes} />
        </div>
      ) : null}
    </section>
  )
}

function MobileTable({
  columns,
  rows,
  title,
}: {
  columns: Array<{ key: string; label: string }>
  rows: TableRow[]
  title: string
}) {
  const [primaryColumn, ...detailColumns] = columns

  if (!primaryColumn) return null

  return (
    <div className="section-admission-table__mobile border-y border-neutral-200 bg-white md:hidden">
      {rows.map((row, rowIndex) => (
        <article
          className="border-t border-neutral-200 px-4 py-5 first:border-t-0"
          key={`${title}-mobile-${rowIndex}`}
        >
          <h4 className="grid gap-1">
            <span className="type-caption-s font-bold text-neutral-500">{primaryColumn.label}</span>
            <span className="type-title-s font-bold leading-[1.45] text-neutral-950">
              <TableCell columnKey={primaryColumn.key} row={row} />
            </span>
          </h4>
          {detailColumns.length > 0 ? (
            <dl className="mt-4 grid gap-3">
              {detailColumns.map((column) => (
                <div className="grid gap-1" key={column.key}>
                  <dt className="type-caption-s font-bold text-neutral-500">{column.label}</dt>
                  <dd className="whitespace-pre-line type-body-s leading-[1.65] text-neutral-700">
                    <TableCell columnKey={column.key} row={row} />
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </article>
      ))}
    </div>
  )
}

function TableCaptionContent({
  caption,
  notes,
}: {
  caption?: ContentTable['caption']
  notes?: ContentTable['notes']
}) {
  return (
    <>
      {caption ? (
        <ul className="grid list-disc gap-1 pl-5 marker:text-neutral-500">
          {caption.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {notes ? (
        <dl className={cn('section-admission-table__notes grid gap-1', caption ? 'mt-2' : '')}>
          {notes.map((note) => (
            <div
              className="flex scroll-mt-(--page-top-offset) items-baseline gap-2"
              id={footnoteId(note.marker)}
              key={note.marker}
            >
              <dt className="shrink-0 text-neutral-950">{note.marker})</dt>
              <dd>{note.body}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </>
  )
}

function TableCell({ columnKey, row }: { columnKey: string; row: TableRow }) {
  const value = row[columnKey]

  if (!value) return '-'

  if (columnKey === 'reason' && row.reasonNote) {
    return (
      <>
        {value}
        <sup className="relative ml-1 text-[0.72em] leading-none">
          <SmoothAnchorLink
            aria-label={`${row.reasonNote}) 주석으로 이동`}
            className="font-medium text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            href={`#${footnoteId(row.reasonNote)}`}
          >
            {row.reasonNote})
          </SmoothAnchorLink>
        </sup>
      </>
    )
  }

  return value
}

function footnoteId(marker: string) {
  return `refund-note-${marker}`
}
