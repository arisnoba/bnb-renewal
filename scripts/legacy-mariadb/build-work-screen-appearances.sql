SET SESSION group_concat_max_len = 1048576;

CREATE DATABASE IF NOT EXISTS `bnb_legacy_work`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bnb_legacy_work`;

DROP TABLE IF EXISTS `bnb_legacy_work`.`screen_appearances`;

CREATE TABLE `bnb_legacy_work`.`screen_appearances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_db` varchar(32) NOT NULL,
  `source_table` varchar(64) NOT NULL,
  `source_id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `center` varchar(32) NOT NULL,
  `appearance_type` varchar(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body_html` mediumtext DEFAULT NULL,
  `performer_name` varchar(255) NOT NULL,
  `class_name` varchar(255) DEFAULT NULL,
  `project_title` varchar(255) DEFAULT NULL,
  `role_name` varchar(255) DEFAULT NULL,
  `air_date_label` varchar(255) DEFAULT NULL,
  `profile_image_url` varchar(512) DEFAULT NULL,
  `profile_image_path` varchar(512) DEFAULT NULL,
  `profile_image_original_name` varchar(255) DEFAULT NULL,
  `thumbnail_url` varchar(512) DEFAULT NULL,
  `thumbnail_path` varchar(512) DEFAULT NULL,
  `thumbnail_original_name` varchar(255) DEFAULT NULL,
  `published_at` datetime NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `legacy_meta` longtext DEFAULT NULL CHECK (JSON_VALID(`legacy_meta`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `screen_appearances_slug_idx` (`slug`),
  UNIQUE KEY `screen_appearances_source_idx` (`source_db`, `source_table`, `source_id`),
  KEY `screen_appearances_center_idx` (`center`),
  KEY `screen_appearances_type_idx` (`appearance_type`),
  KEY `screen_appearances_performer_idx` (`performer_name`),
  KEY `screen_appearances_project_idx` (`project_title`),
  KEY `screen_appearances_published_idx` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TEMPORARY TABLE IF EXISTS `tmp_screen_appearances_all`;

CREATE TEMPORARY TABLE `tmp_screen_appearances_all` AS
SELECT
  'baewoo' AS `source_db`,
  'art' AS `center`,
  'g5_write_new_drama' AS `source_table`,
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`,
  `public`
FROM `baewoo`.`g5_write_new_drama`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'bnbhighteen' AS `source_db`,
  'highteen' AS `center`,
  'g5_write_new_drama' AS `source_table`,
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`,
  `public`
FROM `bnbhighteen`.`g5_write_new_drama`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'kidscenter' AS `source_db`,
  'kids' AS `center`,
  'g5_write_new_drama' AS `source_table`,
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`,
  `public`
FROM `kidscenter`.`g5_write_new_drama`
WHERE `wr_is_comment` = 0;

INSERT INTO `bnb_legacy_work`.`screen_appearances` (
  `source_db`,
  `source_table`,
  `source_id`,
  `slug`,
  `center`,
  `appearance_type`,
  `title`,
  `body_html`,
  `performer_name`,
  `class_name`,
  `project_title`,
  `role_name`,
  `air_date_label`,
  `profile_image_url`,
  `profile_image_path`,
  `profile_image_original_name`,
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
  CONCAT('screen-appearance-', `appearance`.`source_db`, '-', `appearance`.`wr_id`) AS `slug`,
  `appearance`.`center`,
  CASE
    WHEN CONCAT_WS(' ', `appearance`.`wr_subject`, `appearance`.`wr_4`) REGEXP '광고|CF|TVC|CM|캠페인' THEN 'commercial'
    ELSE 'drama'
  END AS `appearance_type`,
  NULLIF(TRIM(`appearance`.`wr_subject`), '') AS `title`,
  NULLIF(`appearance`.`wr_content`, '') AS `body_html`,
  NULLIF(TRIM(`appearance`.`wr_1`), '') AS `performer_name`,
  NULLIF(TRIM(`appearance`.`wr_3`), '') AS `class_name`,
  NULLIF(TRIM(`appearance`.`wr_4`), '') AS `project_title`,
  NULLIF(TRIM(`appearance`.`wr_5`), '') AS `role_name`,
  NULLIF(TRIM(`appearance`.`wr_6`), '') AS `air_date_label`,
  CASE
    WHEN `profile_image`.`bf_file` IS NOT NULL THEN CONCAT(`host`.`base_url`, '/web/data/file/new_drama/', `profile_image`.`bf_file`)
    ELSE NULL
  END AS `profile_image_url`,
  CASE
    WHEN `profile_image`.`bf_file` IS NOT NULL THEN CONCAT('/web/data/file/new_drama/', `profile_image`.`bf_file`)
    ELSE NULL
  END AS `profile_image_path`,
  NULLIF(TRIM(`profile_image`.`bf_source`), '') AS `profile_image_original_name`,
  CASE
    WHEN `thumbnail`.`bf_file` IS NOT NULL THEN CONCAT(`host`.`base_url`, '/web/data/file/new_drama/', `thumbnail`.`bf_file`)
    ELSE NULL
  END AS `thumbnail_url`,
  CASE
    WHEN `thumbnail`.`bf_file` IS NOT NULL THEN CONCAT('/web/data/file/new_drama/', `thumbnail`.`bf_file`)
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
    'files', JSON_OBJECT(
      'profileImage', JSON_OBJECT(
        'url', CASE
          WHEN `profile_image`.`bf_file` IS NOT NULL THEN CONCAT(`host`.`base_url`, '/web/data/file/new_drama/', `profile_image`.`bf_file`)
          ELSE NULL
        END,
        'path', CASE
          WHEN `profile_image`.`bf_file` IS NOT NULL THEN CONCAT('/web/data/file/new_drama/', `profile_image`.`bf_file`)
          ELSE NULL
        END,
        'originalName', NULLIF(TRIM(`profile_image`.`bf_source`), ''),
        'fileName', `profile_image`.`bf_file`,
        'filesize', `profile_image`.`bf_filesize`
      ),
      'thumbnail', JSON_OBJECT(
        'url', CASE
          WHEN `thumbnail`.`bf_file` IS NOT NULL THEN CONCAT(`host`.`base_url`, '/web/data/file/new_drama/', `thumbnail`.`bf_file`)
          ELSE NULL
        END,
        'path', CASE
          WHEN `thumbnail`.`bf_file` IS NOT NULL THEN CONCAT('/web/data/file/new_drama/', `thumbnail`.`bf_file`)
          ELSE NULL
        END,
        'originalName', NULLIF(TRIM(`thumbnail`.`bf_source`), ''),
        'fileName', `thumbnail`.`bf_file`,
        'filesize', `thumbnail`.`bf_filesize`
      )
    ),
    'links', JSON_OBJECT(
      'link1', NULLIF(TRIM(`appearance`.`wr_link1`), ''),
      'link2', NULLIF(TRIM(`appearance`.`wr_link2`), ''),
      'link1Hit', `appearance`.`wr_link1_hit`,
      'link2Hit', `appearance`.`wr_link2_hit`
    )
  ) AS `legacy_meta`
FROM `tmp_screen_appearances_all` AS `appearance`
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
) AS `profile_image`
  ON `profile_image`.`source_db` = `appearance`.`source_db`
  AND `profile_image`.`bo_table` = 'new_drama'
  AND `profile_image`.`wr_id` = `appearance`.`wr_id`
  AND `profile_image`.`bf_no` = 0
  AND NULLIF(TRIM(`profile_image`.`bf_file`), '') IS NOT NULL
LEFT JOIN (
  SELECT 'baewoo' AS `source_db`, `bo_table`, `wr_id`, `bf_no`, `bf_source`, `bf_file`, `bf_filesize` FROM `baewoo`.`g5_board_file`
  UNION ALL
  SELECT 'bnbhighteen', `bo_table`, `wr_id`, `bf_no`, `bf_source`, `bf_file`, `bf_filesize` FROM `bnbhighteen`.`g5_board_file`
  UNION ALL
  SELECT 'kidscenter', `bo_table`, `wr_id`, `bf_no`, `bf_source`, `bf_file`, `bf_filesize` FROM `kidscenter`.`g5_board_file`
) AS `thumbnail`
  ON `thumbnail`.`source_db` = `appearance`.`source_db`
  AND `thumbnail`.`bo_table` = 'new_drama'
  AND `thumbnail`.`wr_id` = `appearance`.`wr_id`
  AND `thumbnail`.`bf_no` = 1
  AND NULLIF(TRIM(`thumbnail`.`bf_file`), '') IS NOT NULL
WHERE NULLIF(TRIM(`appearance`.`wr_subject`), '') IS NOT NULL
  AND NULLIF(TRIM(`appearance`.`wr_1`), '') IS NOT NULL
ORDER BY `appearance`.`center`, `appearance`.`wr_datetime` DESC, `appearance`.`wr_id` DESC;
