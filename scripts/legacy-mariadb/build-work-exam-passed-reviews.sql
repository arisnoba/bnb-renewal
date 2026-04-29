SET SESSION group_concat_max_len = 1048576;

CREATE DATABASE IF NOT EXISTS `bnb_legacy_work`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bnb_legacy_work`;

DROP TABLE IF EXISTS `bnb_legacy_work`.`exam_school_logos`;
DROP TABLE IF EXISTS `bnb_legacy_work`.`exam_passed_reviews`;

DROP TEMPORARY TABLE IF EXISTS `tmp_exam_school_logo_map`;

CREATE TEMPORARY TABLE `tmp_exam_school_logo_map` (
  `logo_source` varchar(255) NOT NULL,
  `school_name` varchar(255) NOT NULL,
  `school_slug` varchar(255) NOT NULL,
  PRIMARY KEY (`logo_source`)
) ENGINE=Memory DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tmp_exam_school_logo_map` (`logo_source`, `school_name`, `school_slug`) VALUES
('ayu로고.jpg', '안양대학교', 'anyang-university'),
('bau로고.png', '백석예술대학교', 'baekseok-arts-university'),
('cau로고.png', '중앙대학교', 'chung-ang-university'),
('ci-kmu-symbol1.png', '경민대학교', 'kyungmin-university'),
('cwu로고.png', '청운대학교', 'chungwoon-university'),
('ddwu로고.png', '동덕여자대학교', 'dongduk-womens-university'),
('ddu로고.png', '대덕대학교', 'daeduk-university'),
('dgu로고.png', '동국대학교', 'dongguk-university'),
('dima로고.png', '동아방송예술대학교', 'dong-ah-institute-of-media-and-arts'),
('dju로고.png', '대진대학교', 'daejin-university'),
('dku로고.png', '대경대학교', 'daekyeung-university'),
('dsu로고.png', '동서울대학교', 'dong-seoul-university'),
('dyu로고.png', '동양대학교', 'dongyang-university'),
('gcu로고.png', '가천대학교', 'gachon-university'),
('hiu로고.png', '홍익대학교', 'hongik-university'),
('hsu로고.png', '한세대학교', 'hansei-university'),
('hwu로고.png', '호원대학교', 'howon-university'),
('hyu로고.png', '한양대학교', 'hanyang-university'),
('iduk 로고.png', '인덕대학교', 'induk-university'),
('ihu로고.png', '인하대학교', 'inha-university'),
('inu로고.png', '인천대학교', 'incheon-national-university'),
('jbu로고.png', '중부대학교', 'joongbu-university'),
('jhac.png', '정화예술대학교', 'jeonghwa-arts-college'),
('karts로고.png', '한국예술종합학교', 'korea-national-university-of-arts'),
('kbu로고.png', '경복대학교', 'kyungbok-university'),
('kgu로고２.png', '경기대학교', 'kyonggi-university'),
('khu로고.png', '경희대학교', 'kyung-hee-university'),
('kku로고.png', '건국대학교', 'konkuk-university'),
('kmu로고.png', '국민대학교', 'kookmin-university'),
('kua로고.png', '국제예술대학교', 'kookje-university-of-arts'),
('mjc로고.png', '명지전문대학교', 'myongji-college'),
('ptu로고.png', '평택대학교', 'pyeongtaek-university'),
('sarts.png', '서울예술대학교', 'seoul-institute-of-the-arts'),
('sarts로고.png', '서울예술대학교', 'seoul-institute-of-the-arts'),
('schu로고.png', '순천향대학교', 'soonchunhyang-university'),
('shu로고.png', '신한대학교', 'shinhan-university'),
('sju로고.png', '세종대학교', 'sejong-university'),
('skku로고.png', '성균관대학교', 'sungkyunkwan-university'),
('sku로고.png', '서경대학교', 'seokyeong-university'),
('ssc로고.png', '수원과학대학교', 'suwon-science-college'),
('ssu로고.png', '숭실대학교', 'soongsil-university'),
('sswu로고.png', '성신여자대학교', 'sungshin-womens-university'),
('swwu로고.png', '수원여자대학교', 'suwon-womens-university'),
('usw로고.png', '수원대학교', 'university-of-suwon'),
('yiu로고.png', '용인대학교', 'yong-in-university'),
('ywau로고.png', '예원예술대학교', 'yewon-arts-university'),
('극동대학교 로고.png', '극동대학교', 'far-east-university'),
('단국대로고.png', '단국대학교', 'dankook-university'),
('성결대로고.png', '성결대학교', 'sungkyul-university'),
('유한_엠블럼_투명.png', '유한대학교', 'yuhan-university'),
('정화예대 로고.jpg', '정화예술대학교', 'jeonghwa-arts-college'),
('호서대로고.png', '호서대학교', 'hoseo-university');

DROP TEMPORARY TABLE IF EXISTS `tmp_exam_school_logo_sources`;

CREATE TEMPORARY TABLE `tmp_exam_school_logo_sources` AS
SELECT
  `map`.`school_name`,
  `map`.`school_slug`,
  `review`.`wr_id`,
  `review`.`wr_subject`,
  `review`.`wr_datetime`,
  `school_logo`.`bf_no`,
  NULLIF(TRIM(`school_logo`.`bf_source`), '') AS `bf_source`,
  NULLIF(TRIM(`school_logo`.`bf_file`), '') AS `bf_file`,
  NULLIF(TRIM(`school_logo`.`bf_content`), '') AS `bf_content`,
  `school_logo`.`bf_filesize`,
  `school_logo`.`bf_width`,
  `school_logo`.`bf_height`,
  `school_logo`.`bf_type`,
  `school_logo`.`bf_datetime`
FROM `bnbuniv`.`g5_write_new_hoogi` AS `review`
JOIN `bnbuniv`.`g5_board_file` AS `school_logo`
  ON `school_logo`.`bo_table` = 'new_hoogi'
  AND `school_logo`.`wr_id` = `review`.`wr_id`
  AND `school_logo`.`bf_no` = 0
JOIN `tmp_exam_school_logo_map` AS `map`
  ON `map`.`logo_source` = `school_logo`.`bf_source`
WHERE `review`.`wr_is_comment` = 0
  AND NULLIF(TRIM(`review`.`wr_subject`), '') IS NOT NULL
  AND `review`.`wr_subject` LIKE '%합격%';

DROP TEMPORARY TABLE IF EXISTS `tmp_exam_school_logo_representatives`;

CREATE TEMPORARY TABLE `tmp_exam_school_logo_representatives` AS
SELECT *
FROM (
  SELECT
    `tmp_exam_school_logo_sources`.*,
    ROW_NUMBER() OVER (
      PARTITION BY `school_slug`
      ORDER BY `wr_datetime` DESC, `wr_id` DESC
    ) AS `representative_rank`
  FROM `tmp_exam_school_logo_sources`
) AS `ranked_school_logos`
WHERE `representative_rank` = 1;

CREATE TABLE `bnb_legacy_work`.`exam_school_logos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `school_name` varchar(255) NOT NULL,
  `school_slug` varchar(255) NOT NULL,
  `logo_url` varchar(512) NOT NULL,
  `logo_path` varchar(512) NOT NULL,
  `logo_original_name` varchar(255) DEFAULT NULL,
  `logo_file` varchar(255) NOT NULL,
  `logo_width` int(11) DEFAULT NULL,
  `logo_height` int(11) DEFAULT NULL,
  `legacy_meta` longtext DEFAULT NULL CHECK (JSON_VALID(`legacy_meta`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_school_logos_school_slug_idx` (`school_slug`),
  KEY `exam_school_logos_school_name_idx` (`school_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bnb_legacy_work`.`exam_passed_reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_db` varchar(32) NOT NULL,
  `source_table` varchar(64) NOT NULL,
  `source_id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `center` varchar(32) NOT NULL,
  `school_name` varchar(255) NOT NULL,
  `school_logo_slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body_html` mediumtext DEFAULT NULL,
  `school_logo_url` varchar(512) NOT NULL,
  `school_logo_path` varchar(512) NOT NULL,
  `student_image_url` varchar(512) NOT NULL,
  `student_image_path` varchar(512) NOT NULL,
  `published_at` datetime NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `legacy_meta` longtext DEFAULT NULL CHECK (JSON_VALID(`legacy_meta`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_passed_reviews_slug_idx` (`slug`),
  UNIQUE KEY `exam_passed_reviews_source_idx` (`source_db`, `source_table`, `source_id`),
  KEY `exam_passed_reviews_school_logo_slug_idx` (`school_logo_slug`),
  KEY `exam_passed_reviews_published_at_idx` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `bnb_legacy_work`.`exam_school_logos` (
  `school_name`,
  `school_slug`,
  `logo_url`,
  `logo_path`,
  `logo_original_name`,
  `logo_file`,
  `logo_width`,
  `logo_height`,
  `created_at`,
  `updated_at`,
  `legacy_meta`
)
SELECT
  `representative`.`school_name`,
  `representative`.`school_slug`,
  CONCAT('https://www.baewoo.kr:443/web/data/file/new_hoogi/', `representative`.`bf_file`) AS `logo_url`,
  CONCAT('/web/data/file/new_hoogi/', `representative`.`bf_file`) AS `logo_path`,
  `representative`.`bf_source` AS `logo_original_name`,
  `representative`.`bf_file` AS `logo_file`,
  `representative`.`bf_width` AS `logo_width`,
  `representative`.`bf_height` AS `logo_height`,
  (
    SELECT MIN(COALESCE(NULLIF(`source`.`wr_datetime`, '0000-00-00 00:00:00'), CURRENT_TIMESTAMP))
    FROM `tmp_exam_school_logo_sources` AS `source`
    WHERE `source`.`school_slug` = `representative`.`school_slug`
  ) AS `created_at`,
  CURRENT_TIMESTAMP AS `updated_at`,
  JSON_OBJECT(
    'sourceDb', 'bnbuniv',
    'sourceTable', 'g5_board_file',
    'sourceBoTable', 'new_hoogi',
    'representativeReviewId', `representative`.`wr_id`,
    'representativeTitle', `representative`.`wr_subject`,
    'representativeLogo', JSON_OBJECT(
      'bfNo', `representative`.`bf_no`,
      'url', CONCAT('https://www.baewoo.kr:443/web/data/file/new_hoogi/', `representative`.`bf_file`),
      'path', CONCAT('/web/data/file/new_hoogi/', `representative`.`bf_file`),
      'originalName', `representative`.`bf_source`,
      'content', `representative`.`bf_content`,
      'filesize', `representative`.`bf_filesize`,
      'width', `representative`.`bf_width`,
      'height', `representative`.`bf_height`,
      'type', `representative`.`bf_type`,
      'datetime', `representative`.`bf_datetime`
    ),
    'sources', (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'reviewId', `source`.`wr_id`,
          'title', `source`.`wr_subject`,
          'logoOriginalName', `source`.`bf_source`,
          'logoFile', `source`.`bf_file`,
          'publishedAt', `source`.`wr_datetime`
        )
        ORDER BY `source`.`wr_datetime` DESC, `source`.`wr_id` DESC
      )
      FROM `tmp_exam_school_logo_sources` AS `source`
      WHERE `source`.`school_slug` = `representative`.`school_slug`
    )
  ) AS `legacy_meta`
FROM `tmp_exam_school_logo_representatives` AS `representative`
ORDER BY `representative`.`school_name`;

INSERT INTO `bnb_legacy_work`.`exam_passed_reviews` (
  `source_db`,
  `source_table`,
  `source_id`,
  `slug`,
  `center`,
  `school_name`,
  `school_logo_slug`,
  `title`,
  `body_html`,
  `school_logo_url`,
  `school_logo_path`,
  `student_image_url`,
  `student_image_path`,
  `published_at`,
  `is_public`,
  `created_at`,
  `updated_at`,
  `legacy_meta`
)
SELECT
  'bnbuniv' AS `source_db`,
  'g5_write_new_hoogi' AS `source_table`,
  `review`.`wr_id` AS `source_id`,
  CONCAT('exam-passed-review-', `review`.`wr_id`) AS `slug`,
  'exam' AS `center`,
  `school_map`.`school_name`,
  `school_map`.`school_slug` AS `school_logo_slug`,
  NULLIF(TRIM(`review`.`wr_subject`), '') AS `title`,
  NULLIF(`review`.`wr_content`, '') AS `body_html`,
  CONCAT('https://www.baewoo.kr:443/web/data/file/new_hoogi/', `school_logo`.`bf_file`) AS `school_logo_url`,
  CONCAT('/web/data/file/new_hoogi/', `school_logo`.`bf_file`) AS `school_logo_path`,
  CONCAT('https://www.baewoo.kr:443/web/data/file/new_hoogi/', `student_image`.`bf_file`) AS `student_image_url`,
  CONCAT('/web/data/file/new_hoogi/', `student_image`.`bf_file`) AS `student_image_path`,
  COALESCE(NULLIF(`review`.`wr_datetime`, '0000-00-00 00:00:00'), CURRENT_TIMESTAMP) AS `published_at`,
  IF(COALESCE(TRIM(`review`.`public`), '') = '0' OR UPPER(COALESCE(TRIM(`review`.`public`), '')) = 'N', 0, 1) AS `is_public`,
  COALESCE(NULLIF(`review`.`wr_datetime`, '0000-00-00 00:00:00'), CURRENT_TIMESTAMP) AS `created_at`,
  CURRENT_TIMESTAMP AS `updated_at`,
  JSON_OBJECT(
    'sourceDb', 'bnbuniv',
    'center', 'exam',
    'sourceTable', 'g5_write_new_hoogi',
    'sourceId', `review`.`wr_id`,
    'schoolName', `school_map`.`school_name`,
    'schoolLogoSlug', `school_map`.`school_slug`,
    'excludedRule', 'wr_subject LIKE %합격%',
    'schoolLogo', JSON_OBJECT(
      'bfNo', `school_logo`.`bf_no`,
      'url', CONCAT('https://www.baewoo.kr:443/web/data/file/new_hoogi/', `school_logo`.`bf_file`),
      'path', CONCAT('/web/data/file/new_hoogi/', `school_logo`.`bf_file`),
      'originalName', NULLIF(TRIM(`school_logo`.`bf_source`), ''),
      'content', NULLIF(TRIM(`school_logo`.`bf_content`), ''),
      'filesize', `school_logo`.`bf_filesize`,
      'width', `school_logo`.`bf_width`,
      'height', `school_logo`.`bf_height`,
      'type', `school_logo`.`bf_type`,
      'datetime', `school_logo`.`bf_datetime`
    ),
    'studentImage', JSON_OBJECT(
      'bfNo', `student_image`.`bf_no`,
      'url', CONCAT('https://www.baewoo.kr:443/web/data/file/new_hoogi/', `student_image`.`bf_file`),
      'path', CONCAT('/web/data/file/new_hoogi/', `student_image`.`bf_file`),
      'originalName', NULLIF(TRIM(`student_image`.`bf_source`), ''),
      'content', NULLIF(TRIM(`student_image`.`bf_content`), ''),
      'filesize', `student_image`.`bf_filesize`,
      'width', `student_image`.`bf_width`,
      'height', `student_image`.`bf_height`,
      'type', `student_image`.`bf_type`,
      'datetime', `student_image`.`bf_datetime`
    ),
    'rawFields', JSON_OBJECT(
      'wr1', `review`.`wr_1`,
      'wr2', `review`.`wr_2`,
      'wr3', `review`.`wr_3`,
      'wr4', `review`.`wr_4`,
      'wr5', `review`.`wr_5`,
      'wr6', `review`.`wr_6`,
      'wr7', `review`.`wr_7`,
      'wr8', `review`.`wr_8`,
      'wr9', `review`.`wr_9`,
      'wr10', `review`.`wr_10`
    ),
    'wrFile', NULLIF(TRIM(`review`.`wr_file`), ''),
    'wrHit', `review`.`wr_hit`,
    'wrParent', `review`.`wr_parent`,
    'wrNum', `review`.`wr_num`,
    'wrOption', NULLIF(TRIM(`review`.`wr_option`), ''),
    'links', JSON_OBJECT(
      'link1', NULLIF(TRIM(`review`.`wr_link1`), ''),
      'link2', NULLIF(TRIM(`review`.`wr_link2`), ''),
      'link1Hit', `review`.`wr_link1_hit`,
      'link2Hit', `review`.`wr_link2_hit`
    )
  ) AS `legacy_meta`
FROM `bnbuniv`.`g5_write_new_hoogi` AS `review`
JOIN `bnbuniv`.`g5_board_file` AS `school_logo`
  ON `school_logo`.`bo_table` = 'new_hoogi'
  AND `school_logo`.`wr_id` = `review`.`wr_id`
  AND `school_logo`.`bf_no` = 0
JOIN `bnbuniv`.`g5_board_file` AS `student_image`
  ON `student_image`.`bo_table` = 'new_hoogi'
  AND `student_image`.`wr_id` = `review`.`wr_id`
  AND `student_image`.`bf_no` = 1
JOIN `tmp_exam_school_logo_map` AS `school_map`
  ON `school_map`.`logo_source` = `school_logo`.`bf_source`
WHERE `review`.`wr_is_comment` = 0
  AND NULLIF(TRIM(`review`.`wr_subject`), '') IS NOT NULL
  AND `review`.`wr_subject` LIKE '%합격%'
ORDER BY `review`.`wr_datetime` DESC, `review`.`wr_id` DESC;
