SET SESSION group_concat_max_len = 1048576;

CREATE DATABASE IF NOT EXISTS `bnb_legacy_work`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bnb_legacy_work`;

DROP TABLE IF EXISTS `bnb_legacy_work`.`star_cards`;

CREATE TABLE `bnb_legacy_work`.`star_cards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_db` varchar(32) NOT NULL,
  `source_table` varchar(64) NOT NULL,
  `source_id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(32) DEFAULT NULL,
  `normalized_title` varchar(255) NOT NULL,
  `body_html` mediumtext DEFAULT NULL,
  `map_url` text DEFAULT NULL,
  `logo_path` varchar(1024) DEFAULT NULL,
  `centers` longtext NOT NULL CHECK (JSON_VALID(`centers`)),
  `display_order` int(11) NOT NULL DEFAULT 0,
  `view_count` int(11) NOT NULL DEFAULT 0,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `published_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `legacy_meta` longtext DEFAULT NULL CHECK (JSON_VALID(`legacy_meta`)),
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `star_cards_slug_idx` (`slug`),
  UNIQUE KEY `star_cards_normalized_title_idx` (`normalized_title`),
  KEY `star_cards_source_idx` (`source_db`, `source_table`, `source_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TEMPORARY TABLE IF EXISTS `tmp_star_cards_all`;

CREATE TEMPORARY TABLE `tmp_star_cards_all` AS
SELECT
  'baewoo' AS `source_db`,
  'all' AS `center`,
  FIELD(
    `wr_id`,
    24, 46, 57, 59, 66, 52, 58, 75, 61, 78, 74, 80, 18,
    69, 68, 76, 45, 70, 67, 49, 73, 64, 65, 79, 11
  ) AS `source_priority`,
  `wr_id`,
  `wr_num`,
  `wr_subject`,
  LOWER(REPLACE(TRIM(`wr_subject`), ' ', '')) AS `normalized_title`,
  `wr_content`,
  `wr_hit`,
  `wr_datetime`,
  `public`
FROM `baewoo`.`g5_write_new_starcard`
WHERE `wr_id` IN (
  24, 46, 57, 59, 66, 52, 58, 75, 61, 78, 74, 80, 18,
  69, 68, 76, 45, 70, 67, 49, 73, 64, 65, 79, 11
);

DELETE FROM `tmp_star_cards_all`
WHERE `normalized_title` IS NULL
  OR `normalized_title` = '';

DROP TEMPORARY TABLE IF EXISTS `tmp_star_card_representatives`;

CREATE TEMPORARY TABLE `tmp_star_card_representatives` AS
SELECT *
FROM (
  SELECT
    `tmp_star_cards_all`.*,
    ROW_NUMBER() OVER (
      PARTITION BY `normalized_title`
      ORDER BY `source_priority`, `wr_id`
    ) AS `representative_rank`
  FROM `tmp_star_cards_all`
) AS `ranked_star_cards`
WHERE `representative_rank` = 1;

INSERT INTO `bnb_legacy_work`.`star_cards` (
  `source_db`,
  `source_table`,
  `source_id`,
  `slug`,
  `title`,
  `category`,
  `normalized_title`,
  `body_html`,
  `map_url`,
  `logo_path`,
  `centers`,
  `display_order`,
  `view_count`,
  `is_public`,
  `published_at`,
  `created_at`,
  `legacy_meta`
)
SELECT
  `representative`.`source_db`,
  'g5_write_new_starcard' AS `source_table`,
  `representative`.`wr_id` AS `source_id`,
  CASE `representative`.`wr_id`
    WHEN 24 THEN 'humake-fitness-nonhyeon'
    WHEN 46 THEN 'baewoohwa'
    WHEN 57 THEN 'ck-st-mary-eye-clinic'
    WHEN 59 THEN 'gangnam-miline-dental'
    WHEN 66 THEN 'gangnam-gentle-dental'
    WHEN 52 THEN 'jerim-plastic-surgery'
    WHEN 58 THEN 'chloen-plastic-surgery'
    WHEN 75 THEN 'rejuel-clinic-gangnam'
    WHEN 61 THEN 'motential-clinic'
    WHEN 78 THEN 'the-areumdaun-clinic'
    WHEN 74 THEN 'sipjangsaeng-korean-medicine'
    WHEN 80 THEN 'oda-korean-medicine-gangnam'
    WHEN 18 THEN 'soonsoo'
    WHEN 69 THEN 'muah'
    WHEN 68 THEN 'yoning'
    WHEN 76 THEN 'jungsaemmool-inspiration'
    WHEN 45 THEN 'maven-by-bumho'
    WHEN 70 THEN 'de-black-mens-hair'
    WHEN 67 THEN 'rhinoceros-optical'
    WHEN 49 THEN 'glow-beauty'
    WHEN 73 THEN 'dearmeal'
    WHEN 64 THEN 'the-venti'
    WHEN 65 THEN 'dank-coffee'
    WHEN 79 THEN 'addictive'
    WHEN 11 THEN 're-and'
    ELSE CONCAT('star-card-', `representative`.`wr_id`)
  END AS `slug`,
  TRIM(`representative`.`wr_subject`) AS `title`,
  CASE `representative`.`wr_id`
    WHEN 24 THEN 'health'
    WHEN 46 THEN 'profile'
    WHEN 57 THEN 'medical'
    WHEN 59 THEN 'medical'
    WHEN 66 THEN 'medical'
    WHEN 52 THEN 'medical'
    WHEN 58 THEN 'medical'
    WHEN 75 THEN 'medical'
    WHEN 61 THEN 'medical'
    WHEN 78 THEN 'medical'
    WHEN 74 THEN 'medical'
    WHEN 80 THEN 'medical'
    WHEN 18 THEN 'hairMakeup'
    WHEN 69 THEN 'hairMakeup'
    WHEN 68 THEN 'hairMakeup'
    WHEN 76 THEN 'hairMakeup'
    WHEN 45 THEN 'hairMakeup'
    WHEN 70 THEN 'hairMakeup'
    WHEN 67 THEN 'beauty'
    WHEN 49 THEN 'beauty'
    WHEN 73 THEN 'cafe'
    WHEN 64 THEN 'cafe'
    WHEN 65 THEN 'cafe'
    WHEN 79 THEN 'cafe'
    WHEN 11 THEN 'cafe'
    ELSE NULL
  END AS `category`,
  `representative`.`normalized_title`,
  NULLIF(`representative`.`wr_content`, '') AS `body_html`,
  CASE
    WHEN LOCATE('href="', `representative`.`wr_content`) > 0
      THEN NULLIF(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(`representative`.`wr_content`, 'href="', 2), 'href="', -1), '"', 1), '')
    WHEN LOCATE('href=''', `representative`.`wr_content`) > 0
      THEN NULLIF(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(`representative`.`wr_content`, 'href=''', 2), 'href=''', -1), '''', 1), '')
    ELSE NULL
  END AS `map_url`,
  CASE
    WHEN LOCATE('src="', `representative`.`wr_content`) > 0
      THEN NULLIF(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(`representative`.`wr_content`, 'src="', 2), 'src="', -1), '"', 1), '')
    WHEN LOCATE('src=''', `representative`.`wr_content`) > 0
      THEN NULLIF(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(`representative`.`wr_content`, 'src=''', 2), 'src=''', -1), '''', 1), '')
    ELSE NULL
  END AS `logo_path`,
  JSON_ARRAY('all') AS `centers`,
  `representative`.`source_priority` AS `display_order`,
  COALESCE(`representative`.`wr_hit`, 0) AS `view_count`,
  IF(COALESCE(TRIM(`representative`.`public`), '') = '0' OR UPPER(COALESCE(TRIM(`representative`.`public`), '')) = 'N', 0, 1) AS `is_public`,
  IF(`representative`.`wr_datetime` = '0000-00-00 00:00:00', CURRENT_TIMESTAMP, `representative`.`wr_datetime`) AS `published_at`,
  IF(`representative`.`wr_datetime` = '0000-00-00 00:00:00', CURRENT_TIMESTAMP, `representative`.`wr_datetime`) AS `created_at`,
  JSON_OBJECT(
    'dedupeKey', `representative`.`normalized_title`,
    'selectedSource', JSON_OBJECT(
      'sourceDb', `representative`.`source_db`,
      'center', `representative`.`center`,
      'sourceTable', 'g5_write_new_starcard',
      'sourceId', `representative`.`wr_id`
    ),
    'sources', (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'sourceDb', `source`.`source_db`,
          'center', `source`.`center`,
          'sourceTable', 'g5_write_new_starcard',
          'sourceId', `source`.`wr_id`,
          'title', `source`.`wr_subject`,
          'publishedAt', `source`.`wr_datetime`,
          'viewCount', `source`.`wr_hit`,
          'public', NULLIF(TRIM(`source`.`public`), '')
        )
        ORDER BY `source`.`source_priority`, `source`.`wr_id`
      )
      FROM `tmp_star_cards_all` AS `source`
      WHERE `source`.`normalized_title` = `representative`.`normalized_title`
    )
  ) AS `legacy_meta`
FROM `tmp_star_card_representatives` AS `representative`
ORDER BY `display_order`;
