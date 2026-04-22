SET SESSION group_concat_max_len = 1048576;

CREATE DATABASE IF NOT EXISTS `bnb_legacy_work`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bnb_legacy_work`;

DROP TABLE IF EXISTS `bnb_legacy_work`.`audition_schedules`;

CREATE TABLE `bnb_legacy_work`.`audition_schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_db` varchar(32) NOT NULL,
  `source_table` varchar(64) NOT NULL,
  `source_id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `dedupe_key` char(32) NOT NULL,
  `centers` longtext NOT NULL CHECK (JSON_VALID(`centers`)),
  `event_type` varchar(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body_html` mediumtext DEFAULT NULL,
  `schedule_start_date` date NOT NULL,
  `schedule_end_date` date NOT NULL,
  `schedule_start_raw` varchar(32) NOT NULL,
  `schedule_end_raw` varchar(32) NOT NULL,
  `author_name` varchar(255) DEFAULT NULL,
  `published_at` datetime NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `legacy_meta` longtext DEFAULT NULL CHECK (JSON_VALID(`legacy_meta`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `audition_schedules_slug_idx` (`slug`),
  UNIQUE KEY `audition_schedules_dedupe_key_idx` (`dedupe_key`),
  KEY `audition_schedules_date_idx` (`schedule_start_date`, `schedule_end_date`),
  KEY `audition_schedules_type_idx` (`event_type`),
  KEY `audition_schedules_source_idx` (`source_db`, `source_table`, `source_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TEMPORARY TABLE IF EXISTS `tmp_audition_schedules_all`;

CREATE TEMPORARY TABLE `tmp_audition_schedules_all` AS
SELECT
  'baewoo' AS `source_db`,
  'art' AS `center`,
  1 AS `source_priority`,
  'g5_write_new_calendar02' AS `source_table`,
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`
FROM `baewoo`.`g5_write_new_calendar02`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'bnbhighteen' AS `source_db`,
  'highteen' AS `center`,
  2 AS `source_priority`,
  'g5_write_new_calendar02' AS `source_table`,
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`
FROM `bnbhighteen`.`g5_write_new_calendar02`
WHERE `wr_is_comment` = 0
UNION ALL
SELECT
  'kidscenter' AS `source_db`,
  'kids' AS `center`,
  3 AS `source_priority`,
  'g5_write_new_calendar' AS `source_table`,
  `wr_id`, `wr_num`, `wr_reply`, `wr_parent`, `wr_is_comment`, `wr_comment`, `wr_comment_reply`,
  `ca_name`, `wr_option`, `wr_subject`, `wr_content`, `wr_link1`, `wr_link2`, `wr_link1_hit`,
  `wr_link2_hit`, `wr_hit`, `wr_good`, `wr_nogood`, `mb_id`, `wr_name`, `wr_email`,
  `wr_homepage`, `wr_datetime`, `wr_file`, `wr_last`, `wr_ip`, `wr_facebook_user`,
  `wr_twitter_user`, `wr_1`, `wr_2`, `wr_3`, `wr_4`, `wr_5`, `wr_6`, `wr_7`, `wr_8`,
  `wr_9`, `wr_10`
FROM `kidscenter`.`g5_write_new_calendar`
WHERE `wr_is_comment` = 0;

DROP TEMPORARY TABLE IF EXISTS `tmp_audition_schedules_normalized`;

CREATE TEMPORARY TABLE `tmp_audition_schedules_normalized` AS
SELECT
  `base`.*,
  NULLIF(TRIM(REGEXP_REPLACE(`base`.`wr_subject`, '<[^>]+>', '')), '') AS `normalized_title`,
  TRIM(`base`.`wr_1`) AS `schedule_start_raw`,
  TRIM(`base`.`wr_2`) AS `schedule_end_raw`,
  CASE
    WHEN CONCAT(`base`.`wr_subject`, ' ', `base`.`wr_content`) LIKE '%오디션%' THEN 'audition'
    WHEN CONCAT(`base`.`wr_subject`, ' ', `base`.`wr_content`) LIKE '%촬영%' THEN 'shooting'
    ELSE 'schedule'
  END AS `event_type`
FROM `tmp_audition_schedules_all` AS `base`
WHERE TRIM(`base`.`wr_subject`) <> ''
  AND TRIM(`base`.`wr_1`) REGEXP '^[0-9]{8}$'
  AND TRIM(`base`.`wr_2`) REGEXP '^[0-9]{8}$';

DROP TEMPORARY TABLE IF EXISTS `tmp_audition_schedule_representatives`;

CREATE TEMPORARY TABLE `tmp_audition_schedule_representatives` AS
SELECT *
FROM (
  SELECT
    `tmp_audition_schedules_normalized`.*,
    ROW_NUMBER() OVER (
      PARTITION BY `normalized_title`, `schedule_start_raw`, `schedule_end_raw`
      ORDER BY `source_priority`, `wr_id`
    ) AS `representative_rank`
  FROM `tmp_audition_schedules_normalized`
) AS `ranked_schedules`
WHERE `representative_rank` = 1;

INSERT INTO `bnb_legacy_work`.`audition_schedules` (
  `source_db`,
  `source_table`,
  `source_id`,
  `slug`,
  `dedupe_key`,
  `centers`,
  `event_type`,
  `title`,
  `body_html`,
  `schedule_start_date`,
  `schedule_end_date`,
  `schedule_start_raw`,
  `schedule_end_raw`,
  `author_name`,
  `published_at`,
  `created_at`,
  `updated_at`,
  `legacy_meta`
)
SELECT
  `representative`.`source_db`,
  `representative`.`source_table`,
  `representative`.`wr_id` AS `source_id`,
  CONCAT('audition-schedule-', `representative`.`source_db`, '-', `representative`.`wr_id`) AS `slug`,
  MD5(CONCAT_WS('|', `representative`.`normalized_title`, `representative`.`schedule_start_raw`, `representative`.`schedule_end_raw`)) AS `dedupe_key`,
  (
    SELECT CONCAT('[', GROUP_CONCAT(DISTINCT JSON_QUOTE(`source`.`center`) ORDER BY FIELD(`source`.`center`, 'art', 'highteen', 'kids') SEPARATOR ','), ']')
    FROM `tmp_audition_schedules_normalized` AS `source`
    WHERE `source`.`normalized_title` = `representative`.`normalized_title`
      AND `source`.`schedule_start_raw` = `representative`.`schedule_start_raw`
      AND `source`.`schedule_end_raw` = `representative`.`schedule_end_raw`
  ) AS `centers`,
  `representative`.`event_type`,
  `representative`.`normalized_title` AS `title`,
  NULLIF(`representative`.`wr_content`, '') AS `body_html`,
  STR_TO_DATE(`representative`.`schedule_start_raw`, '%Y%m%d') AS `schedule_start_date`,
  STR_TO_DATE(`representative`.`schedule_end_raw`, '%Y%m%d') AS `schedule_end_date`,
  `representative`.`schedule_start_raw`,
  `representative`.`schedule_end_raw`,
  NULLIF(TRIM(`representative`.`wr_name`), '') AS `author_name`,
  COALESCE(NULLIF(`representative`.`wr_datetime`, '0000-00-00 00:00:00'), CURRENT_TIMESTAMP) AS `published_at`,
  COALESCE(NULLIF(`representative`.`wr_datetime`, '0000-00-00 00:00:00'), CURRENT_TIMESTAMP) AS `created_at`,
  CURRENT_TIMESTAMP AS `updated_at`,
  JSON_OBJECT(
    'selectedSource', JSON_OBJECT(
      'sourceDb', `representative`.`source_db`,
      'center', `representative`.`center`,
      'sourceTable', `representative`.`source_table`,
      'sourceId', `representative`.`wr_id`
    ),
    'sources', (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'sourceDb', `source`.`source_db`,
          'center', `source`.`center`,
          'sourceTable', `source`.`source_table`,
          'sourceId', `source`.`wr_id`,
          'title', `source`.`wr_subject`,
          'startRaw', `source`.`schedule_start_raw`,
          'endRaw', `source`.`schedule_end_raw`,
          'publishedAt', `source`.`wr_datetime`
        )
        ORDER BY `source`.`source_priority`, `source`.`wr_id`
      )
      FROM `tmp_audition_schedules_normalized` AS `source`
      WHERE `source`.`normalized_title` = `representative`.`normalized_title`
        AND `source`.`schedule_start_raw` = `representative`.`schedule_start_raw`
        AND `source`.`schedule_end_raw` = `representative`.`schedule_end_raw`
    ),
    'rawFields', JSON_OBJECT(
      'wr1', `representative`.`wr_1`,
      'wr2', `representative`.`wr_2`,
      'wr3', `representative`.`wr_3`,
      'wr4', `representative`.`wr_4`,
      'wr5', `representative`.`wr_5`,
      'wr6', `representative`.`wr_6`,
      'wr7', `representative`.`wr_7`,
      'wr8', `representative`.`wr_8`,
      'wr9', `representative`.`wr_9`,
      'wr10', `representative`.`wr_10`
    ),
    'wrFile', NULLIF(TRIM(`representative`.`wr_file`), ''),
    'wrHit', `representative`.`wr_hit`,
    'wrParent', `representative`.`wr_parent`,
    'wrNum', `representative`.`wr_num`,
    'wrOption', NULLIF(TRIM(`representative`.`wr_option`), ''),
    'links', JSON_OBJECT(
      'link1', NULLIF(TRIM(`representative`.`wr_link1`), ''),
      'link2', NULLIF(TRIM(`representative`.`wr_link2`), ''),
      'link1Hit', `representative`.`wr_link1_hit`,
      'link2Hit', `representative`.`wr_link2_hit`
    )
  ) AS `legacy_meta`
FROM `tmp_audition_schedule_representatives` AS `representative`
ORDER BY `representative`.`schedule_start_raw` DESC, `representative`.`source_priority`, `representative`.`wr_id`;
