SET SESSION group_concat_max_len = 1048576;

CREATE DATABASE IF NOT EXISTS `bnb_legacy_work`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bnb_legacy_work`;

DROP TABLE IF EXISTS `bnb_legacy_work`.`casting_appearances`;

CREATE TABLE `bnb_legacy_work`.`casting_appearances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_db` varchar(32) NOT NULL,
  `source_table` varchar(64) NOT NULL,
  `source_id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `center` varchar(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body_html` mediumtext DEFAULT NULL,
  `broadcaster` varchar(255) DEFAULT NULL,
  `production_company` varchar(512) DEFAULT NULL,
  `directors` varchar(512) DEFAULT NULL,
  `writers` varchar(512) DEFAULT NULL,
  `casting_status` varchar(255) DEFAULT NULL,
  `casting_company` varchar(255) DEFAULT NULL,
  `thumbnail_url` varchar(512) DEFAULT NULL,
  `thumbnail_path` varchar(512) DEFAULT NULL,
  `thumbnail_original_name` varchar(255) DEFAULT NULL,
  `published_at` datetime NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `legacy_meta` longtext DEFAULT NULL CHECK (JSON_VALID(`legacy_meta`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `casting_appearances_slug_idx` (`slug`),
  UNIQUE KEY `casting_appearances_source_idx` (`source_db`, `source_table`, `source_id`),
  KEY `casting_appearances_center_idx` (`center`),
  KEY `casting_appearances_status_idx` (`casting_status`),
  KEY `casting_appearances_company_idx` (`casting_company`),
  KEY `casting_appearances_published_idx` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TEMPORARY TABLE IF EXISTS `tmp_casting_appearances_all`;

CREATE TEMPORARY TABLE `tmp_casting_appearances_all` AS
SELECT
  'baewoo' AS `source_db`,
  'art' AS `center`,
  'g5_write_new_appear' AS `source_table`,
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`,
  `public`
FROM `baewoo`.`g5_write_new_appear`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'bnbhighteen' AS `source_db`,
  'highteen' AS `center`,
  'g5_write_new_appear' AS `source_table`,
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`,
  `public`
FROM `bnbhighteen`.`g5_write_new_appear`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'kidscenter' AS `source_db`,
  'kids' AS `center`,
  'g5_write_new_appear' AS `source_table`,
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`,
  `public`
FROM `kidscenter`.`g5_write_new_appear`
WHERE `wr_is_comment` = 0;

INSERT INTO `bnb_legacy_work`.`casting_appearances` (
  `source_db`,
  `source_table`,
  `source_id`,
  `slug`,
  `center`,
  `title`,
  `body_html`,
  `broadcaster`,
  `production_company`,
  `directors`,
  `writers`,
  `casting_status`,
  `casting_company`,
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
  `appearance`.`source_db`,
  `appearance`.`source_table`,
  `appearance`.`wr_id` AS `source_id`,
  CONCAT('casting-appearance-', `appearance`.`source_db`, '-', `appearance`.`wr_id`) AS `slug`,
  `appearance`.`center`,
  NULLIF(TRIM(`appearance`.`wr_subject`), '') AS `title`,
  NULLIF(`appearance`.`wr_content`, '') AS `body_html`,
  NULLIF(TRIM(`appearance`.`wr_1`), '') AS `broadcaster`,
  NULLIF(TRIM(`appearance`.`wr_2`), '') AS `production_company`,
  NULLIF(TRIM(`appearance`.`wr_3`), '') AS `directors`,
  NULLIF(TRIM(`appearance`.`wr_4`), '') AS `writers`,
  NULLIF(TRIM(`appearance`.`wr_5`), '') AS `casting_status`,
  NULLIF(TRIM(`appearance`.`wr_6`), '') AS `casting_company`,
  CASE
    WHEN `thumbnail`.`bf_file` IS NOT NULL THEN CONCAT(`host`.`base_url`, '/web/data/file/new_appear/', `thumbnail`.`bf_file`)
    ELSE NULL
  END AS `thumbnail_url`,
  CASE
    WHEN `thumbnail`.`bf_file` IS NOT NULL THEN CONCAT('/web/data/file/new_appear/', `thumbnail`.`bf_file`)
    ELSE NULL
  END AS `thumbnail_path`,
  NULLIF(TRIM(`thumbnail`.`bf_source`), '') AS `thumbnail_original_name`,
  COALESCE(NULLIF(`appearance`.`wr_datetime`, '0000-00-00 00:00:00'), '1970-01-01 00:00:00') AS `published_at`,
  IF(COALESCE(TRIM(`appearance`.`public`), '') = '0' OR UPPER(COALESCE(TRIM(`appearance`.`public`), '')) = 'N', 0, 1) AS `is_public`,
  COALESCE(NULLIF(`appearance`.`wr_datetime`, '0000-00-00 00:00:00'), '1970-01-01 00:00:00') AS `created_at`,
  CURRENT_TIMESTAMP AS `updated_at`,
  JSON_OBJECT(
    'sourceDb', `appearance`.`source_db`,
    'sourceTable', `appearance`.`source_table`,
    'sourceId', `appearance`.`wr_id`,
    'center', `appearance`.`center`,
    'rawCategory', NULLIF(TRIM(`appearance`.`ca_name`), ''),
    'wrHit', `appearance`.`wr_hit`,
    'wrFile', `appearance`.`wr_file`,
    'wrParent', `appearance`.`wr_parent`,
    'wrNum', `appearance`.`wr_num`,
    'wrOption', NULLIF(TRIM(`appearance`.`wr_option`), ''),
    'public', NULLIF(TRIM(`appearance`.`public`), ''),
    'rawFields', JSON_OBJECT(
      'wr1', `appearance`.`wr_1`,
      'wr2', `appearance`.`wr_2`,
      'wr3', `appearance`.`wr_3`,
      'wr4', `appearance`.`wr_4`,
      'wr5', `appearance`.`wr_5`,
      'wr6', `appearance`.`wr_6`,
      'wr7', `appearance`.`wr_7`,
      'wr8', `appearance`.`wr_8`,
      'wr9', `appearance`.`wr_9`,
      'wr10', `appearance`.`wr_10`
    ),
    'thumbnail', JSON_OBJECT(
      'url', CASE
        WHEN `thumbnail`.`bf_file` IS NOT NULL THEN CONCAT(`host`.`base_url`, '/web/data/file/new_appear/', `thumbnail`.`bf_file`)
        ELSE NULL
      END,
      'path', CASE
        WHEN `thumbnail`.`bf_file` IS NOT NULL THEN CONCAT('/web/data/file/new_appear/', `thumbnail`.`bf_file`)
        ELSE NULL
      END,
      'originalName', NULLIF(TRIM(`thumbnail`.`bf_source`), ''),
      'fileName', `thumbnail`.`bf_file`,
      'filesize', `thumbnail`.`bf_filesize`
    ),
    'links', JSON_OBJECT(
      'link1', NULLIF(TRIM(`appearance`.`wr_link1`), ''),
      'link2', NULLIF(TRIM(`appearance`.`wr_link2`), ''),
      'link1Hit', `appearance`.`wr_link1_hit`,
      'link2Hit', `appearance`.`wr_link2_hit`
    )
  ) AS `legacy_meta`
FROM `tmp_casting_appearances_all` AS `appearance`
JOIN (
  SELECT 'baewoo' AS `source_db`, 'https://www.baewoo.co.kr' AS `base_url`
  UNION ALL SELECT 'bnbhighteen', 'https://www.baewoo.me'
  UNION ALL SELECT 'kidscenter', 'https://www.baewoo.net'
) AS `host`
  ON `host`.`source_db` = `appearance`.`source_db`
LEFT JOIN (
  SELECT 'baewoo' AS `source_db`, `bo_table`, `wr_id`, `bf_no`, `bf_source`, `bf_file`, `bf_filesize` FROM `baewoo`.`g5_board_file`
  UNION ALL
  SELECT 'bnbhighteen', `bo_table`, `wr_id`, `bf_no`, `bf_source`, `bf_file`, `bf_filesize` FROM `bnbhighteen`.`g5_board_file`
  UNION ALL
  SELECT 'kidscenter', `bo_table`, `wr_id`, `bf_no`, `bf_source`, `bf_file`, `bf_filesize` FROM `kidscenter`.`g5_board_file`
) AS `thumbnail`
  ON `thumbnail`.`source_db` = `appearance`.`source_db`
  AND `thumbnail`.`bo_table` = 'new_appear'
  AND `thumbnail`.`wr_id` = `appearance`.`wr_id`
  AND `thumbnail`.`bf_no` = 0
  AND NULLIF(TRIM(`thumbnail`.`bf_file`), '') IS NOT NULL
WHERE NULLIF(TRIM(`appearance`.`wr_subject`), '') IS NOT NULL
ORDER BY `appearance`.`center`, `appearance`.`wr_datetime` DESC, `appearance`.`wr_id` DESC;
