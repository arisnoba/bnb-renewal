SET SESSION group_concat_max_len = 1048576;

CREATE DATABASE IF NOT EXISTS `bnb_legacy_work`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bnb_legacy_work`;

DROP TABLE IF EXISTS `bnb_legacy_work`.`teacher_lessons`;
DROP TABLE IF EXISTS `bnb_legacy_work`.`teacher_files`;
DROP TABLE IF EXISTS `bnb_legacy_work`.`teachers`;

CREATE TABLE `bnb_legacy_work`.`teachers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_db` varchar(32) NOT NULL,
  `source_table` varchar(64) NOT NULL,
  `source_id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `normalized_name` varchar(255) NOT NULL,
  `role` varchar(255) DEFAULT NULL,
  `centers` longtext NOT NULL CHECK (JSON_VALID(`centers`)),
  `summary` mediumtext DEFAULT NULL,
  `body_html` mediumtext DEFAULT NULL,
  `profile_image_path` varchar(255) DEFAULT NULL,
  `photo_image1` varchar(255) DEFAULT NULL,
  `photo_image2` varchar(255) DEFAULT NULL,
  `photo_image3` varchar(255) DEFAULT NULL,
  `photo_image4` varchar(255) DEFAULT NULL,
  `photo_image5` varchar(255) DEFAULT NULL,
  `photo_image6` varchar(255) DEFAULT NULL,
  `gallery` longtext DEFAULT NULL CHECK (JSON_VALID(`gallery`)),
  `display_order` int(11) NOT NULL DEFAULT 0,
  `status` varchar(32) NOT NULL DEFAULT 'published',
  `legacy_meta` longtext DEFAULT NULL CHECK (JSON_VALID(`legacy_meta`)),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teachers_slug_idx` (`slug`),
  UNIQUE KEY `teachers_normalized_name_idx` (`normalized_name`),
  KEY `teachers_source_idx` (`source_db`, `source_table`, `source_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bnb_legacy_work`.`teacher_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_db` varchar(32) NOT NULL,
  `source_table` varchar(64) NOT NULL,
  `source_id` int(11) NOT NULL,
  `teacher_source_id` int(11) NOT NULL,
  `resolved_teacher_id` int(11) DEFAULT NULL,
  `resolved_teacher_slug` varchar(255) DEFAULT NULL,
  `resolved_teacher_name` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `description` mediumtext DEFAULT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `legacy_meta` longtext DEFAULT NULL CHECK (JSON_VALID(`legacy_meta`)),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teacher_files_source_idx` (`source_db`, `source_table`, `source_id`),
  KEY `teacher_files_teacher_idx` (`resolved_teacher_id`),
  KEY `teacher_files_source_teacher_idx` (`source_db`, `teacher_source_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bnb_legacy_work`.`teacher_lessons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_db` varchar(32) NOT NULL,
  `source_table` varchar(64) NOT NULL,
  `source_id` int(11) NOT NULL,
  `category` varchar(64) DEFAULT NULL,
  `teacher_name` varchar(255) DEFAULT NULL,
  `resolved_teacher_id` int(11) DEFAULT NULL,
  `resolved_teacher_slug` varchar(255) DEFAULT NULL,
  `subject` mediumtext DEFAULT NULL,
  `title_raw` mediumtext DEFAULT NULL,
  `content_raw` mediumtext DEFAULT NULL,
  `legacy_meta` longtext DEFAULT NULL CHECK (JSON_VALID(`legacy_meta`)),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teacher_lessons_source_idx` (`source_db`, `source_table`, `source_id`),
  KEY `teacher_lessons_teacher_idx` (`resolved_teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TEMPORARY TABLE IF EXISTS `tmp_teacher_all`;

CREATE TEMPORARY TABLE `tmp_teacher_all` AS
SELECT
  'baewoo' AS `source_db`,
  'art' AS `source_center`,
  1 AS `source_priority`,
  'g5_teacher' AS `source_table`,
  1 AS `table_priority`,
  `bn_id`, `name`, `subject`, `summary`, `message`, `piece`,
  `pr_1`, `pr_2`, `pr_3`, `pr_4`, `pr_5`, `pr_6`, `pr_7`, `pr_8`, `pr_9`,
  `bn_bimg`,
  `it_img1`, `it_img2`, `it_img3`, `it_img4`, `it_img5`, `it_img6`, `it_img7`, `it_img8`,
  `it_img_title1`, `it_img_title2`, `it_img_title3`, `it_img_title4`,
  `it_img_title5`, `it_img_title6`, `it_img_title7`, `it_img_title8`,
  `it_img_desc1`, `it_img_desc2`, `it_img_desc3`, `it_img_desc4`,
  `it_img_desc5`, `it_img_desc6`, `it_img_desc7`, `it_img_desc8`,
  NULL AS `photo_img1`, NULL AS `photo_img2`, NULL AS `photo_img3`,
  NULL AS `photo_img4`, NULL AS `photo_img5`, NULL AS `photo_img6`,
  `bn_order`,
  NULL AS `it_img_sort`
FROM `baewoo`.`g5_teacher`
UNION ALL
SELECT
  'baewoo', 'art', 1, 'g5_teacher2', 2,
  `bn_id`, `name`, `subject`, `summary`, `message`, `piece`,
  `pr_1`, `pr_2`, `pr_3`, `pr_4`, `pr_5`, `pr_6`, `pr_7`, `pr_8`, `pr_9`,
  `bn_bimg`,
  `it_img1`, `it_img2`, `it_img3`, `it_img4`, `it_img5`, `it_img6`, `it_img7`, `it_img8`,
  `it_img_title1`, `it_img_title2`, `it_img_title3`, `it_img_title4`,
  `it_img_title5`, `it_img_title6`, `it_img_title7`, `it_img_title8`,
  `it_img_desc1`, `it_img_desc2`, `it_img_desc3`, `it_img_desc4`,
  `it_img_desc5`, `it_img_desc6`, `it_img_desc7`, `it_img_desc8`,
  `photo_img1`, `photo_img2`, `photo_img3`, `photo_img4`, `photo_img5`, `photo_img6`,
  `bn_order`,
  `it_img_sort`
FROM `baewoo`.`g5_teacher2`
UNION ALL
SELECT
  'bnbuniv', 'exam', 3, 'g5_teacher', 1,
  `bn_id`, `name`, `subject`, `summary`, `message`, `piece`,
  `pr_1`, `pr_2`, `pr_3`, `pr_4`, `pr_5`, `pr_6`, `pr_7`, `pr_8`, `pr_9`,
  `bn_bimg`,
  `it_img1`, `it_img2`, `it_img3`, `it_img4`, `it_img5`, `it_img6`, `it_img7`, `it_img8`,
  `it_img_title1`, `it_img_title2`, `it_img_title3`, `it_img_title4`,
  `it_img_title5`, `it_img_title6`, `it_img_title7`, `it_img_title8`,
  `it_img_desc1`, `it_img_desc2`, `it_img_desc3`, `it_img_desc4`,
  `it_img_desc5`, `it_img_desc6`, `it_img_desc7`, `it_img_desc8`,
  NULL, NULL, NULL, NULL, NULL, NULL,
  `bn_order`,
  NULL
FROM `bnbuniv`.`g5_teacher`
UNION ALL
SELECT
  'bnbuniv', 'exam', 3, 'g5_teacher2', 2,
  `bn_id`, `name`, `subject`, `summary`, `message`, `piece`,
  `pr_1`, `pr_2`, `pr_3`, `pr_4`, `pr_5`, `pr_6`, `pr_7`, `pr_8`, `pr_9`,
  `bn_bimg`,
  `it_img1`, `it_img2`, `it_img3`, `it_img4`, `it_img5`, `it_img6`, `it_img7`, `it_img8`,
  `it_img_title1`, `it_img_title2`, `it_img_title3`, `it_img_title4`,
  `it_img_title5`, `it_img_title6`, `it_img_title7`, `it_img_title8`,
  `it_img_desc1`, `it_img_desc2`, `it_img_desc3`, `it_img_desc4`,
  `it_img_desc5`, `it_img_desc6`, `it_img_desc7`, `it_img_desc8`,
  `photo_img1`, `photo_img2`, `photo_img3`, `photo_img4`, `photo_img5`, `photo_img6`,
  `bn_order`,
  `it_img_sort`
FROM `bnbuniv`.`g5_teacher2`
UNION ALL
SELECT
  'kidscenter', 'kids', 2, 'g5_teacher', 1,
  `bn_id`, `name`, `subject`, `summary`, `message`, `piece`,
  `pr_1`, `pr_2`, `pr_3`, `pr_4`, `pr_5`, `pr_6`, `pr_7`, `pr_8`, `pr_9`,
  `bn_bimg`,
  `it_img1`, `it_img2`, `it_img3`, `it_img4`, `it_img5`, `it_img6`, `it_img7`, `it_img8`,
  `it_img_title1`, `it_img_title2`, `it_img_title3`, `it_img_title4`,
  `it_img_title5`, `it_img_title6`, `it_img_title7`, `it_img_title8`,
  `it_img_desc1`, `it_img_desc2`, `it_img_desc3`, `it_img_desc4`,
  `it_img_desc5`, `it_img_desc6`, `it_img_desc7`, `it_img_desc8`,
  NULL, NULL, NULL, NULL, NULL, NULL,
  `bn_order`,
  NULL
FROM `kidscenter`.`g5_teacher`
UNION ALL
SELECT
  'kidscenter', 'kids', 2, 'g5_teacher2', 2,
  `bn_id`, `name`, `subject`, `summary`, `message`, `piece`,
  `pr_1`, `pr_2`, `pr_3`, `pr_4`, `pr_5`, `pr_6`, `pr_7`, `pr_8`, `pr_9`,
  `bn_bimg`,
  `it_img1`, `it_img2`, `it_img3`, `it_img4`, `it_img5`, `it_img6`, `it_img7`, `it_img8`,
  `it_img_title1`, `it_img_title2`, `it_img_title3`, `it_img_title4`,
  `it_img_title5`, `it_img_title6`, `it_img_title7`, `it_img_title8`,
  `it_img_desc1`, `it_img_desc2`, `it_img_desc3`, `it_img_desc4`,
  `it_img_desc5`, `it_img_desc6`, `it_img_desc7`, `it_img_desc8`,
  `photo_img1`, `photo_img2`, `photo_img3`, `photo_img4`, `photo_img5`, `photo_img6`,
  `bn_order`,
  NULL
FROM `kidscenter`.`g5_teacher2`
UNION ALL
SELECT
  'bnbhighteen', 'highteen', 4, 'g5_teacher', 1,
  `bn_id`, `name`, `subject`, `summary`, `message`, `piece`,
  `pr_1`, `pr_2`, `pr_3`, `pr_4`, `pr_5`, `pr_6`, `pr_7`, `pr_8`, `pr_9`,
  `bn_bimg`,
  `it_img1`, `it_img2`, `it_img3`, `it_img4`, `it_img5`, `it_img6`, `it_img7`, `it_img8`,
  `it_img_title1`, `it_img_title2`, `it_img_title3`, `it_img_title4`,
  `it_img_title5`, `it_img_title6`, `it_img_title7`, `it_img_title8`,
  `it_img_desc1`, `it_img_desc2`, `it_img_desc3`, `it_img_desc4`,
  `it_img_desc5`, `it_img_desc6`, `it_img_desc7`, `it_img_desc8`,
  NULL, NULL, NULL, NULL, NULL, NULL,
  `bn_order`,
  NULL
FROM `bnbhighteen`.`g5_teacher`
UNION ALL
SELECT
  'bnbhighteen', 'highteen', 4, 'g5_teacher2', 2,
  `bn_id`, `name`, `subject`, `summary`, `message`, `piece`,
  `pr_1`, `pr_2`, `pr_3`, `pr_4`, `pr_5`, `pr_6`, `pr_7`, `pr_8`, `pr_9`,
  `bn_bimg`,
  `it_img1`, `it_img2`, `it_img3`, `it_img4`, `it_img5`, `it_img6`, `it_img7`, `it_img8`,
  `it_img_title1`, `it_img_title2`, `it_img_title3`, `it_img_title4`,
  `it_img_title5`, `it_img_title6`, `it_img_title7`, `it_img_title8`,
  `it_img_desc1`, `it_img_desc2`, `it_img_desc3`, `it_img_desc4`,
  `it_img_desc5`, `it_img_desc6`, `it_img_desc7`, `it_img_desc8`,
  `photo_img1`, `photo_img2`, `photo_img3`, `photo_img4`, `photo_img5`, `photo_img6`,
  `bn_order`,
  `it_img_sort`
FROM `bnbhighteen`.`g5_teacher2`;

DROP TEMPORARY TABLE IF EXISTS `tmp_teacher_normalized`;

CREATE TEMPORARY TABLE `tmp_teacher_normalized` AS
SELECT
  `base`.*,
  NULLIF(TRIM(REGEXP_REPLACE(`base`.`resolved_name`, '<[^>]+>', '')), '') AS `normalized_name`,
  NULLIF(TRIM(REGEXP_REPLACE(`base`.`resolved_role`, '<[^>]+>', '')), '') AS `normalized_role`,
  (
    IF(NULLIF(TRIM(`base`.`summary`), '') IS NULL, 0, CHAR_LENGTH(`base`.`summary`)) +
    IF(NULLIF(TRIM(`base`.`message`), '') IS NULL, 0, CHAR_LENGTH(`base`.`message`)) +
    IF(NULLIF(TRIM(`base`.`bn_bimg`), '') IS NULL, 0, 500) +
    IF(NULLIF(TRIM(`base`.`photo_img1`), '') IS NULL, 0, 150) +
    IF(NULLIF(TRIM(`base`.`photo_img2`), '') IS NULL, 0, 150) +
    IF(NULLIF(TRIM(`base`.`photo_img3`), '') IS NULL, 0, 150) +
    IF(NULLIF(TRIM(`base`.`photo_img4`), '') IS NULL, 0, 150) +
    IF(NULLIF(TRIM(`base`.`photo_img5`), '') IS NULL, 0, 150) +
    IF(NULLIF(TRIM(`base`.`photo_img6`), '') IS NULL, 0, 150) +
    IF(NULLIF(TRIM(`base`.`it_img1`), '') IS NULL, 0, 100) +
    IF(NULLIF(TRIM(`base`.`it_img2`), '') IS NULL, 0, 100) +
    IF(NULLIF(TRIM(`base`.`it_img3`), '') IS NULL, 0, 100) +
    IF(NULLIF(TRIM(`base`.`it_img4`), '') IS NULL, 0, 100) +
    IF(NULLIF(TRIM(`base`.`it_img5`), '') IS NULL, 0, 100) +
    IF(NULLIF(TRIM(`base`.`it_img6`), '') IS NULL, 0, 100) +
    IF(NULLIF(TRIM(`base`.`it_img7`), '') IS NULL, 0, 100) +
    IF(NULLIF(TRIM(`base`.`it_img8`), '') IS NULL, 0, 100)
  ) AS `quality_score`
FROM (
  SELECT
    `tmp_teacher_all`.*,
    CASE
      WHEN `source_db` = 'bnbuniv'
        AND `source_table` = 'g5_teacher2'
        AND `subject` LIKE '[%]%'
      THEN TRIM(REGEXP_REPLACE(
        REPLACE(REPLACE(REPLACE(SUBSTRING_INDEX(`subject`, ']', -1), '&nbsp;', ' '), CHAR(13), ' '), CHAR(10), ' '),
        '<[^>]+>',
        ''
      ))
      ELSE TRIM(REPLACE(REPLACE(`name`, CHAR(13), ' '), CHAR(10), ' '))
    END AS `resolved_name`,
    CASE
      WHEN `source_db` = 'bnbuniv'
        AND `source_table` = 'g5_teacher2'
        AND `subject` LIKE '[%]%'
      THEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(`subject`, ']', 1), '[', -1))
      ELSE TRIM(REPLACE(REPLACE(`subject`, CHAR(13), ' '), CHAR(10), ' '))
    END AS `resolved_role`
  FROM `tmp_teacher_all`
) AS `base`;

DELETE FROM `tmp_teacher_normalized`
WHERE `normalized_name` IS NULL;

DROP TEMPORARY TABLE IF EXISTS `tmp_curated_teacher_centers`;

CREATE TEMPORARY TABLE `tmp_curated_teacher_centers` (
  `normalized_name` varchar(255) NOT NULL,
  `center` varchar(32) NOT NULL,
  `role` varchar(64) NOT NULL,
  `center_order` int(11) NOT NULL,
  `fallback_order` int(11) NOT NULL,
  PRIMARY KEY (`normalized_name`, `center`)
) ENGINE=Memory DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tmp_curated_teacher_centers` (`normalized_name`, `center`, `role`, `center_order`, `fallback_order`) VALUES
('송민지','art','배우',1,101),
('김민식','art','배우',2,102),
('장인섭','art','배우',3,103),
('송유현','art','배우',4,104),
('이달','art','배우',5,105),
('진예솔','art','배우',6,106),
('안창환','art','배우',7,107),
('송덕호','art','배우',8,108),
('박세준','art','배우',9,109),
('박정복','art','배우',10,110),
('박지홍','art','배우',11,111),
('여민구','art','배우',12,112),
('정유미','art','배우',13,113),
('유하나','art','배우',14,114),
('조재영','art','배우',15,115),
('이승원','art','배우',16,116),
('박주환','art','배우',17,117),
('김한나','art','배우',18,118),
('김정훈','art','배우',19,119),
('오정택','art','배우',20,120),
('장찬호','art','배우',21,121),
('김한수','art','배우',22,122),
('박진감','art','배우',23,123),
('한서이','art','배우',24,124),
('변준호','art','배우',25,125),
('하태건','art','배우',26,126),
('홍주혜','art','배우',27,127),
('오륭','art','배우',28,128),
('강현우','art','배우',29,129),
('강나리','art','배우',30,130),
('이운산','art','배우',31,131),
('김민하','art','배우',32,132),
('문현성','art','감독',33,133),
('김건보','art','캐스팅 디렉터',34,134),
('김미지','highteen','배우',1,201),
('송민지','highteen','배우',2,202),
('김예슬','highteen','배우',3,203),
('안서진','highteen','배우',4,204),
('박소현','highteen','배우',5,205),
('정태건','highteen','배우',6,206),
('신수항','highteen','배우',7,207),
('박지영','highteen','배우',8,208),
('황해리','highteen','배우',9,209),
('이재준','highteen','배우',10,210),
('오준혁','highteen','배우',11,211),
('김예진','highteen','배우',12,212),
('인규식','highteen','배우',13,213),
('강해리','highteen','배우',14,214),
('이다빛나','highteen','배우',15,215),
('이재혜','highteen','배우',16,216),
('유지연','highteen','배우',17,217),
('권미서','highteen','배우',18,218),
('양서윤','highteen','배우',19,219),
('전범진','highteen','배우',20,220),
('이현진','highteen','배우',21,221),
('이규학','highteen','배우',22,222),
('박하얀','highteen','감독',23,223),
('강동완','highteen','감독',24,224),
('김미지','kids','배우',1,301),
('송민지','kids','배우',2,302),
('김현실','kids','배우',3,303),
('이연주','kids','배우',4,304),
('민지혜','kids','배우',5,305),
('이서아','kids','배우',6,306),
('김예진','kids','배우',7,307),
('문창준','kids','배우',8,308),
('안서영','kids','배우',9,309),
('이재혜','kids','배우',10,310),
('이서정','kids','배우',11,311),
('김민정','kids','배우',12,312),
('안서진','kids','배우',13,313),
('김자연','kids','배우',14,314),
('송예준','kids','배우',15,315),
('임지은','kids','배우',16,316),
('이현진','kids','배우',17,317),
('황해리','kids','배우',18,318),
('김병현','exam','연기',1,501),
('김희원','exam','연기',2,502),
('문혜린','exam','연기',3,503),
('정태건','exam','연기',4,504),
('안서영','exam','연기',5,505),
('박범수','exam','연기',6,506),
('김홍교','exam','연기',7,507),
('정지영','exam','연기',8,508),
('김보은','exam','연기',9,509),
('인규식','exam','연기',10,510),
('곽지원','exam','무용',11,511),
('최은하','exam','무용',12,512),
('이다린','exam','무용',13,513),
('김윤정','exam','무용',14,514),
('류견진','exam','무용',15,515),
('최시율','exam','무용',16,516),
('강민경','exam','무용',17,517),
('황윤정','exam','뮤지컬',18,518),
('송예준','exam','뮤지컬',19,519),
('신동해','exam','뮤지컬',20,520),
('양서윤','exam','뮤지컬',21,521),
('전범진','exam','뮤지컬',22,522),
('김민식','exam','고문',23,523),
('장인섭','exam','고문',24,524),
('변효준','exam','고문',25,525),
('김한수','exam','고문',26,526),
('김예슬','exam','고문',27,527),
('김예진','exam','고문',28,528),
('안서진','exam','고문',29,529),
('박소현','exam','고문',30,530),
('황해리','exam','고문',31,531),
('이연주','exam','고문',32,532);

DROP TEMPORARY TABLE IF EXISTS `tmp_curated_teacher_order_seed`;

CREATE TEMPORARY TABLE `tmp_curated_teacher_order_seed` AS
SELECT
  `normalized_name`,
  AVG(`center_order`) AS `average_order`,
  MIN(`center_order`) AS `minimum_order`
FROM `tmp_curated_teacher_centers`
WHERE `center` <> 'exam'
GROUP BY `normalized_name`;

DROP TEMPORARY TABLE IF EXISTS `tmp_curated_teacher_order`;

CREATE TEMPORARY TABLE `tmp_curated_teacher_order` (
  `normalized_name` varchar(255) NOT NULL,
  `display_order` int(11) NOT NULL,
  PRIMARY KEY (`normalized_name`)
) ENGINE=Memory DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tmp_curated_teacher_order` (`normalized_name`, `display_order`)
SELECT
  `ranked`.`normalized_name`,
  `ranked`.`display_order`
FROM (
  SELECT
    `seed`.`normalized_name`,
    ROW_NUMBER() OVER (
      ORDER BY `seed`.`average_order`, `seed`.`minimum_order`, `seed`.`normalized_name`
    ) AS `display_order`
  FROM `tmp_curated_teacher_order_seed` AS `seed`
) AS `ranked`;

INSERT INTO `tmp_curated_teacher_order` (`normalized_name`, `display_order`)
SELECT
  `ranked`.`normalized_name`,
  500 + `ranked`.`exam_order`
FROM (
  SELECT
    `exam`.`normalized_name`,
    ROW_NUMBER() OVER (
      ORDER BY `exam`.`center_order`, `exam`.`normalized_name`
    ) AS `exam_order`
  FROM `tmp_curated_teacher_centers` AS `exam`
  LEFT JOIN `tmp_curated_teacher_order_seed` AS `seed`
    ON `seed`.`normalized_name` = `exam`.`normalized_name`
  WHERE `exam`.`center` = 'exam'
    AND `seed`.`normalized_name` IS NULL
) AS `ranked`;

DROP TEMPORARY TABLE IF EXISTS `tmp_teacher_representatives`;

CREATE TEMPORARY TABLE `tmp_teacher_representatives` AS
SELECT *
FROM (
  SELECT
    `tmp_teacher_normalized`.*,
    ROW_NUMBER() OVER (
      PARTITION BY `normalized_name`
      ORDER BY `quality_score` DESC, `source_priority`, `table_priority`, `bn_order`, `bn_id`
    ) AS `representative_rank`
  FROM `tmp_teacher_normalized`
) AS `ranked_teachers`
WHERE `representative_rank` = 1;

INSERT INTO `bnb_legacy_work`.`teachers` (
  `source_db`,
  `source_table`,
  `source_id`,
  `slug`,
  `name`,
  `normalized_name`,
  `role`,
  `centers`,
  `summary`,
  `body_html`,
  `profile_image_path`,
  `photo_image1`,
  `photo_image2`,
  `photo_image3`,
  `photo_image4`,
  `photo_image5`,
  `photo_image6`,
  `gallery`,
  `display_order`,
  `status`,
  `legacy_meta`
)
SELECT
  `representative`.`source_db`,
  `representative`.`source_table`,
  `representative`.`bn_id` AS `source_id`,
  CONCAT('teacher-', `representative`.`source_db`, '-', `representative`.`source_table`, '-', `representative`.`bn_id`) AS `slug`,
  `representative`.`normalized_name` AS `name`,
  `representative`.`normalized_name`,
  `representative`.`normalized_role` AS `role`,
  COALESCE(
    (
      SELECT CONCAT('[', GROUP_CONCAT(JSON_QUOTE(`curated`.`center`) ORDER BY FIELD(`curated`.`center`, 'art', 'exam', 'kids', 'highteen') SEPARATOR ','), ']')
      FROM `tmp_curated_teacher_centers` AS `curated`
      WHERE `curated`.`normalized_name` = `representative`.`normalized_name`
    ),
    (
      SELECT CONCAT('[', GROUP_CONCAT(DISTINCT JSON_QUOTE(`source`.`source_center`) ORDER BY FIELD(`source`.`source_center`, 'art', 'exam', 'kids', 'highteen') SEPARATOR ','), ']')
      FROM `tmp_teacher_normalized` AS `source`
      WHERE `source`.`normalized_name` = `representative`.`normalized_name`
    ),
    JSON_ARRAY('unknown')
  ) AS `centers`,
  NULLIF(`representative`.`summary`, '') AS `summary`,
  NULLIF(`representative`.`message`, '') AS `body_html`,
  NULLIF(TRIM(`representative`.`bn_bimg`), '') AS `profile_image_path`,
  NULLIF(TRIM(`representative`.`photo_img1`), '') AS `photo_image1`,
  NULLIF(TRIM(`representative`.`photo_img2`), '') AS `photo_image2`,
  NULLIF(TRIM(`representative`.`photo_img3`), '') AS `photo_image3`,
  NULLIF(TRIM(`representative`.`photo_img4`), '') AS `photo_image4`,
  NULLIF(TRIM(`representative`.`photo_img5`), '') AS `photo_image5`,
  NULLIF(TRIM(`representative`.`photo_img6`), '') AS `photo_image6`,
  JSON_ARRAY(
    JSON_OBJECT('path', NULLIF(TRIM(`representative`.`it_img1`), ''), 'title', NULLIF(TRIM(`representative`.`it_img_title1`), ''), 'description', NULLIF(TRIM(`representative`.`it_img_desc1`), '')),
    JSON_OBJECT('path', NULLIF(TRIM(`representative`.`it_img2`), ''), 'title', NULLIF(TRIM(`representative`.`it_img_title2`), ''), 'description', NULLIF(TRIM(`representative`.`it_img_desc2`), '')),
    JSON_OBJECT('path', NULLIF(TRIM(`representative`.`it_img3`), ''), 'title', NULLIF(TRIM(`representative`.`it_img_title3`), ''), 'description', NULLIF(TRIM(`representative`.`it_img_desc3`), '')),
    JSON_OBJECT('path', NULLIF(TRIM(`representative`.`it_img4`), ''), 'title', NULLIF(TRIM(`representative`.`it_img_title4`), ''), 'description', NULLIF(TRIM(`representative`.`it_img_desc4`), '')),
    JSON_OBJECT('path', NULLIF(TRIM(`representative`.`it_img5`), ''), 'title', NULLIF(TRIM(`representative`.`it_img_title5`), ''), 'description', NULLIF(TRIM(`representative`.`it_img_desc5`), '')),
    JSON_OBJECT('path', NULLIF(TRIM(`representative`.`it_img6`), ''), 'title', NULLIF(TRIM(`representative`.`it_img_title6`), ''), 'description', NULLIF(TRIM(`representative`.`it_img_desc6`), '')),
    JSON_OBJECT('path', NULLIF(TRIM(`representative`.`it_img7`), ''), 'title', NULLIF(TRIM(`representative`.`it_img_title7`), ''), 'description', NULLIF(TRIM(`representative`.`it_img_desc7`), '')),
    JSON_OBJECT('path', NULLIF(TRIM(`representative`.`it_img8`), ''), 'title', NULLIF(TRIM(`representative`.`it_img_title8`), ''), 'description', NULLIF(TRIM(`representative`.`it_img_desc8`), ''))
  ) AS `gallery`,
  COALESCE(
    (
      SELECT `curated_order`.`display_order`
      FROM `tmp_curated_teacher_order` AS `curated_order`
      WHERE `curated_order`.`normalized_name` = `representative`.`normalized_name`
    ),
    9000 + COALESCE(`representative`.`bn_order`, 0)
  ) AS `display_order`,
  IF(
    EXISTS (
      SELECT 1
      FROM `tmp_curated_teacher_centers` AS `curated`
      WHERE `curated`.`normalized_name` = `representative`.`normalized_name`
    ),
    'published',
    'draft'
  ) AS `status`,
  JSON_OBJECT(
    'selectedSource', JSON_OBJECT(
      'sourceDb', `representative`.`source_db`,
      'sourceCenter', `representative`.`source_center`,
      'sourceTable', `representative`.`source_table`,
      'sourceId', `representative`.`bn_id`,
      'qualityScore', `representative`.`quality_score`
    ),
    'sources', (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'sourceDb', `source`.`source_db`,
          'sourceCenter', `source`.`source_center`,
          'sourceTable', `source`.`source_table`,
          'sourceId', `source`.`bn_id`,
          'name', `source`.`name`,
          'resolvedName', `source`.`normalized_name`,
          'role', `source`.`normalized_role`,
          'subject', `source`.`subject`,
          'displayOrder', `source`.`bn_order`,
          'qualityScore', `source`.`quality_score`
        )
        ORDER BY `source`.`source_priority`, `source`.`table_priority`, `source`.`bn_id`
      )
      FROM `tmp_teacher_normalized` AS `source`
      WHERE `source`.`normalized_name` = `representative`.`normalized_name`
    ),
    'rawSourceCenters', (
      SELECT CONCAT('[', GROUP_CONCAT(DISTINCT JSON_QUOTE(`source`.`source_center`) ORDER BY FIELD(`source`.`source_center`, 'art', 'exam', 'kids', 'highteen') SEPARATOR ','), ']')
      FROM `tmp_teacher_normalized` AS `source`
      WHERE `source`.`normalized_name` = `representative`.`normalized_name`
    ),
    'centerSource', IF(
      EXISTS (
        SELECT 1
        FROM `tmp_curated_teacher_centers` AS `curated`
        WHERE `curated`.`normalized_name` = `representative`.`normalized_name`
      ),
      'curated-teacher-md',
      'legacy-source-db'
    ),
    'curatedList', JSON_OBJECT(
      'displayOrder', (
        SELECT `curated_order`.`display_order`
        FROM `tmp_curated_teacher_order` AS `curated_order`
        WHERE `curated_order`.`normalized_name` = `representative`.`normalized_name`
      ),
      'centers', (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'center', `curated`.`center`,
          'role', `curated`.`role`,
          'sourceOrder', `curated`.`center_order`
        )
        ORDER BY FIELD(`curated`.`center`, 'art', 'highteen', 'kids', 'exam'), `curated`.`center_order`
      )
      FROM `tmp_curated_teacher_centers` AS `curated`
      WHERE `curated`.`normalized_name` = `representative`.`normalized_name`
      )
    ),
    'piece', NULLIF(`representative`.`piece`, ''),
    'profileImagePaths', JSON_ARRAY(
      NULLIF(TRIM(`representative`.`pr_1`), ''),
      NULLIF(TRIM(`representative`.`pr_2`), ''),
      NULLIF(TRIM(`representative`.`pr_3`), ''),
      NULLIF(TRIM(`representative`.`pr_4`), ''),
      NULLIF(TRIM(`representative`.`pr_5`), ''),
      NULLIF(TRIM(`representative`.`pr_6`), ''),
      NULLIF(TRIM(`representative`.`pr_7`), ''),
      NULLIF(TRIM(`representative`.`pr_8`), ''),
      NULLIF(TRIM(`representative`.`pr_9`), '')
    ),
    'itImgSort', NULLIF(TRIM(`representative`.`it_img_sort`), '')
  ) AS `legacy_meta`
FROM `tmp_teacher_representatives` AS `representative`
ORDER BY `representative`.`source_priority`, `representative`.`table_priority`, `representative`.`bn_order`, `representative`.`bn_id`;

DROP TEMPORARY TABLE IF EXISTS `tmp_teacher_file_all`;

CREATE TEMPORARY TABLE `tmp_teacher_file_all` AS
SELECT 'baewoo' AS `source_db`, 'g5_teacher_file' AS `source_table`, `wr_id`, `wr_file`, `wr_subject`, `wr_desc`, `bn_id`, `wr_sort`
FROM `baewoo`.`g5_teacher_file`
UNION ALL
SELECT 'bnbuniv', 'g5_teacher_file', `wr_id`, `wr_file`, `wr_subject`, `wr_desc`, `bn_id`, `wr_sort`
FROM `bnbuniv`.`g5_teacher_file`
UNION ALL
SELECT 'bnbhighteen', 'g5_teacher_file', `wr_id`, `wr_file`, `wr_subject`, `wr_desc`, `bn_id`, `wr_sort`
FROM `bnbhighteen`.`g5_teacher_file`;

DROP TEMPORARY TABLE IF EXISTS `tmp_teacher_file_resolved`;

CREATE TEMPORARY TABLE `tmp_teacher_file_resolved` AS
SELECT
  `file`.*,
  `teacher`.`normalized_name` AS `teacher_name_from_g5_teacher`,
  `teacher2`.`normalized_name` AS `teacher_name_from_g5_teacher2`,
  COALESCE(`teacher`.`normalized_name`, `teacher2`.`normalized_name`) AS `resolved_teacher_name`,
  CASE
    WHEN `teacher`.`normalized_name` IS NOT NULL THEN 'g5_teacher'
    WHEN `teacher2`.`normalized_name` IS NOT NULL THEN 'g5_teacher2'
    ELSE NULL
  END AS `resolved_teacher_source_table`
FROM `tmp_teacher_file_all` AS `file`
LEFT JOIN `tmp_teacher_normalized` AS `teacher`
  ON `teacher`.`source_db` = `file`.`source_db`
  AND `teacher`.`source_table` = 'g5_teacher'
  AND `teacher`.`bn_id` = `file`.`bn_id`
LEFT JOIN `tmp_teacher_normalized` AS `teacher2`
  ON `teacher2`.`source_db` = `file`.`source_db`
  AND `teacher2`.`source_table` = 'g5_teacher2'
  AND `teacher2`.`bn_id` = `file`.`bn_id`;

INSERT INTO `bnb_legacy_work`.`teacher_files` (
  `source_db`,
  `source_table`,
  `source_id`,
  `teacher_source_id`,
  `resolved_teacher_id`,
  `resolved_teacher_slug`,
  `resolved_teacher_name`,
  `title`,
  `file_path`,
  `description`,
  `display_order`,
  `legacy_meta`
)
SELECT
  `file`.`source_db`,
  `file`.`source_table`,
  `file`.`wr_id` AS `source_id`,
  `file`.`bn_id` AS `teacher_source_id`,
  `teacher`.`id` AS `resolved_teacher_id`,
  `teacher`.`slug` AS `resolved_teacher_slug`,
  `file`.`resolved_teacher_name`,
  NULLIF(TRIM(`file`.`wr_subject`), '') AS `title`,
  NULLIF(TRIM(`file`.`wr_file`), '') AS `file_path`,
  NULLIF(TRIM(`file`.`wr_desc`), '') AS `description`,
  COALESCE(`file`.`wr_sort`, 0) AS `display_order`,
  JSON_OBJECT(
    'sourceDb', `file`.`source_db`,
    'sourceTable', `file`.`source_table`,
    'sourceId', `file`.`wr_id`,
    'teacherSourceId', `file`.`bn_id`,
    'resolvedBy', `file`.`resolved_teacher_source_table`,
    'teacherCandidates', JSON_OBJECT(
      'g5Teacher', `file`.`teacher_name_from_g5_teacher`,
      'g5Teacher2', `file`.`teacher_name_from_g5_teacher2`
    )
  ) AS `legacy_meta`
FROM `tmp_teacher_file_resolved` AS `file`
LEFT JOIN `bnb_legacy_work`.`teachers` AS `teacher`
  ON `teacher`.`normalized_name` = `file`.`resolved_teacher_name`
ORDER BY `file`.`source_db`, `file`.`bn_id`, `file`.`wr_sort`, `file`.`wr_id`;

INSERT INTO `bnb_legacy_work`.`teacher_lessons` (
  `source_db`,
  `source_table`,
  `source_id`,
  `category`,
  `teacher_name`,
  `resolved_teacher_id`,
  `resolved_teacher_slug`,
  `subject`,
  `title_raw`,
  `content_raw`,
  `legacy_meta`
)
SELECT
  'baewoo' AS `source_db`,
  'g5_lesson_teacher' AS `source_table`,
  `lesson`.`lt_idx` AS `source_id`,
  NULLIF(TRIM(`lesson`.`lt_category`), '') AS `category`,
  NULLIF(TRIM(`lesson`.`lt_name`), '') AS `teacher_name`,
  `teacher`.`id` AS `resolved_teacher_id`,
  `teacher`.`slug` AS `resolved_teacher_slug`,
  NULLIF(TRIM(`lesson`.`lt_subject`), '') AS `subject`,
  NULLIF(`lesson`.`lt_title`, '') AS `title_raw`,
  NULLIF(`lesson`.`lt_content`, '') AS `content_raw`,
  JSON_OBJECT(
    'sourceDb', 'baewoo',
    'sourceTable', 'g5_lesson_teacher',
    'sourceId', `lesson`.`lt_idx`
  ) AS `legacy_meta`
FROM `baewoo`.`g5_lesson_teacher` AS `lesson`
LEFT JOIN `bnb_legacy_work`.`teachers` AS `teacher`
  ON `teacher`.`normalized_name` = NULLIF(TRIM(`lesson`.`lt_name`), '')
ORDER BY `lesson`.`lt_idx`;
