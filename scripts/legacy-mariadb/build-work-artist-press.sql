SET SESSION group_concat_max_len = 1048576;

CREATE DATABASE IF NOT EXISTS `bnb_legacy_work`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bnb_legacy_work`;

DROP TABLE IF EXISTS `bnb_legacy_work`.`art_alumni_news`;
DROP TABLE IF EXISTS `bnb_legacy_work`.`artist_press`;

CREATE TABLE `bnb_legacy_work`.`artist_press` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_db` varchar(32) NOT NULL,
  `source_table` varchar(64) NOT NULL,
  `source_id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `center` varchar(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body_html` mediumtext DEFAULT NULL,
  `actor_name` varchar(255) NOT NULL,
  `generation` varchar(64) NOT NULL,
  `agency_logo_url` varchar(512) DEFAULT NULL,
  `agency_logo_path` varchar(512) DEFAULT NULL,
  `agency_logo_original_name` varchar(255) DEFAULT NULL,
  `thumbnail_url` varchar(512) DEFAULT NULL,
  `thumbnail_path` varchar(512) DEFAULT NULL,
  `thumbnail_original_name` varchar(255) DEFAULT NULL,
  `published_at` datetime NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `legacy_meta` longtext DEFAULT NULL CHECK (JSON_VALID(`legacy_meta`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `artist_press_slug_idx` (`slug`),
  UNIQUE KEY `artist_press_source_idx` (`source_db`, `source_table`, `source_id`),
  KEY `artist_press_actor_name_idx` (`actor_name`),
  KEY `artist_press_generation_idx` (`generation`),
  KEY `artist_press_published_at_idx` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `bnb_legacy_work`.`artist_press` (
  `source_db`,
  `source_table`,
  `source_id`,
  `slug`,
  `center`,
  `title`,
  `body_html`,
  `actor_name`,
  `generation`,
  `agency_logo_url`,
  `agency_logo_path`,
  `agency_logo_original_name`,
  `thumbnail_url`,
  `thumbnail_path`,
  `thumbnail_original_name`,
  `published_at`,
  `is_public`,
  `created_at`,
  `updated_at`,
  `legacy_meta`
)
SELECT
  'baewoo' AS `source_db`,
  'g5_write_new_shoot' AS `source_table`,
  `shoot`.`wr_id` AS `source_id`,
  CONCAT('artist-press-', `shoot`.`wr_id`) AS `slug`,
  'art' AS `center`,
  NULLIF(TRIM(`shoot`.`wr_subject`), '') AS `title`,
  NULLIF(`shoot`.`wr_content`, '') AS `body_html`,
  NULLIF(TRIM(`shoot`.`wr_3`), '') AS `actor_name`,
  NULLIF(TRIM(`shoot`.`wr_4`), '') AS `generation`,
  CASE
    WHEN `agency_logo`.`bf_file` IS NOT NULL THEN CONCAT('https://www.baewoo.co.kr/web/data/file/new_shoot/', `agency_logo`.`bf_file`)
    ELSE NULL
  END AS `agency_logo_url`,
  CASE
    WHEN `agency_logo`.`bf_file` IS NOT NULL THEN CONCAT('/web/data/file/new_shoot/', `agency_logo`.`bf_file`)
    ELSE NULL
  END AS `agency_logo_path`,
  NULLIF(TRIM(`agency_logo`.`bf_source`), '') AS `agency_logo_original_name`,
  CASE
    WHEN `thumbnail`.`bf_file` IS NOT NULL THEN CONCAT('https://www.baewoo.co.kr/web/data/file/new_shoot/', `thumbnail`.`bf_file`)
    ELSE NULL
  END AS `thumbnail_url`,
  CASE
    WHEN `thumbnail`.`bf_file` IS NOT NULL THEN CONCAT('/web/data/file/new_shoot/', `thumbnail`.`bf_file`)
    ELSE NULL
  END AS `thumbnail_path`,
  NULLIF(TRIM(`thumbnail`.`bf_source`), '') AS `thumbnail_original_name`,
  COALESCE(NULLIF(`shoot`.`wr_datetime`, '0000-00-00 00:00:00'), '1970-01-01 00:00:00') AS `published_at`,
  IF(COALESCE(TRIM(`shoot`.`public`), '') = '0' OR UPPER(COALESCE(TRIM(`shoot`.`public`), '')) = 'N', 0, 1) AS `is_public`,
  COALESCE(NULLIF(`shoot`.`wr_datetime`, '0000-00-00 00:00:00'), '1970-01-01 00:00:00') AS `created_at`,
  CURRENT_TIMESTAMP AS `updated_at`,
  JSON_OBJECT(
    'sourceDb', 'baewoo',
    'sourceTable', 'g5_write_new_shoot',
    'sourceId', `shoot`.`wr_id`,
    'rawFields', JSON_OBJECT(
      'wr1', `shoot`.`wr_1`,
      'wr2', `shoot`.`wr_2`,
      'wr3', `shoot`.`wr_3`,
      'wr4', `shoot`.`wr_4`,
      'wr5', `shoot`.`wr_5`,
      'wr6', `shoot`.`wr_6`,
      'wr7', `shoot`.`wr_7`,
      'wr8', `shoot`.`wr_8`,
      'wr9', `shoot`.`wr_9`,
      'wr10', `shoot`.`wr_10`
    ),
    'wrFile', `shoot`.`wr_file`,
    'wrHit', `shoot`.`wr_hit`,
    'wrParent', `shoot`.`wr_parent`,
    'wrNum', `shoot`.`wr_num`,
    'wrOption', NULLIF(TRIM(`shoot`.`wr_option`), ''),
    'links', JSON_OBJECT(
      'link1', NULLIF(TRIM(`shoot`.`wr_link1`), ''),
      'link2', NULLIF(TRIM(`shoot`.`wr_link2`), ''),
      'link1Hit', `shoot`.`wr_link1_hit`,
      'link2Hit', `shoot`.`wr_link2_hit`
    ),
    'files', JSON_OBJECT(
      'agencyLogo', JSON_OBJECT(
        'url', CASE
          WHEN `agency_logo`.`bf_file` IS NOT NULL THEN CONCAT('https://www.baewoo.co.kr/web/data/file/new_shoot/', `agency_logo`.`bf_file`)
          ELSE NULL
        END,
        'path', CASE
          WHEN `agency_logo`.`bf_file` IS NOT NULL THEN CONCAT('/web/data/file/new_shoot/', `agency_logo`.`bf_file`)
          ELSE NULL
        END,
        'originalName', NULLIF(TRIM(`agency_logo`.`bf_source`), ''),
        'fileName', `agency_logo`.`bf_file`,
        'filesize', `agency_logo`.`bf_filesize`
      ),
      'thumbnail', JSON_OBJECT(
        'url', CASE
          WHEN `thumbnail`.`bf_file` IS NOT NULL THEN CONCAT('https://www.baewoo.co.kr/web/data/file/new_shoot/', `thumbnail`.`bf_file`)
          ELSE NULL
        END,
        'path', CASE
          WHEN `thumbnail`.`bf_file` IS NOT NULL THEN CONCAT('/web/data/file/new_shoot/', `thumbnail`.`bf_file`)
          ELSE NULL
        END,
        'originalName', NULLIF(TRIM(`thumbnail`.`bf_source`), ''),
        'fileName', `thumbnail`.`bf_file`,
        'filesize', `thumbnail`.`bf_filesize`
      )
    )
  ) AS `legacy_meta`
FROM `baewoo`.`g5_write_new_shoot` AS `shoot`
LEFT JOIN `baewoo`.`g5_board_file` AS `agency_logo`
  ON `agency_logo`.`bo_table` = 'new_shoot'
  AND `agency_logo`.`wr_id` = `shoot`.`wr_id`
  AND `agency_logo`.`bf_no` = 0
  AND NULLIF(TRIM(`agency_logo`.`bf_file`), '') IS NOT NULL
LEFT JOIN `baewoo`.`g5_board_file` AS `thumbnail`
  ON `thumbnail`.`bo_table` = 'new_shoot'
  AND `thumbnail`.`wr_id` = `shoot`.`wr_id`
  AND `thumbnail`.`bf_no` = 1
  AND NULLIF(TRIM(`thumbnail`.`bf_file`), '') IS NOT NULL
WHERE `shoot`.`wr_is_comment` = 0
  AND NULLIF(TRIM(`shoot`.`wr_subject`), '') IS NOT NULL
  AND NULLIF(TRIM(`shoot`.`wr_3`), '') IS NOT NULL
  AND NULLIF(TRIM(`shoot`.`wr_4`), '') IS NOT NULL
ORDER BY `shoot`.`wr_datetime` DESC, `shoot`.`wr_id` DESC;
