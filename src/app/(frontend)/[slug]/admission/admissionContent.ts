import type { CenterSlug } from '@/lib/centers'

export type AdmissionContent = {
  leaveTitle: string
  leaveTables: ContentTable[]
  procedure: ProcedureStep[]
  refundIntro: string
  refundTables: ContentTable[]
  tuitionTables: ContentTable[]
}

export type ContentTable = {
  caption?: string[]
  columns: TableColumn[]
  notes?: Array<{
    body: string
    marker: string
  }>
  rows: TableRow[]
  title: string
}

export type ProcedureStep = {
  body?: string[]
  ctas?: Array<{
    href: string
    label: string
  }>
  items?: Array<{
    body: string
    cta?: {
      href: string
      label: string
    }
    title: string
  }>
  title: string
}

export type TableColumn = {
  key: string
  label: string
}

export type TableRow = Record<string, string>

const refundIntro =
  '배우앤배움은 학원의 설립ㆍ운영 및 과외교습에 관한 법률 시행령을 준수하며, 학원 내 환불정책은 교육청 기준에 따라 진행합니다. 아래 기준은 시행령 제18조제3항 관련 별표 4 교습비등 반환기준을 기준으로 정리합니다.'

const classColumns = [
  { key: 'course', label: '교육과정' },
  { key: 'className', label: 'Class' },
  { key: 'target', label: '대상 및 주요 내용' },
]

const simpleClassColumns = [
  { key: 'className', label: 'Class' },
  { key: 'target', label: '대상 및 주요 내용' },
]

const artTimeColumns = [
  { key: 'type', label: '구분' },
  { key: 'day', label: '요일' },
  { key: 'time', label: '시간' },
  { key: 'duration', label: '수업시간' },
]

const tuitionColumns = [
  { key: 'course', label: '과정' },
  { key: 'day', label: '수업 요일' },
  { key: 'basis', label: '기준' },
  { key: 'fee', label: '정상 수강료' },
]

const scholarshipColumns = [
  { key: 'type', label: '구분' },
  { key: 'target', label: '적용대상' },
  { key: 'benefit', label: '혜택' },
]

const examTuitionColumns = [
  { key: 'course', label: '과정' },
  { key: 'target', label: '대상' },
  { key: 'composition', label: '수업 구성' },
  { key: 'fee', label: '수강료' },
]

const examScholarshipColumns = [
  { key: 'name', label: '명칭' },
  { key: 'target', label: '대상자' },
  { key: 'benefit', label: '혜택' },
]

const teenTuitionColumns = [
  { key: 'course', label: '과정' },
  { key: 'day', label: '요일' },
  { key: 'time', label: '시간' },
  { key: 'duration', label: '수업시간' },
  { key: 'fee', label: '정상 수강료' },
]

const kidsTuitionColumns = [
  { key: 'course', label: '과정' },
  { key: 'day', label: '수업 요일' },
  { key: 'classSize', label: '반편성' },
  { key: 'duration', label: '수업시간' },
  { key: 'fee', label: '정상 수강료' },
]

const leaveColumns = [
  { key: 'category', label: '구분' },
  { key: 'basis', label: '기준' },
  { key: 'detail', label: '내용' },
]

const completionColumns = [
  { key: 'className', label: 'Class' },
  { key: 'condition', label: '수료 기준' },
  { key: 'benefit', label: '수료 후 혜택' },
  { key: 'period', label: '서비스 기간' },
]

const reinforcementColumns = [
  { key: 'category', label: '구분' },
  { key: 'detail', label: '내용' },
]

const confirmationColumns = [
  { key: 'category', label: '확인 필요 항목' },
  { key: 'detail', label: '비고' },
]

const refundColumns = [
  { key: 'reason', label: '반환 사유' },
  { key: 'timing', label: '반환 발생일' },
  { key: 'amount', label: '반환 금액' },
]

const leaveRefundColumns = [
  { key: 'period', label: '휴학신청기간' },
  { key: 'amount', label: '휴학 후 퇴교 시 교습비 반환금액' },
]

const commonRefundTables: ContentTable[] = [
  {
    columns: refundColumns,
    notes: [
      {
        body: '시행령 제18조제2항제1호, 제1호의2 및 제2호의 반환사유에 해당하는 경우',
        marker: '1',
      },
      {
        body: '시행령 제18조제2항제3호의 반환사유에 해당하는 경우',
        marker: '2',
      },
    ],
    rows: [
      {
        amount: '이미 납부한 교습비를 일할 계산한 금액',
        reason: '교습정지, 자진폐원, 등록말소 등',
        reasonNote: '1',
        timing: '교습을 할 수 없거나 교습 장소를 제공할 수 없게 된 날',
      },
      {
        amount: '이미 납부한 교습비 전액',
        reason: '수강생 사유(교습기간 1개월 이내)',
        reasonNote: '2',
        timing: '교습 시작 전',
      },
      {
        amount: '이미 납부한 교습비의 2/3',
        reason: '수강생 사유(교습기간 1개월 이내)',
        reasonNote: '2',
        timing: '총 교습시간 1/3 경과 전',
      },
      {
        amount: '이미 납부한 교습비의 1/2',
        reason: '수강생 사유(교습기간 1개월 이내)',
        reasonNote: '2',
        timing: '총 교습시간 1/2 경과 전',
      },
      {
        amount: '반환하지 않음',
        reason: '수강생 사유(교습기간 1개월 이내)',
        reasonNote: '2',
        timing: '총 교습시간 1/2 경과 후',
      },
    ],
    title: '교습비 반환 기준',
  },
  {
    columns: leaveRefundColumns,
    rows: [
      { amount: '일반 환불정책에 따라 교습비 반환', period: '90일 이내(90일 포함)' },
      { amount: '반환하지 않음', period: '91일째부터' },
    ],
    title: '장기휴학 이후 환불정책',
  },
]

const artTuitionTables: ContentTable[] = [
  {
    columns: classColumns,
    rows: [
      { className: 'I Class', course: '초급과정', target: '연기를 처음 배우는 수강생' },
      {
        className: 'R Class',
        course: '중급과정',
        target: 'I Class 이수자 또는 타 연기학원 6개월 이상 이수자. 외부작품 오디션은 R Class부터 응시 가능',
      },
      {
        className: 'U Class',
        course: '고급과정',
        target: 'R Class 이수자, 타 학원 18개월 이상 이수자, 2~4년제 전공자, 매니지먼트 위탁배우, 드라마/영화/연극 경력자',
      },
      {
        className: 'D Class',
        course: '전문과정',
        target: 'U Class 이수자 중 승급자, 매니지먼트팀/캐스팅팀 오디션 합격자, 전공자 테스트 합격자, 조단역 이상 경력자 등',
      },
      {
        className: 'A Class',
        course: '배우과정',
        target: '드라마/영화 주조연 이상 경력자, 독립영화제/연극제 연기상 수상자',
      },
    ],
    title: 'Class 안내',
  },
  {
    columns: artTimeColumns,
    rows: [
      {
        day: '월 목 / 화 금',
        duration: '180분 이상',
        time: '오전 10:30~13:30, 오후 15:00~18:00, 저녁 19:00~22:00',
        type: '주 2회',
      },
      {
        day: '토 일',
        duration: '180분 이상',
        time: '오전 10:00~13:00, 오후 13:00~16:00, 오후 16:00~19:00',
        type: '주 2회',
      },
      {
        day: '월 / 화 / 목 / 금',
        duration: '180분 이상',
        time: '오전 10:30~13:30, 오후 15:00~18:00, 저녁 19:00~22:00',
        type: '주 1회',
      },
      {
        day: '수',
        duration: '180분 이상',
        time: '오전 10:00~13:00, 오후 13:00~16:00, 오후 16:00~19:00, 저녁 19:00~22:00',
        type: '주 1회',
      },
      
    ],
    title: '수업 시간대',
  },
  {
    caption: [
      '수강료는 주 1회반 월 4회, 주 2회반 월 8회 기준입니다.',
      '재학기간별 장학 적용은 아래 장학 및 중복수강 혜택 표를 참고하세요.',
    ],
    columns: tuitionColumns,
    rows: [
      {
        basis: '월 8회',
        course: '성인반',
        day: '월목 / 화금 / 토일 주 2회',
        fee: '550,000원',
      },
      {
        basis: '월 4회',
        course: '성인반',
        day: '월 / 화 / 수 / 목 / 금 / 토 주 1회',
        fee: '380,000원',
      },
    ],
    title: '수강료',
  },
  {
    caption: ['재학기간에 따른 장학혜택은 수강생 본인이 운영팀에 확인 요청한 뒤 적용됩니다.(2020년 1월 시행)'],
    columns: scholarshipColumns,
    rows: [
      { benefit: '수강료 5% 장학혜택', target: '1년 초과 재학', type: '장기 재학 장학' },
      { benefit: '수강료 10% 장학혜택', target: '2년 초과 재학', type: '장기 재학 장학' },
      { benefit: '수강료 20% 장학혜택', target: '5년 초과 재학', type: '장기 재학 장학' },
      {
        benefit: '추가수업분 40% 할인',
        target: '주 2회 + 주 2회(추가 수업), \n주 2회 + 주 1회(추가 수업), \n주 1회 + 주 1회(추가 수업)',
        type: '중복수강 혜택',
      },
    ],
    title: '장학 및 중복수강 혜택',
  },
]

const artLeaveTables: ContentTable[] = [
  {
    columns: leaveColumns,
    rows: [
      {
        basis: '휴학일 최소 3일 전',
        category: '휴학 신청',
        detail: '당일 휴학은 불가하며, 공휴일을 앞뒤로 붙인 휴학 신청도 제한됩니다.',
      },
      {
        basis: '휴학기간 3개월 이내',
        category: '3개월 이내 휴학',
        detail: '스타카드 이용을 제외한 드라마/영화/광고 오디션 서비스, 학원시설 이용, 캐스팅 리스트업 서비스는 동일하게 제공됩니다.',
      },
      {
        basis: '휴학기간 3개월 초과',
        category: '3개월 초과 휴학',
        detail: '드라마/영화/광고/소속사 오디션 서비스, 스타카드, 학원시설 이용은 중단되며 잔여일은 소멸됩니다. 단, 복학 예정자는 캐스팅 리스트업 서비스가 유지됩니다.',
      },
    ],
    title: '휴학/복학 기준',
  },
  {
    columns: completionColumns,
    rows: [
      { benefit: '해당 없음', className: '초급 I Class', condition: '해당 없음', period: '해당 없음' },
      { benefit: '해당 없음', className: '중급 R Class', condition: '해당 없음', period: '해당 없음' },
      {
        benefit: 'BNB 멤버쉽 오디션 서비스, 매니지먼트 서비스',
        className: '고급 U Class',
        condition: 'D Class 승급 또는 U Class 12개월 이상 수강',
        period: '2년',
      },
      {
        benefit: 'BNB 멤버쉽 오디션 서비스, 매니지먼트 서비스, 에이전시 캐스팅 서비스',
        className: '전문 D Class',
        condition: 'A Class 승급 또는 D Class 12개월 이상 수강',
        period: '3년',
      },
      {
        benefit: 'BNB 멤버쉽 오디션 서비스, 매니지먼트 서비스, 에이전시 캐스팅 서비스',
        className: '배우 A Class',
        condition: 'A Class 12개월 이상 수강',
        period: '5년',
      },
    ],
    title: '수료 서비스',
  },
]

const examTuitionTables: ContentTable[] = [
  {
    columns: examTuitionColumns,
    rows: [
      {
        composition: '주 5회, 월 60시간, 회당 3시간, 매월 모의고사',
        course: '평일 입시반',
        fee: '850,000원/월',
        target: '고등학교 3학년 및 재수생',
      },
      {
        composition: '주 4회, 월 48시간, 회당 3시간, 매월 모의고사',
        course: '주말 입시반',
        fee: '700,000원/월',
        target: '고등학교 3학년, 재수생, 지방 거주자, 평일 내신관리 병행 학생 등',
      },
      {
        composition: '주 3회, 월 24시간, 회당 2시간, 매월 모의고사, 주말반 운영',
        course: '예비입시반',
        fee: '450,000원/월',
        target: '고등학교 1~2학년 연영과 진학 희망자',
      },
    ],
    title: '수강료',
  },
  {
    caption: ['입시센터 장학제도는 중복혜택이 불가합니다.'],
    columns: examScholarshipColumns,
    rows: [
      { benefit: '50%', name: '근로장학생', target: '학원 업무 및 선생님을 도와주는 학생. 재수생만 가능' },
      { benefit: '10%', name: '실기우수장학', target: '전년도 수도권 대학 수시 1단계 전형에서 3개 대학 이상 합격자' },
      { benefit: '10%', name: '실기우수장학', target: '예술계 또는 연기 관련 고교 재학생 및 졸업생' },
      { benefit: '10%', name: '복지장학생', target: '기초생활수급자 자녀. 자료 증빙 필요' },
      { benefit: '10%', name: '복지장학생', target: '국가유공자 또는 유공자 자녀' },
      { benefit: '10%', name: '특별장학생', target: '외국인 또는 재외국민 전형 응시 가능자' },
      { benefit: '10%', name: '내신장학생', target: '고교 내신 전체 성적 2등급 이상' },
      { benefit: '10%', name: '내신장학생', target: '교과목 언어, 외국어, 사회탐구 1등급 이상' },
    ],
    title: '장학제도',
  },
]

const examLeaveTables: ContentTable[] = [
  {
    columns: confirmationColumns,
    rows: [
      { category: '휴학 신청 가능 여부 및 신청 기한', detail: '타 센터와 동일하게 단기/장기휴학을 둘지 확인 필요' },
      { category: '복학 시 기존 반 유지 기준', detail: 'T.O와 입시 일정 기준 반영 필요' },
      { category: '수료 기준 및 수료 후 혜택', detail: '입시 과정 특성상 별도 수료 서비스를 운영하는지 확인 필요' },
      { category: '결석 또는 보강 기준', detail: '모의고사, 평가회, 실기 수업 결석 처리 기준 확인 필요' },
    ],
    title: '운영 정책 확인 필요 항목',
  },
]

const highteenTuitionTables: ContentTable[] = [
  {
    columns: simpleClassColumns,
    rows: [
      {
        className: 'I Class',
        target: '연기를 처음 배우는 수강생 또는 매체연기에 능숙하지 않은 수강생. 레벨테스트 후 배정',
      },
      {
        className: 'R Class',
        target: 'I Class 이수자, 타 연기학원 8개월 이상 이수자, 매체촬영 경력자. 레벨테스트 후 배정',
      },
      {
        className: 'U Class',
        target: 'R Class 이수자, 매니지먼트 위탁배우 수강생. 레벨테스트 후 배정',
      },
      {
        className: 'DA Class',
        target: 'U Class 이수자, 매니지먼트 위탁배우 수강생. 레벨테스트 후 배정',
      },
    ],
    title: 'Class 안내',
  },
  {
    caption: ['기초생활수급자 장학 수강료는 아래 장학제도 표의 청소년 장학지원 기준을 참고하세요.'],
    columns: teenTuitionColumns,
    rows: [
      { course: '청소년반', day: '월목', duration: '420분', fee: '450,000원', time: '오후 18:00~21:30' },
      { course: '청소년반', day: '화금', duration: '420분', fee: '450,000원', time: '오후 18:00~21:30' },
      { course: '청소년반', day: '토', duration: '330분', fee: '350,000원', time: '오전 10:00~오후 16:30' },
      { course: '청소년반', day: '일', duration: '330분', fee: '350,000원', time: '오전 10:00~오후 16:30' },
    ],
    title: '수업 시간대 및 수강료',
  },
  {
    caption: [
      '기초생활수급자 장학 수강료는 월목/화금 405,000원, 토/일 315,000원입니다.',
      '수료자 장학지원은 18개월, 30개월이 기준이며 19개월차와 31개월차부터 적용됩니다.',
    ],
    columns: scholarshipColumns,
    rows: [
      { benefit: '수강료표 기준 별도 장학 수강료 적용', target: '기초생활수급자', type: '청소년 장학지원' },
      { benefit: '5% 장학혜택 적용', target: '18개월 초과 재학', type: '수료자 장학지원' },
      { benefit: '10% 장학혜택 적용', target: '30개월 초과 재학', type: '수료자 장학지원' },
    ],
    title: '장학제도',
  },
]

const highteenLeaveTables: ContentTable[] = [
  {
    columns: leaveColumns,
    rows: [
      {
        basis: '1주일 이내',
        category: '단기휴학',
        detail: '기존 Class 유지가 가능하며, 당일 단기휴학 신청은 불가합니다. 단기휴학 기간에도 스타카드, 시설 이용, 오디션 응시, 캐스팅 리스트업 참여가 가능합니다.',
      },
      {
        basis: '1주일 이상',
        category: '장기휴학',
        detail: '복학 시 기존 Class 복귀를 우선 검토하나, 휴학으로 발생한 T.O는 등록대기자로 충원될 수 있어 기존 Class 유지가 보장되지는 않습니다.',
      },
      {
        basis: '장기휴학 기간',
        category: '장기휴학 서비스',
        detail: '스타카드, 학원시설물 사용 등 일부 혜택은 중단되지만 교육 멘토링, 오디션 진행, 캐스팅 리스트업 참여는 가능합니다.',
      },
      {
        basis: '촬영, 병원, 장례 등 인정 사유',
        category: '보강',
        detail: '수업료 지원 시스템으로 차감된 수업 회차를 보장합니다. 교육지원청 기준을 준수합니다.',
      },
      {
        basis: '90일 이상',
        category: '90일 이상 장기휴학 후 퇴교',
        detail: '남은 회차 환불은 불가하며 배우앤배움의 모든 서비스가 종료됩니다.',
      },
    ],
    title: '휴학/복학 및 보강 기준',
  },
  {
    columns: completionColumns,
    rows: [
      { benefit: '해당 없음', className: '입문 I Class', condition: '해당 없음', period: '해당 없음' },
      { benefit: '해당 없음', className: '중급 R Class', condition: '해당 없음', period: '해당 없음' },
      { benefit: '해당 없음', className: '심화 U Class', condition: '해당 없음', period: '해당 없음' },
      {
        benefit: 'BNB 멤버쉽 오디션 서비스, 매니지먼트 서비스, 에이전시 캐스팅 서비스',
        className: '전문 DA Class',
        condition: 'U Class 12개월 이상 수강',
        period: '2년',
      },
    ],
    title: '수료 서비스',
  },
]

const kidsTuitionTables: ContentTable[] = [
  {
    columns: classColumns,
    rows: [
      { className: '초급 Class', course: '영재교육 과정', target: '연기를 처음 배우는 아이들' },
      { className: '중급 Class', course: '아역배우 과정', target: '초급 영재교육 Class 이수자, 드라마/영화 등 현장촬영 경험자' },
      {
        className: '고급 Class',
        course: '아티스트 과정',
        target: '중급 아역배우 Class 이수자, 매니지먼트 위탁배우, 드라마/영화/연극 주조연 이상 경력자',
      },
    ],
    title: 'Class 안내',
  },
  {
    caption: ['수료자 장학지원은 아래 장학제도 표의 적용대상과 혜택을 참고하세요.'],
    columns: kidsTuitionColumns,
    rows: [
      {
        classSize: '6명',
        course: '그룹레슨',
        day: '월~일 주 4회',
        duration: '480분',
        fee: '400,000원',
      },
    ],
    title: '수강료',
  },
  {
    caption: [
      '수료자 장학지원은 18개월, 30개월이 기준이며 19개월차와 31개월차부터 적용됩니다.',
      '가족등록 장학지원은 가족 등록 시 즉시 적용되며, 함께 재학 중인 경우 매 결제 시 상시 적용됩니다.',
      '가족등록 장학지원은 타 장학지원과 중복 불가합니다.',
      '환불 시 장학지원 이전의 정상 수강료 기준으로 환불이 진행됩니다.',
    ],
    columns: scholarshipColumns,
    rows: [
      { benefit: '5% 장학혜택 적용', target: '18개월 이상 재학', type: '수료자 장학지원' },
      { benefit: '10% 장학혜택 적용', target: '30개월 이상 재학', type: '수료자 장학지원' },
      { benefit: '추가 등록하는 1인 수강료 50% 장학지원', target: '형제, 자매, 남매가 함께 등록', type: '가족등록 장학지원' },
    ],
    title: '장학제도',
  },
]

const kidsLeaveTables: ContentTable[] = [
  {
    columns: leaveColumns,
    rows: [
      {
        basis: '1주일 이내',
        category: '단기휴학',
        detail: '기존 Class 유지가 가능하며, 당일 단기휴학 신청은 불가합니다. 단기휴학 기간에도 스타카드, 시설 이용, 오디션 응시, 캐스팅 리스트업 참여가 가능합니다.',
      },
      {
        basis: '분기(3개월)별 최대 1개월',
        category: '장기휴학',
        detail: '복학 시 기존 Class 복귀를 우선 검토하나, 휴학으로 발생한 T.O는 등록대기자로 충원될 수 있어 기존 Class 유지가 보장되지는 않습니다. 스타카드, 학원시설물 사용 등 일부 혜택은 중단되지만 교육 멘토링, 오디션 진행, 캐스팅 리스트업 참여는 가능합니다.',
      },
      { basis: '퇴교 시', category: '퇴교', detail: '배우앤배움의 모든 서비스가 종료됩니다.' },
    ],
    title: '휴학/복학 기준',
  },
  {
    caption: ['키즈센터 내 캐스팅건은 보장 불가'],
    columns: reinforcementColumns,
    rows: [
      {
        category: '보강 운영',
        detail: '결석 시 미리 고지되는 보강일에 출석해 수업을 들을 수 있습니다. 보강수업은 분기별 2회 진행되며, 미취학/초등학생 2개 클래스로 구성됩니다.',
      },
      { category: '병결, 외부촬영', detail: '병원 치료 진단서 또는 촬영 확인서 제출 시 커리큘럼 3개월 기준 2회 보장' },
      { category: '개인사유 결석, 당일 결석', detail: '보장 불가' },
      { category: '증빙자료 미제출', detail: '보강이 제한될 수 있습니다.' },
      { category: '보장 회차 처리', detail: '다음 분기 결제 시 감액 적용되며, 퇴교 시 환불되지 않습니다.' },
    ],
    title: '보강 및 결석 보장 기준',
  },
]

const avenueTuitionTables: ContentTable[] = [
  {
    caption: [
      '애비뉴센터는 공개 문서 기준 데이터가 별도 확인되지 않아, 센터 상담에서 확정해야 하는 항목을 분리해 표시합니다.',
      '추후 센터별 수강료, 장학, 휴학, 보강 정책이 확정되면 같은 테이블 구조에 행만 추가하면 됩니다.',
    ],
    columns: confirmationColumns,
    rows: [
      { category: 'Class 및 교육과정', detail: '애비뉴센터 상담 기준으로 과정, 시작일, 횟수, 시간대 확인 필요' },
      { category: '수강료', detail: '센터별 과정과 반 편성에 따라 상담 시 확정' },
      { category: '장학제도', detail: '애비뉴센터 별도 장학 또는 중복수강 혜택 운영 여부 확인 필요' },
    ],
    title: '애비뉴센터 수강료/장학제도 확인 항목',
  },
]

const avenueLeaveTables: ContentTable[] = [
  {
    columns: confirmationColumns,
    rows: [
      { category: '휴학/복학 기준', detail: '애비뉴센터 운영 정책에 따라 신청 기한과 복학 기준 확인 필요' },
      { category: '수료 기준', detail: '센터별 과정 이수 기준과 수료 후 혜택 운영 여부 확인 필요' },
      { category: '보강 기준', detail: '결석 인정 사유와 보강 운영 여부 확인 필요' },
    ],
    title: '애비뉴센터 운영 정책 확인 항목',
  },
]

const centerPhoneExtension = {
  art: '내선번호 1번, 신규상담 1번',
  avenue: '대표번호 연결 후 애비뉴센터 상담',
  exam: '내선번호 2번',
  highteen: '내선번호 3번',
  kids: '내선번호 4번',
} satisfies Record<CenterSlug, string>

function procedureFor(center: CenterSlug): ProcedureStep[] {
  const centerName = centerNameFor(center)
  const courseHref =
    center === 'exam'
      ? '/exam#curriculum'
      : center === 'avenue'
        ? '/avenue#portfolio'
        : `/${center}/curriculum`
  const teacherHref =
    center === 'exam'
      ? '/exam/teachers'
      : center === 'avenue'
        ? '/avenue/teachers'
        : `/${center}/teachers`

  if (center === 'exam') {
    return [
      {
        items: [
          {
            body: '입시반, 예비입시반 등 과정을 확인한 뒤 온라인 상담신청 또는 전화 상담신청으로 상담 일정을 예약합니다.',
            cta: { href: courseHref, label: '커리큘럼 확인' },
            title: '커리큘럼 확인',
          },
          {
            body: '입시 상담신청 페이지에서 방문 희망 일자와 시간, 신청자 정보를 남깁니다.',
            cta: { href: '/consult?center=exam', label: '온라인 상담신청' },
            title: '온라인 상담신청',
          },
          {
            body: '대표전화 1577-9929, 내선번호 2번으로 예약합니다.',
            cta: { href: 'tel:15779929', label: '전화 상담신청' },
            title: '전화 상담신청',
          },
        ],
        title: '상담예약',
      },
      {
        body: ['예약 일시에 방문해 상담 어플리케이션을 작성하고, 입시 목표와 현재 준비 상태를 바탕으로 과정, 커리큘럼, 수업 방향에 대해 안내받으실 수 있습니다.'],
        ctas: [{ href: '/exam/map', label: '오시는 길' }],
        title: '학원 방문상담',
      },
      {
        body: ['희망 과정과 반에 T.O가 있으면 바로 등록할 수 있고, T.O가 없으면 등록대기를 신청합니다.'],
        title: '등록대기 및 반 배정',
      },
      {
        body: ['수업 시작 전 수강료를 납부하면 등록이 완료됩니다.', '등록 후 담당자 안내와 스타카드 발급을 진행합니다.'],
        ctas: [{ href: '/exam/starcard', label: '스타카드 멤버쉽서비스' }],
        title: '수강등록',
      },
      {
        body: ['담당직원의 안내에 따라 강의실로 이동하고, 담임선생님 소개 후 입시 트레이닝을 시작합니다.'],
        ctas: [{ href: teacherHref, label: '교육진 소개' }],
        title: '첫 수업',
      },
    ]
  }

  const firstVisit =
    center === 'highteen'
      ? [
          '예약된 일시에 아트센터 1층 안내데스크로 방문해 상담 어플리케이션을 작성합니다.',
          '작성 후 하이틴센터로 안내받아 시스템, 커리큘럼, 수업 방향에 대해 안내받으실 수 있습니다.',
        ]
      : center === 'kids'
        ? [
            '1차 유선상담 후 확정된 일시에 아트센터 1층 안내데스크로 방문해 상담 어플리케이션을 작성합니다.',
            '작성 후 입학상담실에서 시스템, 커리큘럼, 수업 방향에 대해 안내받으실 수 있습니다.',
          ]
        : center === 'art'
          ? [
              '예약 일시에 아트센터 1층 안내데스크로 방문해 상담 어플리케이션을 작성합니다.',
              '작성 후 입학상담실에서 시스템, 커리큘럼, 수업 방향에 대해 안내받으실 수 있습니다.',
            ]
          : [
              '예약 일시에 방문해 상담 어플리케이션을 작성합니다.',
              '작성 후 센터 운영 기준에 따라 과정, 커리큘럼, 수업 방향에 대해 안내받으실 수 있습니다.',
            ]
  const registrationTime = center === 'art' ? '15~30분 전' : '10~20분 전'
  const consultationBody =
    center === 'kids'
      ? '온라인 상담신청 또는 전화 상담신청으로 유선상담 일자와 시간을 예약합니다.'
      : center === 'art'
        ? '커리큘럼 확인, 온라인 상담신청, 전화 상담신청으로 방문 상담 일정을 예약합니다.'
        : '온라인 상담신청 또는 전화 상담신청으로 방문 상담 일정을 예약합니다.'

  return [
    {
      items: [
        {
          body:
            center === 'art'
              ? '희망 Class, 교육시작일, 교육횟수, 교육시간대를 확인한 뒤 수강상담을 신청합니다.'
              : center === 'kids'
                ? '희망 유선상담 일자, 시간, 신청자 정보를 입력합니다.'
                : `${centerName} 과정, 교육시작일, 교육횟수, 시간대를 확인한 뒤 상담을 신청합니다.`,
          cta: { href: courseHref, label: '커리큘럼 확인' },
          title: center === 'art' ? '커리큘럼 확인' : '온라인 상담신청',
        },
        {
          body:
            center === 'art'
              ? '방문 희망 일자, 시간, 신청자 정보를 입력합니다.'
              : `${centerName} 온라인 상담신청 페이지에서 방문 희망 일자와 시간, 신청자 정보를 남깁니다.`,
          cta: { href: `/consult?center=${center}`, label: '온라인 상담신청' },
          title: '온라인 상담신청',
        },
        {
          body: `대표전화 1577-9929로 연락해 ${centerPhoneExtension[center]} 안내에 따라 상담 일정을 예약합니다.`,
          cta: { href: 'tel:15779929', label: '전화 상담신청' },
          title: '전화 상담신청',
        },
      ],
      body: [consultationBody],
      title: '상담예약',
    },
    {
      body: firstVisit,
      ctas: [{ href: `/${center}/map`, label: '오시는 길' }],
      title: '학원 방문상담',
    },
    {
      body: [
        '상담 후 희망 반에 T.O가 있으면 바로 등록할 수 있습니다.',
        center === 'art' || center === 'highteen'
          ? 'T.O가 없으면 등록대기를 신청하며, 정규 개강기간에는 정원 내 선착순으로 등록대기가 진행됩니다.'
          : 'T.O가 없으면 등록대기를 신청합니다.',
      ],
      title: '등록대기 및 반 배정',
    },
    {
      body: [
        `입학 당일 수업시간 ${registrationTime}에 방문해 수강료를 납부하면 등록이 완료됩니다.`,
        center === 'art'
          ? '지문과 사진을 등록하고, 등록 후 카카오톡, 네이버 밴드 초대와 스타카드 발급이 진행됩니다.'
          : center === 'highteen'
            ? '등록 후 담당선생님 및 원장님과 간단한 미팅이 진행되고 스타카드가 발급됩니다.'
            : '등록 후 담당선생님과 간단한 미팅이 진행되고 스타카드가 발급됩니다.',
      ],
      ctas: [{ href: `/${center}/starcard`, label: '스타카드 멤버쉽서비스' }],
      title: '수강등록',
    },
    {
      body: ['담당직원의 안내에 따라 강의실로 이동하고, 담임선생님 소개 후 트레이닝을 시작합니다.'],
      ctas: [{ href: teacherHref, label: '교육진 소개' }],
      title: '첫 수업',
    },
  ]
}

function centerNameFor(center: CenterSlug) {
  if (center === 'art') return '아트센터'
  if (center === 'exam') return '입시센터'
  if (center === 'highteen') return '하이틴센터'
  if (center === 'kids') return '키즈센터'
  return '애비뉴센터'
}

const contentTablesByCenter = {
  art: {
    leaveTables: artLeaveTables,
    leaveTitle: '휴학/복학/수료 안내',
    tuitionTables: artTuitionTables,
  },
  avenue: {
    leaveTables: avenueLeaveTables,
    leaveTitle: '휴학/복학/수료 안내',
    tuitionTables: avenueTuitionTables,
  },
  exam: {
    leaveTables: examLeaveTables,
    leaveTitle: '휴학/복학/수료 안내',
    tuitionTables: examTuitionTables,
  },
  highteen: {
    leaveTables: highteenLeaveTables,
    leaveTitle: '휴학/복학/수료 안내',
    tuitionTables: highteenTuitionTables,
  },
  kids: {
    leaveTables: kidsLeaveTables,
    leaveTitle: '휴학/복학/보강 안내',
    tuitionTables: kidsTuitionTables,
  },
} satisfies Record<CenterSlug, Pick<AdmissionContent, 'leaveTables' | 'leaveTitle' | 'tuitionTables'>>

export const admissionContentByCenter = Object.fromEntries(
  (Object.keys(contentTablesByCenter) as CenterSlug[]).map((center) => [
    center,
    {
      ...contentTablesByCenter[center],
      procedure: procedureFor(center),
      refundIntro,
      refundTables: commonRefundTables,
    },
  ]),
) as Record<CenterSlug, AdmissionContent>

export function getAdmissionContent(center: CenterSlug): AdmissionContent {
  return admissionContentByCenter[center]
}
