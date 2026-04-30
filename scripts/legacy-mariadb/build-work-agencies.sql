SET SESSION group_concat_max_len = 1048576;

CREATE DATABASE IF NOT EXISTS `bnb_legacy_work`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bnb_legacy_work`;

DROP TABLE IF EXISTS `bnb_legacy_work`.`agencies`;

CREATE TABLE `bnb_legacy_work`.`agencies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_db` varchar(32) NOT NULL,
  `source_table` varchar(64) NOT NULL,
  `source_id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `summary` mediumtext DEFAULT NULL,
  `body_html` mediumtext DEFAULT NULL,
  `profile_image_path` varchar(255) DEFAULT NULL,
  `actors` longtext DEFAULT NULL CHECK (JSON_VALID(`actors`)),
  `display_order` int(11) NOT NULL DEFAULT 0,
  `legacy_meta` longtext DEFAULT NULL CHECK (JSON_VALID(`legacy_meta`)),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `agencies_slug_idx` (`slug`),
  UNIQUE KEY `agencies_subject_idx` (`subject`),
  KEY `agencies_source_idx` (`source_db`, `source_table`, `source_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TEMPORARY TABLE IF EXISTS `tmp_agencies_all`;

CREATE TEMPORARY TABLE `tmp_agencies_all` AS
SELECT
  'baewoo' AS `source_db`,
  'art' AS `center`,
  1 AS `source_priority`,
  `bn_id`,
  `name`,
  TRIM(`subject`) AS `normalized_subject`,
  `subject`,
  `summary`,
  `message`,
  `piece`,
  `bn_bimg`,
  `bn_order`,
  `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`,
  `wr_11`, `wr_12`, `wr_13`, `wr_14`, `wr_15`, `wr_16`, `wr_17`, `wr_18`, `wr_19`, `wr_20`,
  `wr_21`, `wr_22`, `wr_23`, `wr_24`, `wr_25`, `wr_26`, `wr_27`, `wr_28`, `wr_29`, `wr_30`,
  `wr_31`, `wr_32`, `wr_33`, `wr_34`, `wr_35`, `wr_36`, `wr_37`, `wr_38`, `wr_39`, `wr_40`,
  `wr_41`, `wr_42`, `wr_43`,
  `pr_1`, `pr_2`, `pr_3`, `pr_4`, `pr_5`, `pr_6`, `pr_7`, `pr_8`, `pr_9`,
  `it_img1`, `it_img2`, `it_img3`, `it_img4`, `it_img5`, `it_img6`, `it_img7`, `it_img8`
FROM `baewoo`.`g5_agency`
UNION ALL
SELECT
  'kidscenter' AS `source_db`,
  'kids' AS `center`,
  2 AS `source_priority`,
  `bn_id`,
  `name`,
  TRIM(`subject`) AS `normalized_subject`,
  `subject`,
  `summary`,
  `message`,
  `piece`,
  `bn_bimg`,
  `bn_order`,
  `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`,
  `wr_11`, `wr_12`, `wr_13`, `wr_14`, `wr_15`, `wr_16`, `wr_17`, `wr_18`, `wr_19`, `wr_20`,
  `wr_21`, `wr_22`, `wr_23`, `wr_24`, `wr_25`, `wr_26`, `wr_27`, `wr_28`, `wr_29`, `wr_30`,
  `wr_31`, `wr_32`, `wr_33`, `wr_34`, `wr_35`, `wr_36`, `wr_37`, `wr_38`, `wr_39`, `wr_40`,
  `wr_41`, `wr_42`, `wr_43`,
  `pr_1`, `pr_2`, `pr_3`, `pr_4`, `pr_5`, `pr_6`, `pr_7`, `pr_8`, `pr_9`,
  `it_img1`, `it_img2`, `it_img3`, `it_img4`, `it_img5`, `it_img6`, `it_img7`, `it_img8`
FROM `kidscenter`.`g5_agency`
UNION ALL
SELECT
  'bnbuniv' AS `source_db`,
  'exam' AS `center`,
  3 AS `source_priority`,
  `bn_id`,
  `name`,
  TRIM(`subject`) AS `normalized_subject`,
  `subject`,
  `summary`,
  `message`,
  `piece`,
  `bn_bimg`,
  `bn_order`,
  `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`,
  `wr_11`, `wr_12`, `wr_13`, `wr_14`, `wr_15`, `wr_16`, `wr_17`, `wr_18`, `wr_19`, `wr_20`,
  `wr_21`, `wr_22`, `wr_23`, `wr_24`, `wr_25`, `wr_26`, `wr_27`, `wr_28`, `wr_29`, `wr_30`,
  `wr_31`, `wr_32`, `wr_33`, `wr_34`, `wr_35`, `wr_36`, `wr_37`, `wr_38`, `wr_39`, `wr_40`,
  `wr_41`, `wr_42`, `wr_43`,
  `pr_1`, `pr_2`, `pr_3`, `pr_4`, `pr_5`, `pr_6`, `pr_7`, `pr_8`, `pr_9`,
  `it_img1`, `it_img2`, `it_img3`, `it_img4`, `it_img5`, `it_img6`, `it_img7`, `it_img8`
FROM `bnbuniv`.`g5_agency`
UNION ALL
SELECT
  'bnbhighteen' AS `source_db`,
  'highteen' AS `center`,
  4 AS `source_priority`,
  `bn_id`,
  `name`,
  TRIM(`subject`) AS `normalized_subject`,
  `subject`,
  `summary`,
  `message`,
  `piece`,
  `bn_bimg`,
  `bn_order`,
  `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`, `wr_9`, `wr_10`,
  `wr_11`, `wr_12`, `wr_13`, `wr_14`, `wr_15`, `wr_16`, `wr_17`, `wr_18`, `wr_19`, `wr_20`,
  `wr_21`, `wr_22`, `wr_23`, `wr_24`, `wr_25`, `wr_26`, `wr_27`, `wr_28`, `wr_29`, `wr_30`,
  `wr_31`, `wr_32`, `wr_33`, `wr_34`, `wr_35`, `wr_36`, `wr_37`, `wr_38`, `wr_39`, `wr_40`,
  `wr_41`, `wr_42`, `wr_43`,
  `pr_1`, `pr_2`, `pr_3`, `pr_4`, `pr_5`, `pr_6`, `pr_7`, `pr_8`, `pr_9`,
  `it_img1`, `it_img2`, `it_img3`, `it_img4`, `it_img5`, `it_img6`, `it_img7`, `it_img8`
FROM `bnbhighteen`.`g5_agency`;

DROP TEMPORARY TABLE IF EXISTS `tmp_agency_representatives`;

CREATE TEMPORARY TABLE `tmp_agency_representatives` AS
SELECT *
FROM (
  SELECT
    `tmp_agencies_all`.*,
    ROW_NUMBER() OVER (
      PARTITION BY `normalized_subject`
      ORDER BY `source_priority`, `bn_id`
    ) AS `representative_rank`
  FROM `tmp_agencies_all`
) AS `ranked_agencies`
WHERE `representative_rank` = 1;

DROP TEMPORARY TABLE IF EXISTS `tmp_agency_actor_slots_raw`;

CREATE TEMPORARY TABLE `tmp_agency_actor_slots_raw` AS
SELECT
  `tmp_agencies_all`.`normalized_subject`,
  `tmp_agencies_all`.`source_priority`,
  `tmp_agencies_all`.`bn_id`,
  `actor_slots`.`actor_order`,
  NULLIF(TRIM(CASE `actor_slots`.`actor_order`
    WHEN 1 THEN `wr_1` WHEN 2 THEN `wr_3` WHEN 3 THEN `wr_5` WHEN 4 THEN `wr_7`
    WHEN 5 THEN `wr_9` WHEN 6 THEN `wr_11` WHEN 7 THEN `wr_13` WHEN 8 THEN `wr_15`
    WHEN 9 THEN `wr_17` WHEN 10 THEN `wr_19` WHEN 11 THEN `wr_21` WHEN 12 THEN `wr_23`
    WHEN 13 THEN `wr_25` WHEN 14 THEN `wr_27` WHEN 15 THEN `wr_29` WHEN 16 THEN `wr_31`
    WHEN 17 THEN `wr_33` WHEN 18 THEN `wr_35` WHEN 19 THEN `wr_37` WHEN 20 THEN `wr_39`
    WHEN 21 THEN `wr_41` WHEN 22 THEN `wr_43`
  END), '') AS `actor_name`,
  NULLIF(TRIM(CASE `actor_slots`.`actor_order`
    WHEN 1 THEN `wr_2` WHEN 2 THEN `wr_4` WHEN 3 THEN `wr_6` WHEN 4 THEN `wr_8`
    WHEN 5 THEN `wr_10` WHEN 6 THEN `wr_12` WHEN 7 THEN `wr_14` WHEN 8 THEN `wr_16`
    WHEN 9 THEN `wr_18` WHEN 10 THEN `wr_20` WHEN 11 THEN `wr_22` WHEN 12 THEN `wr_24`
    WHEN 13 THEN `wr_26` WHEN 14 THEN `wr_28` WHEN 15 THEN `wr_30` WHEN 16 THEN `wr_32`
    WHEN 17 THEN `wr_34` WHEN 18 THEN `wr_36` WHEN 19 THEN `wr_38` WHEN 20 THEN `wr_40`
    WHEN 21 THEN `wr_42`
  END), '') AS `generation`
FROM `tmp_agencies_all`
CROSS JOIN (
  SELECT 1 AS `actor_order` UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
  UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
  UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
  UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16
  UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20
  UNION ALL SELECT 21 UNION ALL SELECT 22
) AS `actor_slots`;

DELETE FROM `tmp_agency_actor_slots_raw`
WHERE `actor_name` IS NULL
  OR `actor_name` REGEXP '\\.(gif|jpe?g|png|svg|webp)$'
  OR `actor_name` LIKE '%/img/%';

DROP TEMPORARY TABLE IF EXISTS `tmp_agency_actor_slots`;

CREATE TEMPORARY TABLE `tmp_agency_actor_slots` AS
SELECT
  `deduped`.`normalized_subject`,
  `deduped`.`actor_order`,
  `deduped`.`actor_name`,
  `deduped`.`generation`,
  `deduped`.`source_priority`,
  `deduped`.`bn_id`
FROM (
  SELECT
    `tmp_agency_actor_slots_raw`.*,
    ROW_NUMBER() OVER (
      PARTITION BY
        `tmp_agency_actor_slots_raw`.`normalized_subject`,
        `tmp_agency_actor_slots_raw`.`actor_name`,
        COALESCE(`tmp_agency_actor_slots_raw`.`generation`, '')
      ORDER BY
        `tmp_agency_actor_slots_raw`.`source_priority`,
        `tmp_agency_actor_slots_raw`.`bn_id`,
        `tmp_agency_actor_slots_raw`.`actor_order`
    ) AS `actor_rank`
  FROM `tmp_agency_actor_slots_raw`
) AS `deduped`
WHERE `deduped`.`actor_rank` = 1;

INSERT INTO `bnb_legacy_work`.`agencies` (
  `source_db`,
  `source_table`,
  `source_id`,
  `slug`,
  `name`,
  `subject`,
  `summary`,
  `body_html`,
  `profile_image_path`,
  `actors`,
  `display_order`,
  `legacy_meta`
)
SELECT
  `representative`.`source_db`,
  'g5_agency' AS `source_table`,
  `representative`.`bn_id` AS `source_id`,
  CONCAT('agency-', `representative`.`source_db`, '-', `representative`.`bn_id`) AS `slug`,
  NULLIF(TRIM(`representative`.`name`), '') AS `name`,
  `representative`.`normalized_subject` AS `subject`,
  NULLIF(`representative`.`summary`, '') AS `summary`,
  NULLIF(`representative`.`message`, '') AS `body_html`,
  NULLIF(TRIM(`representative`.`bn_bimg`), '') AS `profile_image_path`,
  COALESCE((
    SELECT CONCAT(
      '[',
      GROUP_CONCAT(
        JSON_OBJECT(
          'name', `actor`.`actor_name`,
          'generation', `actor`.`generation`
        )
        ORDER BY `actor`.`source_priority`, `actor`.`bn_id`, `actor`.`actor_order`
        SEPARATOR ','
      ),
      ']'
    )
    FROM `tmp_agency_actor_slots` AS `actor`
    WHERE `actor`.`normalized_subject` = `representative`.`normalized_subject`
  ), JSON_ARRAY()) AS `actors`,
  COALESCE(`representative`.`bn_order`, 0) AS `display_order`,
  JSON_OBJECT(
    'selectedSource', JSON_OBJECT(
      'sourceDb', `representative`.`source_db`,
      'center', `representative`.`center`,
      'sourceTable', 'g5_agency',
      'sourceId', `representative`.`bn_id`
    ),
    'sources', (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'sourceDb', `source`.`source_db`,
          'center', `source`.`center`,
          'sourceTable', 'g5_agency',
          'sourceId', `source`.`bn_id`,
          'subject', `source`.`subject`,
          'displayOrder', `source`.`bn_order`
        )
        ORDER BY `source`.`source_priority`, `source`.`bn_id`
      )
      FROM `tmp_agencies_all` AS `source`
      WHERE `source`.`normalized_subject` = `representative`.`normalized_subject`
    ),
    'piece', NULLIF(`representative`.`piece`, ''),
    'galleryImages', JSON_ARRAY(
      NULLIF(TRIM(`representative`.`it_img1`), ''),
      NULLIF(TRIM(`representative`.`it_img2`), ''),
      NULLIF(TRIM(`representative`.`it_img3`), ''),
      NULLIF(TRIM(`representative`.`it_img4`), ''),
      NULLIF(TRIM(`representative`.`it_img5`), ''),
      NULLIF(TRIM(`representative`.`it_img6`), ''),
      NULLIF(TRIM(`representative`.`it_img7`), ''),
      NULLIF(TRIM(`representative`.`it_img8`), '')
    )
  ) AS `legacy_meta`
FROM `tmp_agency_representatives` AS `representative`
ORDER BY `representative`.`source_priority`, `representative`.`bn_order`, `representative`.`bn_id`;
